
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS social_links_json jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Normalize any null status
UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status NOT IN ('active','inactive','suspended','removed');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','inactive','suspended','removed'));

-- Allow admins to view all user_roles (already exists), and let everyone authenticated read role rows for visible profiles
DROP POLICY IF EXISTS "Authenticated read all roles" ON public.user_roles;
CREATE POLICY "Authenticated read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- Tighten posting: suspended/removed users cannot post regardless of membership
CREATE OR REPLACE FUNCTION public.can_post_in_space(_space_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.spaces s
    JOIN public.profiles p ON p.id = _user_id
    WHERE s.id = _space_id
      AND NOT s.is_archived
      AND p.status = 'active'
      AND (
        public.is_space_member(s.id, _user_id)
        OR public.has_role(_user_id, 'platform_admin')
      )
  )
$$;
