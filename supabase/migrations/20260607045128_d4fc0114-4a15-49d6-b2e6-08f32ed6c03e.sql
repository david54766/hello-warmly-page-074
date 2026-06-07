-- Phase 1B: Collections, Spaces, Space Members

-- Enums
CREATE TYPE public.space_privacy AS ENUM ('public', 'members_only', 'private', 'hidden');
CREATE TYPE public.space_access AS ENUM ('free', 'preview', 'paid_placeholder');
CREATE TYPE public.space_member_role AS ENUM ('space_host', 'space_moderator', 'member');
CREATE TYPE public.space_member_status AS ENUM ('active', 'pending', 'banned');

-- Collections
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin')) WITH CHECK (has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Spaces
CREATE TABLE public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  name text NOT NULL,
  tagline text,
  description text,
  cover_image_url text,
  icon text,
  privacy_level public.space_privacy NOT NULL DEFAULT 'public',
  access_level public.space_access NOT NULL DEFAULT 'free',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces TO authenticated;
GRANT SELECT ON public.spaces TO anon;
GRANT ALL ON public.spaces TO service_role;

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Space Members
CREATE TABLE public.space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.space_member_role NOT NULL DEFAULT 'member',
  status public.space_member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_members TO authenticated;
GRANT ALL ON public.space_members TO service_role;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = _space_id AND user_id = _user_id AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_space_host(_space_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = _space_id AND user_id = _user_id
      AND role IN ('space_host','space_moderator') AND status = 'active'
  )
$$;

-- Spaces RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View public spaces" ON public.spaces FOR SELECT TO authenticated
  USING (
    NOT is_archived AND (
      privacy_level IN ('public','members_only')
      OR public.is_space_member(id, auth.uid())
      OR has_role(auth.uid(), 'platform_admin')
    )
  );
CREATE POLICY "Anon view public spaces" ON public.spaces FOR SELECT TO anon
  USING (NOT is_archived AND privacy_level = 'public');
CREATE POLICY "Admins manage spaces" ON public.spaces FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin')) WITH CHECK (has_role(auth.uid(), 'platform_admin'));

-- Space members RLS
CREATE POLICY "View own memberships" ON public.space_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'platform_admin')
    OR public.is_space_member(space_id, auth.uid())
  );
CREATE POLICY "Join free public space" ON public.space_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.spaces s
      WHERE s.id = space_id AND NOT s.is_archived
        AND s.privacy_level IN ('public','members_only')
        AND s.access_level = 'free'
    )
  );
CREATE POLICY "Leave own membership" ON public.space_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Admins manage memberships" ON public.space_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin')) WITH CHECK (has_role(auth.uid(), 'platform_admin'));

-- Seed Collections
INSERT INTO public.collections (name, description, icon, sort_order) VALUES
  ('Start Here', 'Begin your journey with the essentials', 'Sparkles', 1),
  ('Community', 'Connect with fellow members', 'Users', 2),
  ('Courses', 'Learn at your own pace', 'GraduationCap', 3),
  ('Events', 'Live sessions and gatherings', 'Calendar', 4),
  ('Resources', 'Tools, guides, and templates', 'BookOpen', 5),
  ('VIP Area', 'Exclusive members-only content', 'Crown', 6);

-- Seed Spaces
INSERT INTO public.spaces (collection_id, name, tagline, description, icon, privacy_level, access_level, sort_order)
SELECT c.id, s.name, s.tagline, s.description, s.icon, s.privacy::space_privacy, s.access::space_access, s.sort_order
FROM (VALUES
  ('Start Here', 'Welcome Center', 'Your first stop', 'Get oriented and learn how to make the most of the platform.', 'Sparkles', 'public', 'free', 1),
  ('Community', 'General Community', 'Open discussions for everyone', 'A place to introduce yourself, share wins, and meet other members.', 'MessageCircle', 'public', 'free', 1),
  ('Community', 'Announcements', 'Stay in the loop', 'Important updates and news from the team.', 'Megaphone', 'public', 'free', 2),
  ('Courses', 'Course Library', 'All your learning in one place', 'Browse and enroll in courses to level up your skills.', 'GraduationCap', 'members_only', 'free', 1),
  ('Events', 'Weekly Live Sessions', 'Join us live every week', 'RSVP to upcoming live calls, workshops, and Q&As.', 'Calendar', 'members_only', 'free', 1),
  ('Resources', 'Resource Vault', 'Templates, guides, and downloads', 'A curated library of resources to help you succeed.', 'BookOpen', 'members_only', 'free', 1),
  ('VIP Area', 'VIP Members', 'Exclusive premium space', 'Reserved for VIP members. Premium content, perks, and access.', 'Crown', 'private', 'paid_placeholder', 1)
) AS s(col, name, tagline, description, icon, privacy, access, sort_order)
JOIN public.collections c ON c.name = s.col;