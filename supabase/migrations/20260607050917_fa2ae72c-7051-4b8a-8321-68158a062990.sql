
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.course_visibility AS ENUM ('public','members_only','space_members','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.course_access AS ENUM ('free','preview','paid_placeholder');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_visibility AS ENUM ('visible','preview','locked','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_progress_status AS ENUM ('not_started','in_progress','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  overview_content text,
  created_by uuid,
  visibility public.course_visibility NOT NULL DEFAULT 'space_members',
  access_level public.course_access NOT NULL DEFAULT 'free',
  sort_order integer NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- COURSE SECTIONS
CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_sections TO authenticated;
GRANT ALL ON public.course_sections TO service_role;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

-- LESSONS
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  video_url text,
  attachments text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  preview_enabled boolean NOT NULL DEFAULT false,
  completion_required boolean NOT NULL DEFAULT true,
  visibility public.lesson_visibility NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- LESSON PROGRESS
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status public.lesson_progress_status NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.can_access_course(_course_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = _course_id AND NOT c.is_archived AND c.visibility <> 'hidden'
      AND (
        public.has_role(_user_id, 'platform_admin')
        OR (c.visibility = 'public')
        OR (c.visibility IN ('members_only','space_members') AND public.can_access_space(c.space_id, _user_id))
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_lesson(_lesson_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = _lesson_id AND l.visibility <> 'hidden' AND NOT c.is_archived
      AND (
        public.has_role(_user_id, 'platform_admin')
        OR (l.visibility = 'preview' AND c.visibility <> 'hidden')
        OR (l.visibility IN ('visible','locked') AND public.can_access_course(l.course_id, _user_id))
      )
  )
$$;

-- POLICIES: courses
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

DROP POLICY IF EXISTS "Read accessible courses" ON public.courses;
CREATE POLICY "Read accessible courses" ON public.courses FOR SELECT TO authenticated
  USING (
    NOT is_archived AND visibility <> 'hidden' AND (
      public.has_role(auth.uid(),'platform_admin')
      OR visibility = 'public'
      OR (visibility IN ('members_only','space_members') AND public.can_access_space(space_id, auth.uid()))
    )
  );

-- POLICIES: course_sections
DROP POLICY IF EXISTS "Admins manage sections" ON public.course_sections;
CREATE POLICY "Admins manage sections" ON public.course_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

DROP POLICY IF EXISTS "Read sections of accessible courses" ON public.course_sections;
CREATE POLICY "Read sections of accessible courses" ON public.course_sections FOR SELECT TO authenticated
  USING (public.can_access_course(course_id, auth.uid()));

-- POLICIES: lessons
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

DROP POLICY IF EXISTS "Read accessible lessons" ON public.lessons;
CREATE POLICY "Read accessible lessons" ON public.lessons FOR SELECT TO authenticated
  USING (
    visibility <> 'hidden' AND (
      public.has_role(auth.uid(),'platform_admin')
      OR (visibility = 'preview' AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND NOT c.is_archived AND c.visibility <> 'hidden'))
      OR (visibility IN ('visible','locked') AND public.can_access_course(course_id, auth.uid()))
    )
  );

-- POLICIES: lesson_progress
DROP POLICY IF EXISTS "Users read own progress" ON public.lesson_progress;
CREATE POLICY "Users read own progress" ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

DROP POLICY IF EXISTS "Users insert own progress" ON public.lesson_progress;
CREATE POLICY "Users insert own progress" ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_access_lesson(lesson_id, auth.uid()));

DROP POLICY IF EXISTS "Users update own progress" ON public.lesson_progress;
CREATE POLICY "Users update own progress" ON public.lesson_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage progress" ON public.lesson_progress;
CREATE POLICY "Admins manage progress" ON public.lesson_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

-- TRIGGERS for updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_sections_updated_at ON public.course_sections;
CREATE TRIGGER update_course_sections_updated_at BEFORE UPDATE ON public.course_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_space ON public.courses(space_id);
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.course_sections(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON public.lessons(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id, lesson_id);
