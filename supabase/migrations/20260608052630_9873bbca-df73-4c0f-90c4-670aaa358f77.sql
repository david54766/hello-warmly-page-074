
CREATE TYPE public.content_flag_target AS ENUM ('post','comment','message','user','event','course','lesson','announcement');
CREATE TYPE public.content_flag_type AS ENUM ('spam','harassment','inappropriate','misinformation','off_topic','security_concern','other');
CREATE TYPE public.content_flag_severity AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.content_flag_status AS ENUM ('open','under_review','resolved','dismissed');
CREATE TYPE public.user_warning_type AS ENUM ('general','content_violation','behavior','spam','harassment','final_warning');
CREATE TYPE public.user_warning_status AS ENUM ('active','acknowledged','dismissed');
CREATE TYPE public.audit_target_type AS ENUM ('user','space','post','comment','message','course','lesson','event','plan','coupon','bundle','automation','announcement','segment','access_grant','badge','points','settings','subscription','other');

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'warning_issued';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'account_suspended';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'account_reactivated';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'report_resolved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'content_restored';

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('platform_admin','moderator'))
$$;

CREATE TABLE public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.content_flag_target NOT NULL,
  target_id uuid NOT NULL,
  flag_type public.content_flag_type NOT NULL DEFAULT 'other',
  severity public.content_flag_severity NOT NULL DEFAULT 'medium',
  status public.content_flag_status NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_flags_status ON public.content_flags(status);
CREATE INDEX idx_content_flags_target ON public.content_flags(target_type, target_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_flags TO authenticated;
GRANT ALL ON public.content_flags TO service_role;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mods manage flags" ON public.content_flags FOR ALL TO authenticated
  USING (public.is_moderator_or_admin(auth.uid())) WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE TRIGGER update_content_flags_updated_at BEFORE UPDATE ON public.content_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.moderator_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text,
  target_id uuid,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_notes_user ON public.moderator_notes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderator_notes TO authenticated;
GRANT ALL ON public.moderator_notes TO service_role;
ALTER TABLE public.moderator_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mods manage notes" ON public.moderator_notes FOR ALL TO authenticated
  USING (public.is_moderator_or_admin(auth.uid())) WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE TRIGGER update_mod_notes_updated_at BEFORE UPDATE ON public.moderator_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warning_type public.user_warning_type NOT NULL DEFAULT 'general',
  reason text NOT NULL,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  status public.user_warning_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_warnings_user ON public.user_warnings(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_warnings TO authenticated;
GRANT ALL ON public.user_warnings TO service_role;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mods manage warnings" ON public.user_warnings FOR ALL TO authenticated
  USING (public.is_moderator_or_admin(auth.uid())) WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "users see own warnings" ON public.user_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "users acknowledge own warnings" ON public.user_warnings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER update_warnings_updated_at BEFORE UPDATE ON public.user_warnings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_type public.audit_target_type,
  target_id uuid,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address_placeholder text,
  user_agent_placeholder text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action_type);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "mods insert audit" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

CREATE TABLE public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type text NOT NULL,
  period text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_snap_type_period ON public.analytics_snapshots(snapshot_type, period);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_snapshots TO authenticated;
GRANT ALL ON public.analytics_snapshots TO service_role;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage snapshots" ON public.analytics_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _target_type public.audit_target_type, _target_id uuid, _details jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action_type, target_type, target_id, details_json)
    VALUES (auth.uid(), _action, _target_type, _target_id, COALESCE(_details,'{}'::jsonb))
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.suspend_user(_user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'platform_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET status = 'suspended' WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action_type, target_type, target_id, details_json)
    VALUES (auth.uid(), 'user_suspended', 'user', _user_id, jsonb_build_object('reason', _reason));
  PERFORM public.create_notification(_user_id, 'account_suspended', 'Your account has been suspended', COALESCE(_reason,'Contact support for details.'), 'user', _user_id, auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.reactivate_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'platform_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET status = 'active' WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action_type, target_type, target_id, details_json)
    VALUES (auth.uid(), 'user_reactivated', 'user', _user_id, '{}'::jsonb);
  PERFORM public.create_notification(_user_id, 'account_reactivated', 'Your account has been reactivated', 'Welcome back.', 'user', _user_id, auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.issue_warning(_user_id uuid, _type public.user_warning_type, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_moderator_or_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.user_warnings (user_id, warning_type, reason, issued_by)
    VALUES (_user_id, _type, _reason, auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.audit_logs (actor_id, action_type, target_type, target_id, details_json)
    VALUES (auth.uid(), 'warning_issued', 'user', _user_id, jsonb_build_object('warning_id', v_id, 'type', _type, 'reason', _reason));
  PERFORM public.create_notification(_user_id, 'warning_issued', 'You received a warning', _reason, 'user', _user_id, auth.uid());
  RETURN v_id;
END $$;

CREATE OR REPLACE VIEW public.at_risk_members AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.last_active_at,
  p.onboarding_completed,
  p.created_at,
  p.status,
  CASE WHEN p.last_active_at IS NULL OR p.last_active_at < now() - interval '14 days' THEN true ELSE false END AS inactive_14d,
  CASE WHEN COALESCE(p.onboarding_completed, false) = false THEN true ELSE false END AS onboarding_incomplete,
  (SELECT COUNT(*) FROM public.posts po WHERE po.author_id = p.id AND po.status = 'active') AS post_count,
  (SELECT COUNT(*) FROM public.user_warnings uw WHERE uw.user_id = p.id AND uw.status = 'active') AS active_warnings,
  EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id AND s.status = 'past_due') AS past_due,
  EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id AND s.status = 'trialing' AND s.trial_end IS NOT NULL AND s.trial_end < now() + interval '3 days') AS trial_ending_soon
FROM public.profiles p;
GRANT SELECT ON public.at_risk_members TO authenticated;
