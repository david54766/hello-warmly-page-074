
-- ============= Phase 2C: Onboarding, Saved, Follows =============

-- Enums
CREATE TYPE public.checklist_action_type AS ENUM (
  'complete_profile','join_space','create_first_post','comment_on_post',
  'follow_member','rsvp_event','start_course','complete_lesson','update_notifications'
);
CREATE TYPE public.checklist_target_type AS ENUM (
  'profile','space','post','event','course','lesson','settings','member'
);
CREATE TYPE public.saved_target_type AS ENUM (
  'post','course','lesson','event','space','resource_placeholder'
);

-- ============= welcome_checklist_items =============
CREATE TABLE public.welcome_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  action_type public.checklist_action_type NOT NULL,
  target_type public.checklist_target_type,
  target_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.welcome_checklist_items TO authenticated;
GRANT ALL ON public.welcome_checklist_items TO service_role;
ALTER TABLE public.welcome_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read active checklist items" ON public.welcome_checklist_items FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Admins manage checklist items" ON public.welcome_checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER trg_checklist_items_updated BEFORE UPDATE ON public.welcome_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= welcome_checklist_progress =============
CREATE TABLE public.welcome_checklist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checklist_item_id uuid NOT NULL REFERENCES public.welcome_checklist_items(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checklist_item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.welcome_checklist_progress TO authenticated;
GRANT ALL ON public.welcome_checklist_progress TO service_role;
ALTER TABLE public.welcome_checklist_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own progress" ON public.welcome_checklist_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Insert own progress" ON public.welcome_checklist_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own progress" ON public.welcome_checklist_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own progress" ON public.welcome_checklist_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

-- ============= saved_items =============
CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type public.saved_target_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own saved" ON public.saved_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============= follows =============
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create own follow" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Delete own follow" ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- ============= Auto-complete helper =============
CREATE OR REPLACE FUNCTION public.complete_checklist_action(_user_id uuid, _action public.checklist_action_type)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.welcome_checklist_progress (user_id, checklist_item_id)
  SELECT _user_id, i.id FROM public.welcome_checklist_items i
   WHERE i.active = true AND i.action_type = _action
  ON CONFLICT (user_id, checklist_item_id) DO NOTHING;
END $$;

-- Triggers
CREATE OR REPLACE FUNCTION public.tg_checklist_on_space_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM public.complete_checklist_action(NEW.user_id, 'join_space');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_space_joined AFTER INSERT ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_space_joined();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NOT NULL AND NEW.status = 'active' THEN
    PERFORM public.complete_checklist_action(NEW.author_id, 'create_first_post');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_post AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_post();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NOT NULL AND NEW.status = 'active' THEN
    PERFORM public.complete_checklist_action(NEW.author_id, 'comment_on_post');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_comment();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.complete_checklist_action(NEW.follower_id, 'follow_member');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_follow();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_rsvp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.complete_checklist_action(NEW.user_id, 'rsvp_event');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_rsvp AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_rsvp();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_lesson()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.complete_checklist_action(NEW.user_id, 'start_course');
  IF NEW.status = 'completed' THEN
    PERFORM public.complete_checklist_action(NEW.user_id, 'complete_lesson');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_lesson_ins AFTER INSERT ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_lesson();
CREATE TRIGGER trg_checklist_lesson_upd AFTER UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_lesson();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name <> ''
     AND NEW.bio IS NOT NULL AND NEW.bio <> ''
     AND NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> '' THEN
    PERFORM public.complete_checklist_action(NEW.id, 'complete_profile');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_profile AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_profile();

CREATE OR REPLACE FUNCTION public.tg_checklist_on_notif_pref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.complete_checklist_action(NEW.user_id, 'update_notifications');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_checklist_notif AFTER UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_on_notif_pref();

-- Seed default checklist items
INSERT INTO public.welcome_checklist_items (title, description, action_type, target_type, sort_order) VALUES
  ('Complete your profile', 'Add a name, photo, and short bio so other members can get to know you.', 'complete_profile', 'profile', 1),
  ('Join your first Space', 'Spaces are where conversations and content live. Pick one that interests you.', 'join_space', 'space', 2),
  ('Write your first post', 'Introduce yourself or share something you''re working on.', 'create_first_post', 'post', 3),
  ('Comment on a post', 'Jump into the conversation by replying to a post you like.', 'comment_on_post', 'post', 4),
  ('Follow three members', 'Following members surfaces their posts in your Following feed.', 'follow_member', 'member', 5),
  ('RSVP to an event', 'See what''s coming up and reserve your spot.', 'rsvp_event', 'event', 6),
  ('Start a course', 'Pick a course from the library and watch the first lesson.', 'start_course', 'course', 7),
  ('Complete your first lesson', 'Finish a lesson to keep your learning streak going.', 'complete_lesson', 'lesson', 8),
  ('Adjust notification settings', 'Choose how and when you want to hear from the community.', 'update_notifications', 'settings', 9);
