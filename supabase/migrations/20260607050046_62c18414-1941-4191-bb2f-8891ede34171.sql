-- Phase 1C: Feed system

-- Enums
CREATE TYPE public.post_type AS ENUM ('quick_post', 'article', 'question_placeholder', 'event_announcement_placeholder');
CREATE TYPE public.post_visibility AS ENUM ('public', 'space_members', 'admins_only', 'hidden');
CREATE TYPE public.post_status AS ENUM ('active', 'hidden', 'deleted');
CREATE TYPE public.comment_status AS ENUM ('active', 'hidden', 'deleted');
CREATE TYPE public.reaction_type AS ENUM ('like', 'love', 'celebrate', 'helpful');
CREATE TYPE public.report_target AS ENUM ('post', 'comment');
CREATE TYPE public.report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Helper: can a user access (read content from) a space?
CREATE OR REPLACE FUNCTION public.can_access_space(_space_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spaces s
    WHERE s.id = _space_id AND NOT s.is_archived AND (
      s.privacy_level IN ('public','members_only')
      OR public.is_space_member(s.id, _user_id)
      OR public.has_role(_user_id, 'platform_admin')
    )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_access_space(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Helper: can a user post in a space?
CREATE OR REPLACE FUNCTION public.can_post_in_space(_space_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spaces s
    WHERE s.id = _space_id AND NOT s.is_archived AND (
      public.is_space_member(s.id, _user_id)
      OR public.has_role(_user_id, 'platform_admin')
    )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_post_in_space(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- POSTS
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  post_type public.post_type NOT NULL DEFAULT 'quick_post',
  title text,
  body text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  attachment_urls text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  visibility public.post_visibility NOT NULL DEFAULT 'space_members',
  status public.post_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
CREATE INDEX posts_space_created_idx ON public.posts (space_id, created_at DESC);
CREATE INDEX posts_author_idx ON public.posts (author_id);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read accessible posts" ON public.posts FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND visibility <> 'hidden'
    AND public.can_access_space(space_id, auth.uid())
    AND (
      visibility IN ('public','space_members')
      OR has_role(auth.uid(), 'platform_admin')
      OR has_role(auth.uid(), 'moderator')
    )
  );
CREATE POLICY "Authors read own posts" ON public.posts FOR SELECT TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Create posts in joined spaces" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.can_post_in_space(space_id, auth.uid())
    -- Only admins may publish admins_only visibility
    AND (visibility <> 'admins_only' OR has_role(auth.uid(), 'platform_admin'))
    -- Only admins may pin/feature on insert
    AND (NOT is_pinned OR has_role(auth.uid(), 'platform_admin'))
    AND (NOT is_featured OR has_role(auth.uid(), 'platform_admin'))
  );

CREATE POLICY "Authors update own posts" ON public.posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Mods update post status" ON public.posts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Authors delete own posts" ON public.posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "Admins delete posts" ON public.posts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'));

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  status public.comment_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
CREATE INDEX comments_post_created_idx ON public.comments (post_id, created_at);
CREATE INDEX comments_parent_idx ON public.comments (parent_comment_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read comments on accessible posts" ON public.comments FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND p.status = 'active'
        AND public.can_access_space(p.space_id, auth.uid())
    )
  );
CREATE POLICY "Mods read all comments" ON public.comments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Comment on accessible posts" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND p.status = 'active'
        AND public.can_access_space(p.space_id, auth.uid())
    )
  );

CREATE POLICY "Authors update own comments" ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Mods update comment status" ON public.comments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Authors delete own comments" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "Admins delete comments" ON public.comments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'));

-- REACTIONS
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','comment')),
  target_id uuid NOT NULL,
  reaction_type public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, reaction_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
CREATE INDEX reactions_target_idx ON public.reactions (target_type, target_id);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read reactions" ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own reactions" ON public.reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own reactions" ON public.reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type public.report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
CREATE INDEX reports_status_idx ON public.reports (status, created_at DESC);
CREATE INDEX reports_target_idx ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters read own reports" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "Mods read all reports" ON public.reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Anyone authenticated can report" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Mods update reports" ON public.reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'platform_admin'));

