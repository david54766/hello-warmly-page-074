
-- Enum updates
ALTER TYPE public.post_type RENAME VALUE 'question_placeholder' TO 'question';
ALTER TYPE public.post_type RENAME VALUE 'event_announcement_placeholder' TO 'event_announcement';
ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'poll';

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'question_answered';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'best_answer_selected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'poll_vote_received';

ALTER TYPE public.points_source_type ADD VALUE IF NOT EXISTS 'question_created';
ALTER TYPE public.points_source_type ADD VALUE IF NOT EXISTS 'question_answered';
ALTER TYPE public.points_source_type ADD VALUE IF NOT EXISTS 'best_answer';
ALTER TYPE public.points_source_type ADD VALUE IF NOT EXISTS 'poll_created';
ALTER TYPE public.points_source_type ADD VALUE IF NOT EXISTS 'poll_voted';

-- Tables
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  question text NOT NULL,
  allow_multiple boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read polls on accessible posts" ON public.polls FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = polls.post_id AND p.status='active' AND public.can_access_space(p.space_id, auth.uid()))
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Authors manage own polls" ON public.polls FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = polls.post_id AND p.author_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = polls.post_id AND p.author_id = auth.uid()));
CREATE POLICY "Admins manage polls" ON public.polls FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'platform_admin'))
WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT ALL ON public.poll_options TO service_role;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read options on accessible polls" ON public.poll_options FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id
          WHERE pl.id = poll_options.poll_id AND p.status='active' AND public.can_access_space(p.space_id, auth.uid()))
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Poll authors manage options" ON public.poll_options FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id WHERE pl.id = poll_options.poll_id AND p.author_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id WHERE pl.id = poll_options.poll_id AND p.author_id = auth.uid()));
CREATE POLICY "Admins manage options" ON public.poll_options FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'platform_admin'))
WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, option_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read votes on accessible polls" ON public.poll_votes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id
          WHERE pl.id = poll_votes.poll_id AND p.status='active' AND public.can_access_space(p.space_id, auth.uid()))
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Insert own vote on accessible poll" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id
    WHERE pl.id = poll_votes.poll_id AND p.status='active'
      AND public.can_access_space(p.space_id, auth.uid())
      AND (pl.closes_at IS NULL OR pl.closes_at > now())
  )
);
CREATE POLICY "Delete own vote" ON public.poll_votes FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.question_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  is_answered boolean NOT NULL DEFAULT false,
  best_answer_comment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_details TO authenticated;
GRANT ALL ON public.question_details TO service_role;
ALTER TABLE public.question_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read question details on accessible posts" ON public.question_details FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = question_details.post_id AND p.status='active' AND public.can_access_space(p.space_id, auth.uid()))
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Insert question details (system)" ON public.question_details FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = question_details.post_id AND p.author_id = auth.uid())
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Update question details by author/admin" ON public.question_details FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'platform_admin') OR public.has_role(auth.uid(),'moderator')
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = question_details.post_id AND p.author_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(),'platform_admin') OR public.has_role(auth.uid(),'moderator')
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = question_details.post_id AND p.author_id = auth.uid())
);

CREATE TABLE public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.hashtags TO authenticated;
GRANT ALL ON public.hashtags TO service_role;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read hashtags" ON public.hashtags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update hashtag counts" ON public.hashtags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage hashtags" ON public.hashtags FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'platform_admin'))
WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, hashtag_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_hashtags TO authenticated;
GRANT ALL ON public.post_hashtags TO service_role;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read post hashtags" ON public.post_hashtags FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_hashtags.post_id AND p.status='active' AND public.can_access_space(p.space_id, auth.uid()))
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Insert post hashtags as author" ON public.post_hashtags FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_hashtags.post_id AND p.author_id = auth.uid())
  OR public.has_role(auth.uid(),'platform_admin')
);
CREATE POLICY "Delete post hashtags as author/admin" ON public.post_hashtags FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_hashtags.post_id AND p.author_id = auth.uid())
  OR public.has_role(auth.uid(),'platform_admin')
);

-- Updated_at triggers
CREATE TRIGGER trg_polls_updated BEFORE UPDATE ON public.polls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_question_details_updated BEFORE UPDATE ON public.question_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hashtags_updated BEFORE UPDATE ON public.hashtags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hashtag count
CREATE OR REPLACE FUNCTION public.tg_hashtag_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hashtags SET usage_count = usage_count + 1, updated_at = now() WHERE id = NEW.hashtag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hashtags SET usage_count = GREATEST(usage_count - 1, 0), updated_at = now() WHERE id = OLD.hashtag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_post_hashtags_count AFTER INSERT OR DELETE ON public.post_hashtags FOR EACH ROW EXECUTE FUNCTION public.tg_hashtag_count();

