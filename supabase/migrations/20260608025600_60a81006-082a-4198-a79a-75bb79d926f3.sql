
-- Enums
CREATE TYPE public.plan_billing_interval AS ENUM ('free','monthly','annual','one_time');
CREATE TYPE public.plan_item_target_type AS ENUM ('platform','space','course','event','resource_placeholder');
CREATE TYPE public.plan_access_level AS ENUM ('full_access','preview_access','limited_access');

-- plans
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_interval public.plan_billing_interval NOT NULL DEFAULT 'free',
  stripe_product_id text,
  stripe_price_id text,
  trial_days integer NOT NULL DEFAULT 0,
  access_rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read active plans (public)" ON public.plans FOR SELECT TO anon USING (active = true);
CREATE POLICY "Read plans (auth)" ON public.plans FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Admin manage plans" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- plan_items
CREATE TABLE public.plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  target_type public.plan_item_target_type NOT NULL,
  target_id uuid,
  access_level public.plan_access_level NOT NULL DEFAULT 'full_access',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_items_plan ON public.plan_items(plan_id);
GRANT SELECT ON public.plan_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_items TO authenticated;
GRANT ALL ON public.plan_items TO service_role;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read plan items (public)" ON public.plan_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_items.plan_id AND p.active));
CREATE POLICY "Read plan items (auth)" ON public.plan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_items.plan_id AND (p.active OR public.has_role(auth.uid(), 'platform_admin'))));
CREATE POLICY "Admin manage plan items" ON public.plan_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- billing_settings (singleton)
CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_publishable_key text,
  stripe_secret_key_placeholder text,
  stripe_webhook_secret_placeholder text,
  currency text NOT NULL DEFAULT 'USD',
  tax_behavior text NOT NULL DEFAULT 'exclusive',
  billing_support_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_settings TO authenticated;
GRANT ALL ON public.billing_settings TO service_role;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
-- Only admins can read full row (which contains secret placeholders)
CREATE POLICY "Admin read billing settings" ON public.billing_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Admin manage billing settings" ON public.billing_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER trg_billing_settings_updated BEFORE UPDATE ON public.billing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public-safe billing view (no secret fields) for members
CREATE OR REPLACE VIEW public.billing_settings_public AS
  SELECT id, stripe_publishable_key, currency, tax_behavior, billing_support_email, updated_at
  FROM public.billing_settings;
GRANT SELECT ON public.billing_settings_public TO anon, authenticated;

-- Seed billing_settings row
INSERT INTO public.billing_settings (currency, tax_behavior, billing_support_email)
VALUES ('USD','exclusive','support@example.com');

-- Seed plans
INSERT INTO public.plans (name, description, price, currency, billing_interval, featured, sort_order, access_rules_json)
VALUES
  ('Free', 'Get started with public Spaces, free posts, and community events.', 0, 'USD', 'free', false, 1, '{"summary":"Free public content"}'::jsonb),
  ('Monthly', 'Premium Spaces, full course library, and member-only events.', 29, 'USD', 'monthly', true, 2, '{"summary":"Premium access billed monthly"}'::jsonb),
  ('Annual', 'Everything in Monthly, billed yearly. Save with annual pricing.', 290, 'USD', 'annual', false, 3, '{"summary":"Premium access billed annually"}'::jsonb),
  ('VIP', 'All access plus the private VIP Space and priority support.', 99, 'USD', 'monthly', false, 4, '{"summary":"VIP tier with exclusive Space"}'::jsonb);

-- Seed default plan_items (platform-wide entries)
INSERT INTO public.plan_items (plan_id, target_type, access_level)
SELECT id, 'platform'::public.plan_item_target_type, 'limited_access'::public.plan_access_level FROM public.plans WHERE name = 'Free';
INSERT INTO public.plan_items (plan_id, target_type, access_level)
SELECT id, 'platform'::public.plan_item_target_type, 'full_access'::public.plan_access_level FROM public.plans WHERE name IN ('Monthly','Annual','VIP');
