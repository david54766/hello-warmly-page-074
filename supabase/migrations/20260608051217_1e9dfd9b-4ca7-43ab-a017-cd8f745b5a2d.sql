
DO $$ BEGIN CREATE TYPE public.announcement_target_type AS ENUM ('all_members','space','segment','plan','role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.announcement_display_type AS ENUM ('banner','feed_post','notification_only','modal_placeholder'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.announcement_status AS ENUM ('draft','scheduled','sent','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  conditions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_mode TEXT NOT NULL DEFAULT 'all',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segments TO authenticated;
GRANT ALL ON public.segments TO service_role;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage segments" ON public.segments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER segments_updated BEFORE UPDATE ON public.segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (segment_id, user_id)
);
CREATE INDEX idx_segment_members_segment ON public.segment_members(segment_id);
CREATE INDEX idx_segment_members_user ON public.segment_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segment_members TO authenticated;
GRANT ALL ON public.segment_members TO service_role;
ALTER TABLE public.segment_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage segment members" ON public.segment_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Members see own segment rows" ON public.segment_members FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  target_type public.announcement_target_type NOT NULL DEFAULT 'all_members',
  target_id UUID,
  target_role TEXT,
  display_type public.announcement_display_type NOT NULL DEFAULT 'banner',
  status public.announcement_status NOT NULL DEFAULT 'draft',
  pinned BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_announcements TO authenticated;
GRANT ALL ON public.admin_announcements TO service_role;
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER admin_announcements_updated BEFORE UPDATE ON public.admin_announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.user_matches_announcement(_user_id UUID, _ann public.admin_announcements)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  CASE _ann.target_type
    WHEN 'all_members' THEN RETURN true;
    WHEN 'space' THEN RETURN _ann.target_id IS NOT NULL AND public.is_space_member(_ann.target_id, _user_id);
    WHEN 'segment' THEN RETURN EXISTS (SELECT 1 FROM public.segment_members WHERE segment_id = _ann.target_id AND user_id = _user_id);
    WHEN 'plan' THEN RETURN EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND plan_id = _ann.target_id AND status IN ('active','trialing'));
    WHEN 'role' THEN RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = COALESCE(_ann.target_role,''));
    ELSE RETURN false;
  END CASE;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $fn$;

CREATE POLICY "Admins manage announcements" ON public.admin_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Members view targeted sent announcements" ON public.admin_announcements FOR SELECT TO authenticated
  USING (status = 'sent' AND public.user_matches_announcement(auth.uid(), admin_announcements));

