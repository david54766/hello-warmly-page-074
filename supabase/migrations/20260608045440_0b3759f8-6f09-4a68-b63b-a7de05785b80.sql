
-- ============================================================
-- PHASE 4B: AUTOMATION EXECUTION ENGINE
-- ============================================================

-- 1. MEMBER TAGS TABLE
CREATE TABLE IF NOT EXISTS public.member_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_tags TO authenticated;
GRANT ALL ON public.member_tags TO service_role;

ALTER TABLE public.member_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tags"
  ON public.member_tags FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins manage tags"
  ON public.member_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE INDEX idx_member_tags_user ON public.member_tags(user_id);
CREATE INDEX idx_member_tags_tag ON public.member_tags(tag);

-- 2. DEDUPE TABLE
CREATE TABLE IF NOT EXISTS public.automation_runs_dedupe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  user_id UUID,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (automation_id, user_id, source_type, source_id)
);

GRANT SELECT, INSERT, DELETE ON public.automation_runs_dedupe TO authenticated;
GRANT ALL ON public.automation_runs_dedupe TO service_role;

ALTER TABLE public.automation_runs_dedupe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read dedupe"
  ON public.automation_runs_dedupe FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

-- Allow engine inserts via SECURITY DEFINER functions only (no INSERT policy for users)

-- 3. EXTEND AUTOMATION LOGS WITH SOURCE TRACKING (already has details_json)
ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- Allow engine to insert logs (SECURITY DEFINER functions run as owner, bypass RLS).
-- Already has admin insert policy.

-- 4. CONDITION EVALUATOR
CREATE OR REPLACE FUNCTION public.eval_automation_condition(
  _user_id UUID,
  _condition JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT := _condition->>'type';
  v_val TEXT := _condition->>'value';
  v_num NUMERIC;
  v_count INTEGER;
BEGIN
  IF v_type IS NULL OR _user_id IS NULL THEN RETURN true; END IF;

  CASE v_type
    WHEN 'has_role' THEN
      RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = v_val);
    WHEN 'is_in_space' THEN
      RETURN EXISTS (SELECT 1 FROM public.space_members WHERE user_id = _user_id AND space_id::text = v_val AND status = 'active');
    WHEN 'is_not_in_space' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.space_members WHERE user_id = _user_id AND space_id::text = v_val AND status = 'active');
    WHEN 'is_on_plan' THEN
      RETURN EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND plan_id::text = v_val AND status IN ('active','trialing'));
    WHEN 'is_not_on_plan' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND plan_id::text = v_val AND status IN ('active','trialing'));
    WHEN 'subscription_status' THEN
      RETURN EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND status::text = v_val);
    WHEN 'has_tag' THEN
      RETURN EXISTS (SELECT 1 FROM public.member_tags WHERE user_id = _user_id AND tag = v_val);
    WHEN 'not_has_tag' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.member_tags WHERE user_id = _user_id AND tag = v_val);
    WHEN 'has_badge' THEN
      RETURN EXISTS (SELECT 1 FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id WHERE ub.user_id = _user_id AND (b.slug = v_val OR b.id::text = v_val));
    WHEN 'not_has_badge' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id WHERE ub.user_id = _user_id AND (b.slug = v_val OR b.id::text = v_val));
    WHEN 'points_above' THEN
      v_num := COALESCE(v_val::numeric, 0);
      SELECT COALESCE(SUM(points), 0) INTO v_count FROM public.points_ledger WHERE user_id = _user_id;
      RETURN v_count > v_num;
    WHEN 'points_below' THEN
      v_num := COALESCE(v_val::numeric, 0);
      SELECT COALESCE(SUM(points), 0) INTO v_count FROM public.points_ledger WHERE user_id = _user_id;
      RETURN v_count < v_num;
    WHEN 'completed_lesson' THEN
      RETURN EXISTS (SELECT 1 FROM public.lesson_progress WHERE user_id = _user_id AND lesson_id::text = v_val AND status = 'completed');
    WHEN 'not_completed_lesson' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.lesson_progress WHERE user_id = _user_id AND lesson_id::text = v_val AND status = 'completed');
    WHEN 'completed_course' THEN
      SELECT COUNT(*) INTO v_count FROM public.lessons WHERE course_id::text = v_val;
      IF v_count = 0 THEN RETURN false; END IF;
      RETURN (SELECT COUNT(*) FROM public.lesson_progress lp JOIN public.lessons l ON l.id = lp.lesson_id WHERE l.course_id::text = v_val AND lp.user_id = _user_id AND lp.status = 'completed') >= v_count;
    WHEN 'posts_at_least' THEN
      v_num := COALESCE(v_val::numeric, 0);
      SELECT COUNT(*) INTO v_count FROM public.posts WHERE author_id = _user_id AND status = 'active';
      RETURN v_count >= v_num;
    WHEN 'lessons_completed_at_least' THEN
      v_num := COALESCE(v_val::numeric, 0);
      SELECT COUNT(*) INTO v_count FROM public.lesson_progress WHERE user_id = _user_id AND status = 'completed';
      RETURN v_count >= v_num;
    WHEN 'inactive_since' THEN
      -- placeholder: treat v_val as ISO date; member inactive if last_active_at before
      RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND last_active_at IS NOT NULL AND last_active_at < (v_val::timestamptz));
    ELSE
      RETURN true;
  END CASE;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 5. ACTION EXECUTOR (returns jsonb with status + message)