-- Auto-create question_details
CREATE OR REPLACE FUNCTION public.tg_question_post_created() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.post_type = 'question' THEN
    INSERT INTO public.question_details (post_id) VALUES (NEW.id) ON CONFLICT (post_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_post_question_created AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.tg_question_post_created();

-- Points for question/poll creation
CREATE OR REPLACE FUNCTION public.tg_gamify_question_poll() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NULL OR NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF NEW.post_type = 'question' THEN
    PERFORM public.award_points(NEW.author_id, 15, 'Asked a question', 'question_created'::public.points_source_type, NEW.id);
    PERFORM public.award_badge_by_slug(NEW.author_id, 'curious_mind');
  ELSIF NEW.post_type = 'poll' THEN
    PERFORM public.award_points(NEW.author_id, 15, 'Created a poll', 'poll_created'::public.points_source_type, NEW.id);
    PERFORM public.award_badge_by_slug(NEW.author_id, 'pollster');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_post_gamify_qpoll AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.tg_gamify_question_poll();

-- Poll vote: points + notify
CREATE OR REPLACE FUNCTION public.tg_poll_vote_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post uuid; v_author uuid; v_voter text;
BEGIN
  SELECT p.id, p.author_id INTO v_post, v_author
    FROM public.posts p JOIN public.polls pl ON pl.post_id = p.id
    WHERE pl.id = NEW.poll_id;
  PERFORM public.award_points(NEW.user_id, 5, 'Voted in a poll', 'poll_voted'::public.points_source_type, NEW.id);
  IF v_author IS NOT NULL AND v_author <> NEW.user_id THEN
    SELECT COALESCE(NULLIF(pr.full_name,''), pr.email, 'A member')
      INTO v_voter FROM public.profiles pr WHERE pr.id = NEW.user_id;
    PERFORM public.create_notification(
      v_author, 'poll_vote_received'::public.notification_type,
      v_voter || ' voted on your poll',
      NULL, 'post'::public.notification_target, v_post, NEW.user_id
    );
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_poll_vote_after AFTER INSERT ON public.poll_votes FOR EACH ROW EXECUTE FUNCTION public.tg_poll_vote_after();

-- Comment on question → notify + points
CREATE OR REPLACE FUNCTION public.tg_question_answered() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_type public.post_type; v_actor text;
BEGIN
  IF NEW.status <> 'active' OR NEW.parent_comment_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT post_type, author_id INTO v_type, v_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_type <> 'question' THEN RETURN NEW; END IF;
  IF NEW.author_id IS NOT NULL THEN
    PERFORM public.award_points(NEW.author_id, 10, 'Answered a question', 'question_answered'::public.points_source_type, NEW.id);
  END IF;
  IF v_owner IS NOT NULL AND NEW.author_id IS NOT NULL AND v_owner <> NEW.author_id THEN
    SELECT COALESCE(NULLIF(pr.full_name,''), pr.email, 'A member')
      INTO v_actor FROM public.profiles pr WHERE pr.id = NEW.author_id;
    PERFORM public.create_notification(
      v_owner, 'question_answered'::public.notification_type,
      v_actor || ' answered your question',
      LEFT(NEW.body, 200), 'post'::public.notification_target, NEW.post_id, NEW.author_id
    );
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_comment_question_answered AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.tg_question_answered();

-- Best answer notification + points
CREATE OR REPLACE FUNCTION public.tg_best_answer_set() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_comment_author uuid;
BEGIN
  IF NEW.best_answer_comment_id IS NOT NULL AND (OLD.best_answer_comment_id IS DISTINCT FROM NEW.best_answer_comment_id) THEN
    NEW.is_answered := true;
    SELECT author_id INTO v_comment_author FROM public.comments WHERE id = NEW.best_answer_comment_id;
    IF v_comment_author IS NOT NULL THEN
      PERFORM public.award_points(v_comment_author, 30, 'Answer selected as best', 'best_answer'::public.points_source_type, NEW.best_answer_comment_id);
      PERFORM public.award_badge_by_slug(v_comment_author, 'helpful_answer');
      PERFORM public.create_notification(
        v_comment_author, 'best_answer_selected'::public.notification_type,
        'Your answer was selected as best',
        NULL, 'post'::public.notification_target, NEW.post_id, NULL
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_qd_best_answer BEFORE UPDATE ON public.question_details FOR EACH ROW EXECUTE FUNCTION public.tg_best_answer_set();

-- Badges
INSERT INTO public.badges (slug, name, description, badge_type, points_value) VALUES
  ('curious_mind', 'Curious Mind', 'Asked your first question', 'milestone', 10),
  ('helpful_answer', 'Helpful Answer', 'Had an answer marked best', 'milestone', 25),
  ('pollster', 'Pollster', 'Created your first poll', 'milestone', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed a few starter hashtags
INSERT INTO public.hashtags (name) VALUES
  ('welcome'), ('introductions'), ('announcements'), ('feedback'), ('help'), ('showcase')
ON CONFLICT (name) DO NOTHING;