-- SEED sample posts (only if at least one user exists)
DO $$
DECLARE
  seed_user uuid;
  welcome_space uuid;
  general_space uuid;
  announce_space uuid;
  course_space uuid;
  events_space uuid;
  resources_space uuid;
  post1 uuid; post2 uuid; post3 uuid; post4 uuid; post5 uuid; post6 uuid;
BEGIN
  -- Prefer a platform admin, otherwise the earliest user
  SELECT ur.user_id INTO seed_user FROM public.user_roles ur
    WHERE ur.role = 'platform_admin' ORDER BY ur.created_at LIMIT 1;
  IF seed_user IS NULL THEN
    SELECT id INTO seed_user FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;
  IF seed_user IS NULL THEN RETURN; END IF;

  SELECT id INTO welcome_space FROM public.spaces WHERE name = 'Welcome Center' LIMIT 1;
  SELECT id INTO general_space FROM public.spaces WHERE name = 'General Community' LIMIT 1;
  SELECT id INTO announce_space FROM public.spaces WHERE name = 'Announcements' LIMIT 1;
  SELECT id INTO course_space FROM public.spaces WHERE name = 'Course Library' LIMIT 1;
  SELECT id INTO events_space FROM public.spaces WHERE name = 'Weekly Live Sessions' LIMIT 1;
  SELECT id INTO resources_space FROM public.spaces WHERE name = 'Resource Vault' LIMIT 1;

  IF announce_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, is_pinned, is_featured, visibility)
    VALUES (announce_space, seed_user, 'article', 'Welcome to MemberHub 👋',
      'We are excited to launch the new platform. Browse Spaces, introduce yourself, and join in the conversations. More features arrive every week.',
      true, true, 'public')
    RETURNING id INTO post1;
  END IF;

  IF welcome_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, visibility)
    VALUES (welcome_space, seed_user, 'quick_post', NULL,
      'Tell us a little about yourself! Where are you joining from and what are you working on?', 'public')
    RETURNING id INTO post2;
  END IF;

  IF general_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, visibility)
    VALUES (general_space, seed_user, 'quick_post', NULL,
      'What is one win you had this week? Big or small — share it here 🎉', 'public')
    RETURNING id INTO post3;
  END IF;

  IF course_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, visibility)
    VALUES (course_space, seed_user, 'question_placeholder', 'Which course should I start with?',
      'New to the library — any recommendations on where to begin?', 'space_members')
    RETURNING id INTO post4;
  END IF;

  IF events_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, visibility)
    VALUES (events_space, seed_user, 'event_announcement_placeholder', 'Reminder: live session this Thursday',
      'Join us this Thursday at 6pm for our weekly Q&A. Bring your questions!', 'space_members')
    RETURNING id INTO post5;
  END IF;

  IF resources_space IS NOT NULL THEN
    INSERT INTO public.posts (space_id, author_id, post_type, title, body, visibility)
    VALUES (resources_space, seed_user, 'article', 'My favorite productivity tools',
      'Here are a few of the tools I use every day to stay focused and shipping. Drop your own picks in the comments!', 'space_members')
    RETURNING id INTO post6;
  END IF;

  -- Sample comments and reactions
  IF post1 IS NOT NULL THEN
    INSERT INTO public.comments (post_id, author_id, body)
    VALUES (post1, seed_user, 'Welcome everyone! So glad to have you here.');
    INSERT INTO public.reactions (user_id, target_type, target_id, reaction_type)
    VALUES (seed_user, 'post', post1, 'celebrate');
  END IF;
  IF post3 IS NOT NULL THEN
    INSERT INTO public.comments (post_id, author_id, body)
    VALUES (post3, seed_user, 'Shipped the first version of our new feature this week 🚀');
    INSERT INTO public.reactions (user_id, target_type, target_id, reaction_type)
    VALUES (seed_user, 'post', post3, 'love');
  END IF;
END $$;