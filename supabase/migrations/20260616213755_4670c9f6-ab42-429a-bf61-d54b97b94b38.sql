
-- Enums
DO $$ BEGIN CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','expired','canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.certificate_status AS ENUM ('issued','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend notification_type enum
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invitation_accepted'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'certificate_issued'; EXCEPTION WHEN others THEN NULL; END $$;

-- search_events
CREATE TABLE IF NOT EXISTS public.search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.search_events TO authenticated;
GRANT ALL ON public.search_events TO service_role;
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own search events" ON public.search_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own search events" ON public.search_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own search events" ON public.search_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS search_events_user_created_idx ON public.search_events (user_id, created_at DESC);

-- invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  personal_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invitations" ON public.invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Users read own accepted invitation" ON public.invitations FOR SELECT TO authenticated
  USING (accepted_by = auth.uid());
CREATE TRIGGER trg_invitations_updated_at BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS invitations_status_idx ON public.invitations (status, created_at DESC);

-- invite_links
CREATE TABLE IF NOT EXISTS public.invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  role public.app_role NOT NULL DEFAULT 'member',
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_links TO authenticated;
GRANT ALL ON public.invite_links TO service_role;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invite_links" ON public.invite_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_invite_links_updated_at BEFORE UPDATE ON public.invite_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed reads active certificates" ON public.certificates FOR SELECT TO authenticated USING (active);
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_certificates
CREATE TABLE IF NOT EXISTS public.user_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_url TEXT,
  status public.certificate_status NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, certificate_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_certificates TO authenticated;
GRANT ALL ON public.user_certificates TO service_role;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own certificates" ON public.user_certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admins manage user certificates" ON public.user_certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_user_certificates_updated_at BEFORE UPDATE ON public.user_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public lookup for invite tokens (RPCs, bypass RLS)
CREATE OR REPLACE FUNCTION public.lookup_invitation_by_token(_token TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.invitations%ROWTYPE; v_space_name TEXT;
BEGIN
  SELECT * INTO v FROM public.invitations WHERE token = _token;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  IF v.space_id IS NOT NULL THEN SELECT name INTO v_space_name FROM public.spaces WHERE id = v.space_id; END IF;
  RETURN jsonb_build_object(
    'found', true, 'id', v.id, 'email', v.email, 'role', v.role,
    'space_id', v.space_id, 'space_name', v_space_name, 'status', v.status,
    'expires_at', v.expires_at, 'personal_message', v.personal_message
  );
END $$;

CREATE OR REPLACE FUNCTION public.lookup_invite_link_by_token(_token TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.invite_links%ROWTYPE; v_space_name TEXT;
BEGIN
  SELECT * INTO v FROM public.invite_links WHERE token = _token;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  IF v.space_id IS NOT NULL THEN SELECT name INTO v_space_name FROM public.spaces WHERE id = v.space_id; END IF;
  RETURN jsonb_build_object(
    'found', true, 'id', v.id, 'name', v.name, 'role', v.role,
    'space_id', v.space_id, 'space_name', v_space_name, 'active', v.active,
    'expires_at', v.expires_at, 'max_uses', v.max_uses, 'uses_count', v.uses_count
  );
END $$;
GRANT EXECUTE ON FUNCTION public.lookup_invitation_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_invite_link_by_token(TEXT) TO anon, authenticated;

-- Accept invitation/link
CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.invitations%ROWTYPE; v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not authenticated'); END IF;
  SELECT * INTO v FROM public.invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not found'); END IF;
  IF v.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'invitation '||v.status::text); END IF;
  IF v.expires_at IS NOT NULL AND v.expires_at < now() THEN
    UPDATE public.invitations SET status='expired' WHERE id=v.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;
  -- Assign role
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, v.role) ON CONFLICT DO NOTHING;
  -- Add to space
  IF v.space_id IS NOT NULL THEN
    INSERT INTO public.space_members (space_id, user_id, role, status)
      VALUES (v.space_id, v_uid, 'space_member', 'active')
      ON CONFLICT (space_id, user_id) DO UPDATE SET status='active';
  END IF;
  UPDATE public.invitations SET status='accepted', accepted_by=v_uid, accepted_at=now() WHERE id=v.id;
  IF v.invited_by IS NOT NULL THEN
    PERFORM public.create_notification(v.invited_by, 'invitation_accepted', 'Invitation accepted', v.email||' joined.', 'user', v_uid, v_uid);
  END IF;
  RETURN jsonb_build_object('ok', true, 'space_id', v.space_id);
END $$;

CREATE OR REPLACE FUNCTION public.accept_invite_link(_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.invite_links%ROWTYPE; v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not authenticated'); END IF;
  SELECT * INTO v FROM public.invite_links WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not found'); END IF;
  IF NOT v.active THEN RETURN jsonb_build_object('ok', false, 'error', 'inactive'); END IF;
  IF v.expires_at IS NOT NULL AND v.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  IF v.max_uses IS NOT NULL AND v.uses_count >= v.max_uses THEN RETURN jsonb_build_object('ok', false, 'error', 'max uses reached'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, v.role) ON CONFLICT DO NOTHING;
  IF v.space_id IS NOT NULL THEN
    INSERT INTO public.space_members (space_id, user_id, role, status)
      VALUES (v.space_id, v_uid, 'space_member', 'active')
      ON CONFLICT (space_id, user_id) DO UPDATE SET status='active';
  END IF;
  UPDATE public.invite_links SET uses_count = uses_count + 1 WHERE id = v.id;
  RETURN jsonb_build_object('ok', true, 'space_id', v.space_id);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite_link(TEXT) TO authenticated;

-- Auto-issue certificate on course completion
CREATE OR REPLACE FUNCTION public.tg_issue_certificate_on_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course UUID; v_total INT; v_done INT; v_cert public.certificates%ROWTYPE; v_uc_id UUID;
BEGIN
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN RETURN NEW; END IF;
  SELECT course_id INTO v_course FROM public.lessons WHERE id = NEW.lesson_id;
  IF v_course IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_total FROM public.lessons WHERE course_id = v_course;
  SELECT COUNT(*) INTO v_done FROM public.lesson_progress lp JOIN public.lessons l ON l.id = lp.lesson_id
    WHERE l.course_id = v_course AND lp.user_id = NEW.user_id AND lp.status = 'completed';
  IF v_total = 0 OR v_done < v_total THEN RETURN NEW; END IF;
  SELECT * INTO v_cert FROM public.certificates WHERE course_id = v_course AND active LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;
  INSERT INTO public.user_certificates (user_id, certificate_id, course_id)
    VALUES (NEW.user_id, v_cert.id, v_course)
    ON CONFLICT (user_id, certificate_id) DO NOTHING
    RETURNING id INTO v_uc_id;
  IF v_uc_id IS NOT NULL THEN
    PERFORM public.create_notification(NEW.user_id, 'certificate_issued', 'Certificate earned: '||v_cert.title, 'Congratulations on completing the course.', 'user', NEW.user_id, NULL);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_issue_certificate ON public.lesson_progress;
CREATE TRIGGER trg_issue_certificate AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_issue_certificate_on_completion();
