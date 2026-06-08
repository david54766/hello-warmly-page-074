
-- Enums
DO $$ BEGIN CREATE TYPE public.coupon_discount_type AS ENUM ('percent','fixed_amount'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.coupon_applies_to_type AS ENUM ('all','plan','bundle','course','event','space'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.trial_status AS ENUM ('active','converted','expired','canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend notification_type enum (safe-add)
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'trial_started';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'trial_ending_soon';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'trial_expired';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'coupon_applied';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'access_expiring';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'access_expired';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_canceled';
EXCEPTION WHEN others THEN NULL; END $$;

-- coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type public.coupon_discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  applies_to_type public.coupon_applies_to_type NOT NULL DEFAULT 'all',
  applies_to_id uuid,
  max_uses integer,
  times_used integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Read active coupons" ON public.coupons FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- coupon_redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  checkout_session_id uuid,
  purchase_id uuid,
  subscription_id uuid,
  amount_discounted numeric NOT NULL DEFAULT 0,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage redemptions" ON public.coupon_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Read own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Insert own redemption" ON public.coupon_redemptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

-- trial_records
CREATE TABLE IF NOT EXISTS public.trial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  status public.trial_status NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  converted_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trial_records TO authenticated;
GRANT ALL ON public.trial_records TO service_role;
ALTER TABLE public.trial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage trials" ON public.trial_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Read own trials" ON public.trial_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Insert own trial" ON public.trial_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own trial" ON public.trial_records FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_trial_records_user ON public.trial_records(user_id);
CREATE TRIGGER update_trial_records_updated_at BEFORE UPDATE ON public.trial_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coupon validation function (returns jsonb { valid, reason, discount_type, discount_value, coupon_id })
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _code text,
  _applies_to_type public.coupon_applies_to_type DEFAULT 'all',
  _applies_to_id uuid DEFAULT NULL,
  _amount numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; v_discount numeric := 0;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_found'); END IF;
  IF NOT c.active THEN RETURN jsonb_build_object('valid', false, 'reason', 'inactive'); END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_started'); END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at <= now() THEN RETURN jsonb_build_object('valid', false, 'reason', 'expired'); END IF;
  IF c.max_uses IS NOT NULL AND c.times_used >= c.max_uses THEN RETURN jsonb_build_object('valid', false, 'reason', 'maxed_out'); END IF;
  IF c.applies_to_type <> 'all' AND (c.applies_to_type <> _applies_to_type OR c.applies_to_id IS DISTINCT FROM _applies_to_id) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'wrong_target');
  END IF;
  IF c.discount_type = 'percent' THEN v_discount := round((COALESCE(_amount,0) * c.discount_value / 100.0)::numeric, 2);
  ELSE v_discount := LEAST(COALESCE(_amount,0), c.discount_value); END IF;
  RETURN jsonb_build_object(
    'valid', true, 'coupon_id', c.id, 'code', c.code,
    'discount_type', c.discount_type, 'discount_value', c.discount_value,
    'discount_amount', v_discount
  );
END $$;

-- Active grant helper
CREATE OR REPLACE FUNCTION public.is_grant_active(g public.access_grants) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT g.active
     AND (g.starts_at IS NULL OR g.starts_at <= now())
     AND (g.ends_at IS NULL OR g.ends_at > now())
$$;
