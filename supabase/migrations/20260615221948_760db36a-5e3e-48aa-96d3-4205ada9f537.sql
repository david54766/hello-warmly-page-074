
DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM ('file','link','pdf','video','image','document','template','checklist','guide','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.resource_visibility AS ENUM ('public','members_only','space_members','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.resource_access_level AS ENUM ('free','preview','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.saved_target_type ADD VALUE IF NOT EXISTS 'resource';

CREATE TABLE IF NOT EXISTS public.resource_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.resource_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visibility public.resource_visibility NOT NULL DEFAULT 'members_only',
  access_level public.resource_access_level NOT NULL DEFAULT 'free',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_folders TO authenticated;
GRANT ALL ON public.resource_folders TO service_role;
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Folders viewable by access" ON public.resource_folders;
CREATE POLICY "Folders viewable by access"
ON public.resource_folders FOR SELECT TO authenticated
USING (
  NOT is_archived AND visibility <> 'hidden' AND (
    public.has_role(auth.uid(),'platform_admin')
    OR visibility IN ('public','members_only')
    OR (visibility = 'space_members' AND space_id IS NOT NULL AND public.is_space_member(space_id, auth.uid()))
  )
);
DROP POLICY IF EXISTS "Admins manage folders" ON public.resource_folders;
CREATE POLICY "Admins manage folders"
ON public.resource_folders FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'platform_admin'))
WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

DROP TRIGGER IF EXISTS trg_resource_folders_updated_at ON public.resource_folders;
CREATE TRIGGER trg_resource_folders_updated_at
  BEFORE UPDATE ON public.resource_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.resource_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type public.resource_type NOT NULL DEFAULT 'file',
  file_url TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  visibility public.resource_visibility NOT NULL DEFAULT 'members_only',
  access_level public.resource_access_level NOT NULL DEFAULT 'free',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_resource(_resource_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resources r
    WHERE r.id = _resource_id
      AND NOT r.is_archived
      AND r.visibility <> 'hidden'
      AND (
        public.has_role(_user_id,'platform_admin')
        OR (
          (
            r.visibility = 'public'
            OR (r.visibility = 'members_only' AND _user_id IS NOT NULL)
            OR (r.visibility = 'space_members' AND r.space_id IS NOT NULL AND public.is_space_member(r.space_id, _user_id))
          )
          AND (
            r.access_level IN ('free','preview')
            OR EXISTS (
              SELECT 1 FROM public.access_grants ag
              WHERE ag.user_id = _user_id AND ag.active = true
                AND (ag.ends_at IS NULL OR ag.ends_at > now())
                AND (
                  ag.target_type::text = 'platform'
                  OR (ag.target_type::text = 'space' AND ag.target_id = r.space_id)
                  OR (ag.target_type::text = 'resource_placeholder' AND ag.target_id = r.id)
                )
            )
          )
        )
      )
  )
$$;

DROP POLICY IF EXISTS "Resources viewable by access" ON public.resources;
CREATE POLICY "Resources viewable by access"
ON public.resources FOR SELECT TO authenticated
USING (public.can_access_resource(id, auth.uid()));

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Admins manage resources"
ON public.resources FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'platform_admin'))
WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

DROP TRIGGER IF EXISTS trg_resources_updated_at ON public.resources;
CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON public.resource_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_user ON public.resource_views(user_id);
GRANT SELECT, INSERT ON public.resource_views TO authenticated;
GRANT ALL ON public.resource_views TO service_role;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own views" ON public.resource_views;
CREATE POLICY "Users insert own views"
ON public.resource_views FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_access_resource(resource_id, auth.uid()));
DROP POLICY IF EXISTS "Users read own views, admins read all" ON public.resource_views;
CREATE POLICY "Users read own views, admins read all"
ON public.resource_views FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource ON public.resource_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_user ON public.resource_downloads(user_id);
GRANT SELECT, INSERT ON public.resource_downloads TO authenticated;
GRANT ALL ON public.resource_downloads TO service_role;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own downloads" ON public.resource_downloads;
CREATE POLICY "Users insert own downloads"
ON public.resource_downloads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_access_resource(resource_id, auth.uid()));
DROP POLICY IF EXISTS "Users read own downloads, admins read all" ON public.resource_downloads;
CREATE POLICY "Users read own downloads, admins read all"
ON public.resource_downloads FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

-- Seed folders
INSERT INTO public.resource_folders (name, description, sort_order, visibility, access_level)
SELECT v.name, v.description, v.sort_order, v.visibility::public.resource_visibility, v.access_level::public.resource_access_level
FROM (VALUES
  ('Templates','Reusable templates and starters', 1, 'members_only','free'),
  ('Guides','How-to guides and walkthroughs', 2, 'members_only','free'),
  ('Checklists','Step-by-step checklists', 3, 'members_only','free'),
  ('Event Resources','Materials for events', 4, 'members_only','free'),
  ('Course Downloads','Companion files for courses', 5, 'members_only','free'),
  ('VIP Resources','Premium-only materials', 6, 'members_only','paid')
) AS v(name, description, sort_order, visibility, access_level)
WHERE NOT EXISTS (SELECT 1 FROM public.resource_folders WHERE resource_folders.name = v.name AND resource_folders.space_id IS NULL);

-- Seed resources
INSERT INTO public.resources (folder_id, title, description, resource_type, file_url, external_url, visibility, access_level, is_featured)
SELECT
  (SELECT id FROM public.resource_folders WHERE name = v.folder AND space_id IS NULL LIMIT 1),
  v.title, v.description,
  v.rtype::public.resource_type,
  v.file_url, v.external_url,
  v.visibility::public.resource_visibility,
  v.access_level::public.resource_access_level,
  v.featured
FROM (VALUES
  ('Guides','Welcome Guide','Get oriented with the community in 5 minutes.','guide','https://example.com/welcome.pdf', NULL, 'members_only','free', true),
  ('Checklists','Community Checklist','Your first-week checklist.','checklist','https://example.com/checklist.pdf', NULL, 'members_only','free', false),
  ('Course Downloads','Course Worksheet','Worksheet to accompany the intro course.','document','https://example.com/worksheet.pdf', NULL, 'members_only','free', false),
  ('Event Resources','Event Prep Guide','How to prepare for live events.','guide','https://example.com/event.pdf', NULL, 'members_only','free', false),
  ('VIP Resources','VIP Template','Premium template (placeholder).','template','https://example.com/vip.zip', NULL, 'members_only','paid', true),
  ('Guides','Helpful Link Example','External reference link.','link', NULL,'https://example.com', 'public','free', false)
) AS v(folder, title, description, rtype, file_url, external_url, visibility, access_level, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE resources.title = v.title);
