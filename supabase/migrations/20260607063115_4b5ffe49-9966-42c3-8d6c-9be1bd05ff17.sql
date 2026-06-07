
-- ============= ENUMS =============
DO $$ BEGIN
  CREATE TYPE public.badge_type AS ENUM ('manual','milestone','course','event','community','special');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.points_source_type AS ENUM (
    'profile_complete','space_joined','post_created','comment_created',
    'reaction_received','event_rsvp','course_started','lesson_completed',
    'checklist_completed','follow_member','manual','badge_awarded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leaderboard_period AS ENUM ('all_time','month','week');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend notification_type
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'badge_awarded';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'points_awarded';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'milestone_reached';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============= BADGES =============
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon_url text,
  badge_type public.badge_type NOT NULL DEFAULT 'manual',
  points_value integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read active badges" ON public.badges FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER trg_badges_updated BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= USER BADGES =============
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid,
  award_reason text,
  source_type text,
  source_id uuid,
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read user badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage user badges" ON public.user_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- ============= POINTS LEDGER =============
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  reason text,
  source_type public.points_source_type NOT NULL,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read points ledger" ON public.points_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage points" ON public.points_ledger FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE INDEX IF NOT EXISTS idx_points_user ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON public.points_ledger(created_at);

-- ============= LEADERBOARD SNAPSHOTS =============
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period public.leaderboard_period NOT NULL,
  data_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard_snapshots TO authenticated;
GRANT ALL ON public.leaderboard_snapshots TO service_role;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read snapshots" ON public.leaderboard_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write snapshots" ON public.leaderboard_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- ============= HELPER FUNCTIONS =============
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id uuid, _points integer, _reason text,
  _source_type public.points_source_type, _source_id uuid DEFAULT NULL,
  _dedupe boolean DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF _user_id IS NULL OR _points = 0 THEN RETURN NULL; END IF;
  IF _dedupe AND _source_id IS NOT NULL THEN
    SELECT id INTO v_id FROM public.points_ledger
      WHERE user_id = _user_id AND source_type = _source_type AND source_id = _source_id
      LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  INSERT INTO public.points_ledger (user_id, points, reason, source_type, source_id)
    VALUES (_user_id, _points, _reason, _source_type, _source_id)
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.award_badge_by_slug(
  _user_id uuid, _slug text, _reason text DEFAULT NULL,
  _awarded_by uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_badge_id uuid; v_existing uuid; v_pts integer; v_name text;
BEGIN
  IF _user_id IS NULL OR _slug IS NULL THEN RETURN NULL; END IF;
  SELECT id, points_value, name INTO v_badge_id, v_pts, v_name
    FROM public.badges WHERE slug = _slug AND active LIMIT 1;
  IF v_badge_id IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_existing FROM public.user_badges
    WHERE user_id = _user_id AND badge_id = v_badge_id LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  INSERT INTO public.user_badges (user_id, badge_id, awarded_by, award_reason)
    VALUES (_user_id, v_badge_id, _awarded_by, _reason)
    RETURNING id INTO v_existing;
  IF v_pts > 0 THEN
    PERFORM public.award_points(_user_id, v_pts, 'Badge: ' || v_name,
      'badge_awarded'::public.points_source_type, v_badge_id, false);
  END IF;
  RETURN v_existing;
END $$;

-- ============= AUTOMATIC TRIGGERS =============

-- Posts: points + first post + 5-post conversation starter
CREATE OR REPLACE FUNCTION public.tg_gamify_post() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF NEW.author_id IS NULL OR NEW.status <> 'active' THEN RETURN NEW; END IF;
  PERFORM public.award_points(NEW.author_id, 20, 'Created a post', 'post_created', NEW.id);
  SELECT COUNT(*) INTO v_count FROM public.posts
    WHERE author_id = NEW.author_id AND status = 'active';
  IF v_count = 1 THEN PERFORM public.award_badge_by_slug(NEW.author_id, 'first_post'); END IF;
  IF v_count = 5 THEN PERFORM public.award_badge_by_slug(NEW.author_id, 'conversation_starter'); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_post ON public.posts;
CREATE TRIGGER tg_gamify_post AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_post();

-- Comments
CREATE OR REPLACE FUNCTION public.tg_gamify_comment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NULL OR NEW.status <> 'active' THEN RETURN NEW; END IF;
  PERFORM public.award_points(NEW.author_id, 10, 'Commented on a post', 'comment_created', NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_comment ON public.comments;
CREATE TRIGGER tg_gamify_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_comment();

-- Reactions: award target owner; helpful contributor at 10
CREATE OR REPLACE FUNCTION public.tg_gamify_reaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_total integer;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT author_id INTO v_owner FROM public.posts WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT author_id INTO v_owner FROM public.comments WHERE id = NEW.target_id;
  END IF;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  PERFORM public.award_points(v_owner, 5, 'Received a reaction', 'reaction_received', NEW.id);
  SELECT COUNT(*) INTO v_total FROM public.points_ledger
    WHERE user_id = v_owner AND source_type = 'reaction_received';
  IF v_total >= 10 THEN
    PERFORM public.award_badge_by_slug(v_owner, 'helpful_contributor');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_reaction ON public.reactions;
CREATE TRIGGER tg_gamify_reaction AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_reaction();

-- Space joins
CREATE OR REPLACE FUNCTION public.tg_gamify_space_join() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM public.award_points(NEW.user_id, 10, 'Joined a Space', 'space_joined', NEW.space_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_space_join ON public.space_members;
CREATE TRIGGER tg_gamify_space_join AFTER INSERT ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_space_join();

-- Event RSVPs
CREATE OR REPLACE FUNCTION public.tg_gamify_rsvp() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_points(NEW.user_id, 15, 'RSVPed to an event', 'event_rsvp', NEW.event_id);
  PERFORM public.award_badge_by_slug(NEW.user_id, 'event_attendee');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_rsvp ON public.event_rsvps;
CREATE TRIGGER tg_gamify_rsvp AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_rsvp();

-- Lessons: started + completed + course finisher
CREATE OR REPLACE FUNCTION public.tg_gamify_lesson() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_course uuid; v_total integer; v_done integer;
BEGIN
  PERFORM public.award_points(NEW.user_id, 15, 'Started a lesson', 'course_started', NEW.lesson_id);
  PERFORM public.award_badge_by_slug(NEW.user_id, 'course_starter');
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.award_points(NEW.user_id, 25, 'Completed a lesson', 'lesson_completed', NEW.lesson_id);
    SELECT course_id INTO v_course FROM public.lessons WHERE id = NEW.lesson_id;
    IF v_course IS NOT NULL THEN
      SELECT COUNT(*) INTO v_total FROM public.lessons WHERE course_id = v_course;
      SELECT COUNT(*) INTO v_done FROM public.lesson_progress lp
        JOIN public.lessons l ON l.id = lp.lesson_id
        WHERE l.course_id = v_course AND lp.user_id = NEW.user_id AND lp.status = 'completed';
      IF v_total > 0 AND v_done >= v_total THEN
        PERFORM public.award_badge_by_slug(NEW.user_id, 'course_finisher', 'Completed course');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_lesson ON public.lesson_progress;
CREATE TRIGGER tg_gamify_lesson AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_lesson();

-- Follows
CREATE OR REPLACE FUNCTION public.tg_gamify_follow() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_points(NEW.follower_id, 5, 'Followed a member', 'follow_member', NEW.following_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_follow ON public.follows;
CREATE TRIGGER tg_gamify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_follow();

-- Profile completion
CREATE OR REPLACE FUNCTION public.tg_gamify_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name <> ''
     AND NEW.bio IS NOT NULL AND NEW.bio <> ''
     AND NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> '' THEN
    PERFORM public.award_points(NEW.id, 25, 'Completed profile', 'profile_complete', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_profile ON public.profiles;
CREATE TRIGGER tg_gamify_profile AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_profile();

-- Checklist completion → Welcome Complete badge & 50 points
CREATE OR REPLACE FUNCTION public.tg_gamify_checklist() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total integer; v_done integer;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.welcome_checklist_items WHERE active;
  SELECT COUNT(*) INTO v_done FROM public.welcome_checklist_progress p
    JOIN public.welcome_checklist_items i ON i.id = p.checklist_item_id
    WHERE p.user_id = NEW.user_id AND i.active;
  IF v_total > 0 AND v_done >= v_total THEN
    PERFORM public.award_points(NEW.user_id, 50, 'Completed welcome checklist', 'checklist_completed', NEW.user_id);
    PERFORM public.award_badge_by_slug(NEW.user_id, 'welcome_complete');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_gamify_checklist ON public.welcome_checklist_progress;
CREATE TRIGGER tg_gamify_checklist AFTER INSERT ON public.welcome_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_checklist();

-- Notifications on badge awarded
CREATE OR REPLACE FUNCTION public.tg_notify_on_badge() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_desc text;
BEGIN
  SELECT name, description INTO v_name, v_desc FROM public.badges WHERE id = NEW.badge_id;
  PERFORM public.create_notification(
    NEW.user_id, 'badge_awarded',
    'New badge: ' || COALESCE(v_name, 'Achievement'),
    COALESCE(v_desc, 'You unlocked a new badge.'),
    'user'::public.notification_target, NEW.user_id, NEW.awarded_by
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_notify_on_badge ON public.user_badges;
CREATE TRIGGER tg_notify_on_badge AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_badge();

-- Notification on manual points
CREATE OR REPLACE FUNCTION public.tg_notify_on_manual_points() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source_type = 'manual' THEN
    PERFORM public.create_notification(
      NEW.user_id, 'points_awarded',
      (CASE WHEN NEW.points >= 0 THEN '+' ELSE '' END) || NEW.points || ' points',
      COALESCE(NEW.reason, 'A moderator updated your points.'),
      'user'::public.notification_target, NEW.user_id, NULL
    );
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_notify_on_manual_points ON public.points_ledger;
CREATE TRIGGER tg_notify_on_manual_points AFTER INSERT ON public.points_ledger
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_manual_points();

-- ============= SEED DEFAULT BADGES =============
INSERT INTO public.badges (slug, name, description, badge_type, points_value) VALUES
  ('founding_member','Founding Member','One of the first members of the community.','special',100),
  ('first_post','First Post','Shared your first post with the community.','milestone',20),
  ('helpful_contributor','Helpful Contributor','Received 10 reactions from other members.','community',50),
  ('course_starter','Course Starter','Started your learning journey.','course',15),
  ('course_finisher','Course Finisher','Completed every lesson in a course.','course',100),
  ('event_attendee','Event Attendee','RSVPed to your first event.','event',15),
  ('community_builder','Community Builder','Recognized for building the community.','manual',75),
  ('welcome_complete','Welcome Complete','Completed the welcome checklist.','milestone',50),
  ('conversation_starter','Conversation Starter','Wrote 5 posts to spark conversation.','community',40),
  ('top_contributor','Top Contributor','Recognized as a top contributor.','manual',150)
ON CONFLICT (slug) DO NOTHING;
