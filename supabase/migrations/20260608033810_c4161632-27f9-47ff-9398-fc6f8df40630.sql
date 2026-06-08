
-- ============================================================
-- Phase 3C: Paid access enforcement, bundles, and access grants
-- ============================================================

-- 1) Enums --------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.access_source AS ENUM ('free','plan','purchase','bundle','manual','admin_override');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.space_access  ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.course_access ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.event_access  ADD VALUE IF NOT EXISTS 'paid';

-- 2) bundles ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stripe_product_id text,
  stripe_price_id text,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bundles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundles TO authenticated;
GRANT ALL ON public.bundles TO service_role;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read active bundles (anon)" ON public.bundles FOR SELECT TO anon USING (active);
CREATE POLICY "Read bundles (auth)" ON public.bundles FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage bundles" ON public.bundles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_bundles_updated BEFORE UPDATE ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) bundle_items -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  target_type public.plan_item_target_type NOT NULL,
  target_id uuid,
  access_level public.plan_access_level NOT NULL DEFAULT 'full_access',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bundle_items_bundle_idx ON public.bundle_items(bundle_id);
GRANT SELECT ON public.bundle_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_items TO authenticated;
GRANT ALL ON public.bundle_items TO service_role;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of active bundles (anon)" ON public.bundle_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_items.bundle_id AND b.active));
CREATE POLICY "Read items of bundles (auth)" ON public.bundle_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_items.bundle_id
                 AND (b.active OR public.has_role(auth.uid(),'platform_admin'))));
CREATE POLICY "Admin manage bundle items" ON public.bundle_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- 4) access_grants ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type public.plan_item_target_type NOT NULL,
  target_id uuid,
  access_source public.access_source NOT NULL DEFAULT 'manual',
  source_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_grants_user_idx ON public.access_grants(user_id);
CREATE INDEX IF NOT EXISTS access_grants_target_idx ON public.access_grants(target_type, target_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_grants TO authenticated;
GRANT ALL ON public.access_grants TO service_role;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own grants" ON public.access_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admin manage grants" ON public.access_grants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_access_grants_updated BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) purchases.bundle_id -----------------------------------------------
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES public.bundles(id) ON DELETE SET NULL;

-- 6) has_access() function ---------------------------------------------
CREATE OR REPLACE FUNCTION public.has_access(
  _user_id uuid,
  _target_type public.plan_item_target_type,
  _target_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- Admin override
    public.has_role(_user_id, 'platform_admin')
    -- Direct active access grant (target-specific or platform-wide)
    OR EXISTS (
      SELECT 1 FROM public.access_grants g
      WHERE g.user_id = _user_id AND g.active
        AND (g.starts_at IS NULL OR g.starts_at <= now())
        AND (g.ends_at IS NULL OR g.ends_at > now())
        AND (
          (g.target_type = 'platform')
          OR (g.target_type = _target_type AND g.target_id = _target_id)
        )
    )
    -- Plan-item access via active subscription
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.plan_items pi ON pi.plan_id = s.plan_id
      WHERE s.user_id = _user_id
        AND s.status IN ('active','trialing')
        AND (
          (pi.target_type = 'platform')
          OR (pi.target_type = _target_type AND pi.target_id = _target_id)
        )
    )
    -- Direct one-time paid purchase
    OR EXISTS (
      SELECT 1 FROM public.purchases pu
      WHERE pu.user_id = _user_id AND pu.status = 'paid'
        AND pu.target_type = _target_type AND pu.target_id = _target_id
    )
    -- Bundle purchase containing this target
    OR EXISTS (
      SELECT 1 FROM public.purchases pu
      JOIN public.bundle_items bi ON bi.bundle_id = pu.bundle_id
      WHERE pu.user_id = _user_id AND pu.status = 'paid' AND pu.bundle_id IS NOT NULL
        AND (
          (bi.target_type = 'platform')
          OR (bi.target_type = _target_type AND bi.target_id = _target_id)
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_access(uuid, public.plan_item_target_type, uuid) TO authenticated, anon;
