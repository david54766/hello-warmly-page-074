
CREATE TYPE public.automation_log_status AS ENUM ('pending','success','failed','skipped');

CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  conditions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_run_at TIMESTAMPTZ,
  total_runs INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automations"
  ON public.automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  status public.automation_log_status NOT NULL DEFAULT 'pending',
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read automation logs"
  ON public.automation_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins insert automation logs"
  ON public.automation_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins delete automation logs"
  ON public.automation_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE INDEX idx_automation_logs_automation ON public.automation_logs(automation_id, created_at DESC);
CREATE INDEX idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX idx_automations_active ON public.automations(active);
