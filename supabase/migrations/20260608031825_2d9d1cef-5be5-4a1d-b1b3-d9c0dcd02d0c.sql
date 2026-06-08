
-- Enums
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.purchase_status AS ENUM ('pending','paid','failed','refunded','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.checkout_session_status AS ENUM ('created','pending','completed','expired','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.purchase_kind AS ENUM ('subscription','one_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','open','paid','uncollectible','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend notification_type enum
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'checkout_completed'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_failed'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_active'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_canceled'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invoice_paid'; EXCEPTION WHEN others THEN NULL; END $$;

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status public.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_type public.purchase_kind NOT NULL DEFAULT 'one_time',
  target_type public.plan_item_target_type,
  target_id uuid,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id text,
  status public.purchase_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own purchases" ON public.purchases FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage purchases" ON public.purchases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- checkout_sessions
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  target_type public.plan_item_target_type,
  target_id uuid,
  stripe_session_id text,
  status public.checkout_session_status NOT NULL DEFAULT 'created',
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own checkout sessions" ON public.checkout_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Users create own checkout sessions" ON public.checkout_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage checkout sessions" ON public.checkout_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id text UNIQUE,
  amount_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  hosted_invoice_url text,
  invoice_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own invoices" ON public.invoices FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- payment_webhook_events
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_webhook_events TO service_role;
GRANT SELECT ON public.payment_webhook_events TO authenticated;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read webhook events" ON public.payment_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage webhook events" ON public.payment_webhook_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'platform_admin')) WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- updated_at triggers
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_checkout_sessions_updated BEFORE UPDATE ON public.checkout_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample data for first user (if any)
DO $$
DECLARE v_user uuid; v_plan_monthly uuid; v_plan_annual uuid; v_sub uuid;
BEGIN
  SELECT id INTO v_user FROM public.profiles ORDER BY created_at LIMIT 1;
  IF v_user IS NULL THEN RETURN; END IF;
  SELECT id INTO v_plan_monthly FROM public.plans WHERE billing_interval='monthly' LIMIT 1;
  SELECT id INTO v_plan_annual FROM public.plans WHERE billing_interval='annual' LIMIT 1;

  INSERT INTO public.subscriptions (user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end)
  VALUES (v_user, v_plan_monthly, 'cus_demo_001', 'sub_demo_001', 'active', now() - interval '5 days', now() + interval '25 days')
  RETURNING id INTO v_sub;

  INSERT INTO public.purchases (user_id, purchase_type, plan_id, amount, currency, status, stripe_payment_intent_id)
  VALUES (v_user, 'subscription', v_plan_monthly, 29, 'USD', 'paid', 'pi_demo_001');

  INSERT INTO public.invoices (user_id, subscription_id, stripe_invoice_id, amount_due, amount_paid, currency, status, hosted_invoice_url)
  VALUES (v_user, v_sub, 'in_demo_001', 29, 29, 'USD', 'paid', 'https://invoice.stripe.com/demo');

  INSERT INTO public.checkout_sessions (user_id, plan_id, stripe_session_id, status, checkout_url)
  VALUES (v_user, v_plan_annual, 'cs_demo_001', 'completed', 'https://checkout.stripe.com/demo');

  INSERT INTO public.payment_webhook_events (stripe_event_id, event_type, payload_json, processed, processed_at)
  VALUES
    ('evt_demo_001','checkout.session.completed','{"demo":true}'::jsonb, true, now()),
    ('evt_demo_002','invoice.payment_succeeded','{"demo":true}'::jsonb, true, now()),
    ('evt_demo_003','invoice.payment_failed','{"demo":true,"reason":"card_declined"}'::jsonb, false, NULL);
END $$;
