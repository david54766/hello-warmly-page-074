
-- =========================================================================
-- Enums
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'comment_on_post', 'reply_to_comment',
    'reaction_to_post', 'reaction_to_comment',
    'event_rsvp_confirmation', 'lesson_completed',
    'admin_announcement', 'space_joined', 'report_status_updated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_target AS ENUM (
    'post', 'comment', 'event', 'lesson', 'course', 'space', 'user', 'announcement_placeholder'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================================
-- notifications
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         public.notification_type NOT NULL,
  title        text NOT NULL,
  body         text,
  target_type  public.notification_target,
  target_id    uuid,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins create announcements" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin')
    AND type = 'admin_announcement'
  );

-- =========================================================================
-- notification_preferences
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  comments_enabled                boolean NOT NULL DEFAULT true,
  replies_enabled                 boolean NOT NULL DEFAULT true,
  reactions_enabled               boolean NOT NULL DEFAULT true,
  event_rsvps_enabled             boolean NOT NULL DEFAULT true,
  lesson_progress_enabled         boolean NOT NULL DEFAULT true,
  admin_announcements_enabled     boolean NOT NULL DEFAULT true,
  email_notifications_enabled     boolean NOT NULL DEFAULT false,
  push_notifications_enabled      boolean NOT NULL DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- Helper: read a preference flag (defaults true if no row)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.notif_pref(_user_id uuid, _flag text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v boolean;
BEGIN
  EXECUTE format('SELECT %I FROM public.notification_preferences WHERE user_id = $1', _flag)
    INTO v USING _user_id;
  RETURN COALESCE(v, true);
END $$;

-- =========================================================================
-- Insert helper
-- =========================================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type public.notification_type,
  _title text, _body text,
  _target_type public.notification_target DEFAULT NULL,
  _target_id uuid DEFAULT NULL,
  _actor_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, target_type, target_id, actor_id)
  VALUES (_user_id, _type, _title, _body, _target_type, _target_id, _actor_id);
END $$;

-- =========================================================================
-- Trigger: comments → notify post author / parent-comment author
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_post_author uuid;
  v_parent_author uuid;
  v_actor_name text;
  v_post_title text;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(p.full_name,''), p.email, 'A member')
    INTO v_actor_name FROM public.profiles p WHERE p.id = NEW.author_id;
  SELECT COALESCE(NULLIF(po.title,''), LEFT(po.body, 60), 'a post'), po.author_id
    INTO v_post_title, v_post_author FROM public.posts po WHERE po.id = NEW.post_id;

  -- Comment on post
  IF v_post_author IS NOT NULL
     AND v_post_author <> NEW.author_id
     AND public.notif_pref(v_post_author, 'comments_enabled') THEN
    PERFORM public.create_notification(
      v_post_author, 'comment_on_post',
      v_actor_name || ' commented on your post',
      LEFT(NEW.body, 200),
      'post', NEW.post_id, NEW.author_id
    );
  END IF;

  -- Reply to comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT author_id INTO v_parent_author FROM public.comments WHERE id = NEW.parent_comment_id;
    IF v_parent_author IS NOT NULL
       AND v_parent_author <> NEW.author_id
       AND v_parent_author <> v_post_author  -- avoid duplicate when same person
       AND public.notif_pref(v_parent_author, 'replies_enabled') THEN
      PERFORM public.create_notification(
        v_parent_author, 'reply_to_comment',
        v_actor_name || ' replied to your comment',
        LEFT(NEW.body, 200),
        'post', NEW.post_id, NEW.author_id
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_comment ON public.comments;
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_comment();

-- =========================================================================
-- Trigger: reactions → notify content author
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_actor_name text;
  v_type public.notification_type;
  v_target_type public.notification_target;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT author_id INTO v_owner FROM public.posts WHERE id = NEW.target_id;
    v_type := 'reaction_to_post';
    v_target_type := 'post';
  ELSIF NEW.target_type = 'comment' THEN
    SELECT author_id INTO v_owner FROM public.comments WHERE id = NEW.target_id;
    v_type := 'reaction_to_comment';
    v_target_type := 'comment';
  ELSE
    RETURN NEW;
  END IF;

  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  IF NOT public.notif_pref(v_owner, 'reactions_enabled') THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(p.full_name,''), p.email, 'A member')
    INTO v_actor_name FROM public.profiles p WHERE p.id = NEW.user_id;

  PERFORM public.create_notification(
    v_owner, v_type,
    v_actor_name || ' reacted to your ' || NEW.target_type,
    NULL, v_target_type, NEW.target_id, NEW.user_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_reaction ON public.reactions;
CREATE TRIGGER notify_on_reaction
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_reaction();

-- =========================================================================
-- Trigger: event RSVP → confirmation to the RSVP'ing user
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_rsvp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_title text;
BEGIN
  IF NOT public.notif_pref(NEW.user_id, 'event_rsvps_enabled') THEN RETURN NEW; END IF;
  SELECT title INTO v_title FROM public.events WHERE id = NEW.event_id;
  PERFORM public.create_notification(
    NEW.user_id, 'event_rsvp_confirmation',
    'You RSVP''d to ' || COALESCE(v_title, 'an event'),
    'Status: ' || NEW.status::text,
    'event', NEW.event_id, NEW.user_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_rsvp ON public.event_rsvps;
CREATE TRIGGER notify_on_rsvp
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_rsvp();

-- =========================================================================
-- Trigger: lesson_progress → completion confirmation
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_lesson_complete()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_title text;
BEGIN
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN RETURN NEW; END IF;
  IF NOT public.notif_pref(NEW.user_id, 'lesson_progress_enabled') THEN RETURN NEW; END IF;
  SELECT title INTO v_title FROM public.lessons WHERE id = NEW.lesson_id;
  PERFORM public.create_notification(
    NEW.user_id, 'lesson_completed',
    'Lesson completed: ' || COALESCE(v_title, 'a lesson'),
    'Nice work — keep your streak going.',
    'lesson', NEW.lesson_id, NEW.user_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_lesson_complete ON public.lesson_progress;
CREATE TRIGGER notify_on_lesson_complete
  AFTER INSERT OR UPDATE OF status ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_lesson_complete();

-- =========================================================================
-- Trigger: space_members → joined confirmation
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_space_joined()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_name text;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  SELECT name INTO v_name FROM public.spaces WHERE id = NEW.space_id;
  PERFORM public.create_notification(
    NEW.user_id, 'space_joined',
    'Welcome to ' || COALESCE(v_name, 'the space'),
    'You can now post and join discussions.',
    'space', NEW.space_id, NEW.user_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_space_joined ON public.space_members;
CREATE TRIGGER notify_on_space_joined
  AFTER INSERT ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_space_joined();

-- =========================================================================
-- Trigger: reports.status change → notify reporter
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_on_report_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.reporter_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  PERFORM public.create_notification(
    NEW.reporter_id, 'report_status_updated',
    'Your report was ' || NEW.status::text,
    COALESCE(NEW.moderator_notes, 'A moderator updated the status of your report.'),
    'user', NEW.target_id, NEW.reviewed_by
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_report_status ON public.reports;
CREATE TRIGGER notify_on_report_status
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_report_status();