CREATE TABLE public.announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (announcement_id, user_id)
);
CREATE INDEX idx_announcement_views_user ON public.announcement_views(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_views TO authenticated;
GRANT ALL ON public.announcement_views TO service_role;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own views" ON public.announcement_views FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins see all views" ON public.announcement_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'));

CREATE OR REPLACE FUNCTION public.refresh_segment(_segment_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  s public.segments%ROWTYPE;
  cond JSONB;
  v_type TEXT; v_val TEXT;
  v_sql TEXT;
  v_clauses TEXT[] := ARRAY[]::TEXT[];
  v_join TEXT;
  v_count INTEGER := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'platform_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO s FROM public.segments WHERE id = _segment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'segment not found'; END IF;

  FOR cond IN SELECT * FROM jsonb_array_elements(COALESCE(s.conditions_json,'[]'::jsonb)) LOOP
    v_type := cond->>'type'; v_val := cond->>'value';
    IF v_type IS NULL THEN CONTINUE; END IF;
    IF v_type = 'role' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = %L)', v_val));
    ELSIF v_type = 'status' THEN
      v_clauses := array_append(v_clauses, format('p.status::text = %L', v_val));
    ELSIF v_type = 'tag' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.member_tags mt WHERE mt.user_id = p.id AND mt.tag = %L)', v_val));
    ELSIF v_type = 'badge' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id WHERE ub.user_id = p.id AND (b.slug = %L OR b.id::text = %L))', v_val, v_val));
    ELSIF v_type = 'points_above' THEN
      v_clauses := array_append(v_clauses, format('(SELECT COALESCE(SUM(points),0) FROM public.points_ledger pl WHERE pl.user_id = p.id) > %s', COALESCE(NULLIF(v_val,''),'0')));
    ELSIF v_type = 'points_below' THEN
      v_clauses := array_append(v_clauses, format('(SELECT COALESCE(SUM(points),0) FROM public.points_ledger pl WHERE pl.user_id = p.id) < %s', COALESCE(NULLIF(v_val,''),'0')));
    ELSIF v_type = 'plan' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.subscriptions sb WHERE sb.user_id = p.id AND sb.plan_id::text = %L AND sb.status IN (''active'',''trialing''))', v_val));
    ELSIF v_type = 'subscription_status' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.subscriptions sb WHERE sb.user_id = p.id AND sb.status::text = %L)', v_val));
    ELSIF v_type = 'space_membership' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.space_members sm WHERE sm.user_id = p.id AND sm.space_id::text = %L AND sm.status = ''active'')', v_val));
    ELSIF v_type = 'course_progress' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.lesson_progress lp JOIN public.lessons l ON l.id = lp.lesson_id WHERE lp.user_id = p.id AND l.course_id::text = %L AND lp.status = ''completed'')', v_val));
    ELSIF v_type = 'event_rsvp' THEN
      v_clauses := array_append(v_clauses, format('EXISTS (SELECT 1 FROM public.event_rsvps er WHERE er.user_id = p.id AND er.event_id::text = %L)', v_val));
    ELSIF v_type = 'last_active_before' THEN
      v_clauses := array_append(v_clauses, format('p.last_active_at IS NOT NULL AND p.last_active_at < (now() - interval %L)', COALESCE(NULLIF(v_val,''),'14 days')));
    ELSIF v_type = 'onboarding_completed' THEN
      v_clauses := array_append(v_clauses, format('p.onboarding_completed = %L', COALESCE(NULLIF(v_val,''),'true')::boolean));
    ELSIF v_type = 'joined_after' THEN
      v_clauses := array_append(v_clauses, format('p.created_at > %L::timestamptz', v_val));
    ELSIF v_type = 'joined_before' THEN
      v_clauses := array_append(v_clauses, format('p.created_at < %L::timestamptz', v_val));
    ELSIF v_type = 'no_posts' THEN
      v_clauses := array_append(v_clauses, 'NOT EXISTS (SELECT 1 FROM public.posts po WHERE po.author_id = p.id AND po.status = ''active'')');
    END IF;
  END LOOP;

  v_join := CASE WHEN s.match_mode = 'any' THEN ' OR ' ELSE ' AND ' END;
  IF array_length(v_clauses,1) IS NULL THEN
    v_sql := 'SELECT p.id FROM public.profiles p WHERE false';
  ELSE
    v_sql := 'SELECT p.id FROM public.profiles p WHERE ' || array_to_string(v_clauses, v_join);
  END IF;

  DELETE FROM public.segment_members WHERE segment_id = _segment_id;
  EXECUTE format('INSERT INTO public.segment_members (segment_id, user_id) SELECT %L::uuid, x.id FROM (%s) x ON CONFLICT DO NOTHING', _segment_id, v_sql);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.segments SET last_refreshed_at = now() WHERE id = _segment_id;
  RETURN v_count;
END $fn$;

CREATE OR REPLACE FUNCTION public.send_announcement(_announcement_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  a public.admin_announcements%ROWTYPE;
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'platform_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO a FROM public.admin_announcements WHERE id = _announcement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;

  UPDATE public.admin_announcements SET status = 'sent', sent_at = COALESCE(sent_at, now()) WHERE id = _announcement_id;
  SELECT * INTO a FROM public.admin_announcements WHERE id = _announcement_id;

  FOR r IN SELECT p.id AS user_id FROM public.profiles p WHERE public.user_matches_announcement(p.id, a) LOOP
    BEGIN
      PERFORM public.create_notification(
        r.user_id, 'admin_announcement'::public.notification_type,
        a.title, LEFT(COALESCE(a.body,''), 240),
        'user'::public.notification_target, _announcement_id, a.created_by
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  RETURN v_count;
END $fn$;