CREATE OR REPLACE FUNCTION public.exec_automation_action(
  _user_id UUID,
  _action JSONB,
  _automation_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT := _action->>'type';
  v_val TEXT := _action->>'value';
  v_badge_id UUID;
  v_admin_id UUID;
  v_count INTEGER := 0;
BEGIN
  IF v_type IS NULL THEN RETURN jsonb_build_object('status','skipped','message','no action type'); END IF;

  CASE v_type
    WHEN 'send_notification' THEN
      IF _user_id IS NULL THEN RETURN jsonb_build_object('status','skipped','message','no target user'); END IF;
      PERFORM public.create_notification(_user_id, 'admin_announcement', COALESCE(v_val,'Notification'), 'Sent by automation', 'user', _user_id, NULL);
      RETURN jsonb_build_object('status','success','message','notification sent');

    WHEN 'add_tag' THEN
      IF _user_id IS NULL OR v_val IS NULL THEN RETURN jsonb_build_object('status','skipped','message','missing user or tag'); END IF;
      INSERT INTO public.member_tags (user_id, tag, source) VALUES (_user_id, v_val, 'automation:' || _automation_id::text)
        ON CONFLICT (user_id, tag) DO NOTHING;
      RETURN jsonb_build_object('status','success','message','tag added');

    WHEN 'remove_tag' THEN
      DELETE FROM public.member_tags WHERE user_id = _user_id AND tag = v_val;
      RETURN jsonb_build_object('status','success','message','tag removed');

    WHEN 'award_badge' THEN
      IF _user_id IS NULL OR v_val IS NULL THEN RETURN jsonb_build_object('status','skipped','message','missing user or badge'); END IF;
      -- accept slug or uuid
      SELECT id INTO v_badge_id FROM public.badges WHERE slug = v_val OR id::text = v_val LIMIT 1;
      IF v_badge_id IS NULL THEN RETURN jsonb_build_object('status','failed','message','badge not found'); END IF;
      PERFORM public.award_badge_by_slug(_user_id, (SELECT slug FROM public.badges WHERE id = v_badge_id), 'Automation', NULL);
      RETURN jsonb_build_object('status','success','message','badge awarded');

    WHEN 'award_points' THEN
      IF _user_id IS NULL THEN RETURN jsonb_build_object('status','skipped','message','no target'); END IF;
      PERFORM public.award_points(_user_id, COALESCE(v_val::integer, 0), 'Automation award', 'manual'::public.points_source_type, _automation_id, false);
      RETURN jsonb_build_object('status','success','message','points awarded');

    WHEN 'invite_to_space' THEN
      IF _user_id IS NULL OR v_val IS NULL THEN RETURN jsonb_build_object('status','skipped','message','missing user or space'); END IF;
      INSERT INTO public.space_members (space_id, user_id, role, status)
        VALUES (v_val::uuid, _user_id, 'space_member', 'active')
        ON CONFLICT (space_id, user_id) DO UPDATE SET status = 'active';
      RETURN jsonb_build_object('status','success','message','added to space');

    WHEN 'remove_from_space' THEN
      UPDATE public.space_members SET status = 'inactive'
        WHERE space_id::text = v_val AND user_id = _user_id;
      RETURN jsonb_build_object('status','success','message','removed from space');

    WHEN 'grant_access' THEN
      -- v_val: "type:id" e.g. "course:uuid" or "platform:"
      DECLARE v_parts TEXT[] := string_to_array(COALESCE(v_val,'platform:'), ':');
              v_ttype TEXT := v_parts[1];
              v_tid TEXT := v_parts[2];
      BEGIN
        IF EXISTS (SELECT 1 FROM public.access_grants WHERE user_id = _user_id AND target_type::text = v_ttype AND (target_id::text IS NOT DISTINCT FROM v_tid) AND active AND (ends_at IS NULL OR ends_at > now())) THEN
          RETURN jsonb_build_object('status','skipped','message','already has active grant');
        END IF;
        INSERT INTO public.access_grants (user_id, target_type, target_id, source, granted_by, active)
          VALUES (_user_id, v_ttype::plan_item_target_type, NULLIF(v_tid,'')::uuid, 'automation', NULL, true);
        RETURN jsonb_build_object('status','success','message','access granted');
      END;

    WHEN 'revoke_access' THEN
      DECLARE v_parts TEXT[] := string_to_array(COALESCE(v_val,'platform:'), ':');
      BEGIN
        UPDATE public.access_grants SET active = false
          WHERE user_id = _user_id AND target_type::text = v_parts[1]
            AND (target_id::text IS NOT DISTINCT FROM v_parts[2]);
        RETURN jsonb_build_object('status','success','message','access revoked');
      END;

    WHEN 'notify_admin' THEN
      FOR v_admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'platform_admin' LOOP
        PERFORM public.create_notification(v_admin_id, 'admin_announcement', COALESCE(v_val, 'Automation alert'), 'Triggered by automation', 'user', _user_id, NULL);
        v_count := v_count + 1;
      END LOOP;
      RETURN jsonb_build_object('status','success','message', v_count || ' admins notified');

    WHEN 'send_private_message' THEN
      -- Placeholder: create a notification
      IF _user_id IS NULL THEN RETURN jsonb_build_object('status','skipped','message','no recipient'); END IF;
      PERFORM public.create_notification(_user_id, 'new_message', COALESCE(v_val, 'Message from team'), 'Automated message', 'user', _user_id, NULL);
      RETURN jsonb_build_object('status','success','message','message placeholder sent as notification');

    ELSE
      RETURN jsonb_build_object('status','skipped','message','unknown action type: ' || v_type);
  END CASE;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('status','failed','message', SQLERRM);
END;
$$;

-- 6. CORE RUNNER: process matching automations for a trigger
CREATE OR REPLACE FUNCTION public.run_automations(
  _trigger TEXT,
  _user_id UUID,
  _source_type TEXT DEFAULT NULL,
  _source_id UUID DEFAULT NULL,
  _payload JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a RECORD;
  cond JSONB;
  act JSONB;
  cond_results JSONB := '[]'::jsonb;
  act_results JSONB := '[]'::jsonb;
  all_passed BOOLEAN;
  one_result BOOLEAN;
  any_failed BOOLEAN;
  final_status public.automation_log_status;
  log_details JSONB;
BEGIN
  FOR a IN
    SELECT * FROM public.automations
    WHERE active = true AND trigger_type = _trigger
  LOOP
    BEGIN
      -- Dedupe check: skip if already ran for this (automation, user, source)
      IF _source_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.automation_runs_dedupe
        WHERE automation_id = a.id AND user_id IS NOT DISTINCT FROM _user_id
          AND source_type IS NOT DISTINCT FROM _source_type
          AND source_id IS NOT DISTINCT FROM _source_id
      ) THEN
        CONTINUE;
      END IF;

      -- Evaluate conditions
      all_passed := true;
      cond_results := '[]'::jsonb;
      FOR cond IN SELECT * FROM jsonb_array_elements(COALESCE(a.conditions_json, '[]'::jsonb)) LOOP
        one_result := public.eval_automation_condition(_user_id, cond);
        cond_results := cond_results || jsonb_build_array(jsonb_build_object('condition', cond, 'passed', one_result));
        IF NOT one_result THEN all_passed := false; END IF;
      END LOOP;

      IF NOT all_passed THEN
        INSERT INTO public.automation_logs (automation_id, user_id, trigger_type, status, details_json, source_type, source_id)
          VALUES (a.id, _user_id, _trigger, 'skipped',
            jsonb_build_object('reason','conditions_failed','conditions', cond_results, 'payload', _payload),
            _source_type, _source_id);
        CONTINUE;
      END IF;

      -- Execute actions
      act_results := '[]'::jsonb;
      any_failed := false;
      FOR act IN SELECT * FROM jsonb_array_elements(COALESCE(a.actions_json, '[]'::jsonb)) LOOP
        DECLARE r JSONB;
        BEGIN
          r := public.exec_automation_action(_user_id, act, a.id);
          act_results := act_results || jsonb_build_array(jsonb_build_object('action', act, 'result', r));
          IF (r->>'status') = 'failed' THEN any_failed := true; END IF;
        EXCEPTION WHEN OTHERS THEN
          act_results := act_results || jsonb_build_array(jsonb_build_object('action', act, 'result', jsonb_build_object('status','failed','message', SQLERRM)));
          any_failed := true;
        END;
      END LOOP;

      final_status := CASE WHEN any_failed THEN 'failed'::public.automation_log_status ELSE 'success'::public.automation_log_status END;
      log_details := jsonb_build_object(
        'conditions', cond_results,
        'actions', act_results,
        'payload', _payload,
        'source_type', _source_type,
        'source_id', _source_id,
        'automation_id', a.id
      );

      INSERT INTO public.automation_logs (automation_id, user_id, trigger_type, status, details_json, source_type, source_id, error_message)
        VALUES (a.id, _user_id, _trigger, final_status, log_details, _source_type, _source_id,
          CASE WHEN any_failed THEN 'One or more actions failed' ELSE NULL END);

      UPDATE public.automations
        SET last_run_at = now(),
            total_runs = total_runs + 1,
            error_count = error_count + CASE WHEN any_failed THEN 1 ELSE 0 END
        WHERE id = a.id;

      -- Dedupe insert (only if we had a source to dedupe on)
      IF _source_id IS NOT NULL THEN
        INSERT INTO public.automation_runs_dedupe (automation_id, user_id, source_type, source_id)
          VALUES (a.id, _user_id, _source_type, _source_id)
          ON CONFLICT DO NOTHING;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Never break caller
      INSERT INTO public.automation_logs (automation_id, user_id, trigger_type, status, details_json, error_message, source_type, source_id)
        VALUES (a.id, _user_id, _trigger, 'failed', jsonb_build_object('engine_error', true), SQLERRM, _source_type, _source_id);
    END;
  END LOOP;
END;
$$;

-- 7. SAFE WRAPPER for triggers (always returns NEW/OLD, never raises)
CREATE OR REPLACE FUNCTION public.tg_run_automations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trigger TEXT := TG_ARGV[0];
  v_user UUID;
  v_source_type TEXT;
  v_source_id UUID;
  rec RECORD;
BEGIN
  rec := COALESCE(NEW, OLD);

  -- Map trigger to user_id and source from common columns
  BEGIN
    EXECUTE format('SELECT ($1).%I::uuid', 'user_id') INTO v_user USING rec;
  EXCEPTION WHEN OTHERS THEN v_user := NULL; END;

  IF v_user IS NULL THEN
    BEGIN EXECUTE format('SELECT ($1).%I::uuid', 'author_id') INTO v_user USING rec; EXCEPTION WHEN OTHERS THEN END;
  END IF;
  IF v_user IS NULL THEN
    BEGIN EXECUTE format('SELECT ($1).%I::uuid', 'id') INTO v_user USING rec; EXCEPTION WHEN OTHERS THEN END;
  END IF;

  v_source_type := TG_TABLE_NAME;
  BEGIN EXECUTE format('SELECT ($1).%I::uuid', 'id') INTO v_source_id USING rec; EXCEPTION WHEN OTHERS THEN v_source_id := NULL; END;

  BEGIN
    PERFORM public.run_automations(v_trigger, v_user, v_source_type, v_source_id, to_jsonb(rec));
  EXCEPTION WHEN OTHERS THEN
    -- swallow all errors
    NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. CONNECT TRIGGERS TO PLATFORM EVENTS
-- Member joined platform (on profile insert)
DROP TRIGGER IF EXISTS tg_auto_member_joined ON public.profiles;
CREATE TRIGGER tg_auto_member_joined
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_run_automations('member_joined_platform');

-- Member joined space
CREATE OR REPLACE FUNCTION public.tg_auto_space_join() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' THEN
    BEGIN PERFORM public.run_automations('member_joined_space', NEW.user_id, 'space_members', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_space_joined ON public.space_members;
CREATE TRIGGER tg_auto_space_joined AFTER INSERT OR UPDATE ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_space_join();

-- Post created
CREATE OR REPLACE FUNCTION public.tg_auto_post() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NOT NULL AND NEW.status = 'active' THEN
    BEGIN PERFORM public.run_automations('post_created', NEW.author_id, 'posts', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_post_created ON public.posts;
CREATE TRIGGER tg_auto_post_created AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_post();

-- Comment created
CREATE OR REPLACE FUNCTION public.tg_auto_comment() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS NOT NULL AND NEW.status = 'active' THEN
    BEGIN PERFORM public.run_automations('comment_created', NEW.author_id, 'comments', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_comment_created ON public.comments;
CREATE TRIGGER tg_auto_comment_created AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_comment();

-- Reaction received
CREATE OR REPLACE FUNCTION public.tg_auto_reaction() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT author_id INTO v_owner FROM public.posts WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT author_id INTO v_owner FROM public.comments WHERE id = NEW.target_id;
  END IF;
  IF v_owner IS NOT NULL THEN
    BEGIN PERFORM public.run_automations('reaction_received', v_owner, 'reactions', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_reaction ON public.reactions;
CREATE TRIGGER tg_auto_reaction AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_reaction();

-- Report created
CREATE OR REPLACE FUNCTION public.tg_auto_report() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN PERFORM public.run_automations('report_created', NEW.reporter_id, 'reports', NEW.id, to_jsonb(NEW));
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_report ON public.reports;
CREATE TRIGGER tg_auto_report AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_report();

-- Lesson completed
CREATE OR REPLACE FUNCTION public.tg_auto_lesson() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course UUID; v_total INT; v_done INT;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    BEGIN PERFORM public.run_automations('lesson_completed', NEW.user_id, 'lessons', NEW.lesson_id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
    -- Course completion check
    SELECT course_id INTO v_course FROM public.lessons WHERE id = NEW.lesson_id;
    IF v_course IS NOT NULL THEN
      SELECT COUNT(*) INTO v_total FROM public.lessons WHERE course_id = v_course;
      SELECT COUNT(*) INTO v_done FROM public.lesson_progress lp JOIN public.lessons l ON l.id = lp.lesson_id
        WHERE l.course_id = v_course AND lp.user_id = NEW.user_id AND lp.status = 'completed';
      IF v_total > 0 AND v_done >= v_total THEN
        BEGIN PERFORM public.run_automations('course_completed', NEW.user_id, 'courses', v_course, jsonb_build_object('course_id', v_course));
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_lesson ON public.lesson_progress;
CREATE TRIGGER tg_auto_lesson AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_lesson();

-- Event RSVP
CREATE OR REPLACE FUNCTION public.tg_auto_rsvp() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN PERFORM public.run_automations('event_rsvped', NEW.user_id, 'event_rsvps', NEW.id, to_jsonb(NEW));
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_rsvp ON public.event_rsvps;
CREATE TRIGGER tg_auto_rsvp AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_rsvp();

-- Subscription status
CREATE OR REPLACE FUNCTION public.tg_auto_subscription() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trigger TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  v_trigger := CASE NEW.status::text
    WHEN 'active' THEN 'subscription_active'
    WHEN 'past_due' THEN 'subscription_past_due'
    WHEN 'canceled' THEN 'subscription_canceled'
    ELSE NULL END;
  IF v_trigger IS NOT NULL THEN
    BEGIN PERFORM public.run_automations(v_trigger, NEW.user_id, 'subscriptions', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_subscription ON public.subscriptions;
CREATE TRIGGER tg_auto_subscription AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_subscription();

-- Purchase completed
CREATE OR REPLACE FUNCTION public.tg_auto_purchase() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    BEGIN PERFORM public.run_automations('purchase_completed', NEW.user_id, 'purchases', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_purchase ON public.purchases;
CREATE TRIGGER tg_auto_purchase AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_purchase();

-- Badge awarded
CREATE OR REPLACE FUNCTION public.tg_auto_badge() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN PERFORM public.run_automations('badge_awarded', NEW.user_id, 'user_badges', NEW.id, to_jsonb(NEW));
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_badge ON public.user_badges;
CREATE TRIGGER tg_auto_badge AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_badge();

-- Points awarded — milestone check (100, 500, 1000, 5000)
CREATE OR REPLACE FUNCTION public.tg_auto_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total INT; v_milestone INT;
BEGIN
  SELECT COALESCE(SUM(points),0) INTO v_total FROM public.points_ledger WHERE user_id = NEW.user_id;
  -- Pick highest milestone reached
  FOR v_milestone IN SELECT m FROM (VALUES (5000),(1000),(500),(100)) AS t(m) LOOP
    IF v_total >= v_milestone AND (v_total - NEW.points) < v_milestone THEN
      BEGIN PERFORM public.run_automations('points_milestone_reached', NEW.user_id, 'milestones', NULL, jsonb_build_object('milestone', v_milestone, 'total', v_total));
      EXCEPTION WHEN OTHERS THEN NULL; END;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_points ON public.points_ledger;
CREATE TRIGGER tg_auto_points AFTER INSERT ON public.points_ledger
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_points();

-- Onboarding completed (profile.onboarding_completed flips true)
CREATE OR REPLACE FUNCTION public.tg_auto_onboarding() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.onboarding_completed = true AND (OLD.onboarding_completed IS DISTINCT FROM true) THEN
    BEGIN PERFORM public.run_automations('member_completed_onboarding', NEW.id, 'profiles', NEW.id, to_jsonb(NEW));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_onboarding ON public.profiles;
CREATE TRIGGER tg_auto_onboarding AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_onboarding();

-- 9. ADMIN TEST EXECUTION (returns full result for UI display, bypasses dedupe)
CREATE OR REPLACE FUNCTION public.test_automation(
  _automation_id UUID,
  _user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.automations%ROWTYPE;
  cond JSONB; act JSONB;
  cond_results JSONB := '[]'::jsonb;
  act_results JSONB := '[]'::jsonb;
  all_passed BOOLEAN := true;
  one_result BOOLEAN;
  any_failed BOOLEAN := false;
  final_status public.automation_log_status;
  r JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO a FROM public.automations WHERE id = _automation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not found'); END IF;

  FOR cond IN SELECT * FROM jsonb_array_elements(COALESCE(a.conditions_json, '[]'::jsonb)) LOOP
    one_result := public.eval_automation_condition(_user_id, cond);
    cond_results := cond_results || jsonb_build_array(jsonb_build_object('condition', cond, 'passed', one_result));
    IF NOT one_result THEN all_passed := false; END IF;
  END LOOP;

  IF all_passed THEN
    FOR act IN SELECT * FROM jsonb_array_elements(COALESCE(a.actions_json, '[]'::jsonb)) LOOP
      BEGIN
        r := public.exec_automation_action(_user_id, act, a.id);
        act_results := act_results || jsonb_build_array(jsonb_build_object('action', act, 'result', r));
        IF (r->>'status') = 'failed' THEN any_failed := true; END IF;
      EXCEPTION WHEN OTHERS THEN
        act_results := act_results || jsonb_build_array(jsonb_build_object('action', act, 'result', jsonb_build_object('status','failed','message', SQLERRM)));
        any_failed := true;
      END;
    END LOOP;
    final_status := CASE WHEN any_failed THEN 'failed' ELSE 'success' END;
  ELSE
    final_status := 'skipped';
  END IF;

  INSERT INTO public.automation_logs (automation_id, user_id, trigger_type, status, details_json, error_message)
    VALUES (a.id, _user_id, a.trigger_type, final_status,
      jsonb_build_object('test', true, 'conditions', cond_results, 'actions', act_results, 'triggered_by_user_id', auth.uid()),
      CASE WHEN any_failed THEN 'Test: action failure' ELSE NULL END);

  UPDATE public.automations SET last_run_at = now(), total_runs = total_runs + 1,
    error_count = error_count + CASE WHEN any_failed THEN 1 ELSE 0 END
    WHERE id = a.id;

  RETURN jsonb_build_object(
    'status', final_status,
    'all_conditions_passed', all_passed,
    'conditions', cond_results,
    'actions', act_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_automation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_automations(TEXT, UUID, TEXT, UUID, JSONB) TO authenticated;
