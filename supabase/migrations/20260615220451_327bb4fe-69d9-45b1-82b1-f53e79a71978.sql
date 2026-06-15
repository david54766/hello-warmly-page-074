
-- ai_helper_settings (single-row config, admin-only)
CREATE TABLE public.ai_helper_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_ai_enabled boolean NOT NULL DEFAULT false,
  allow_course_content boolean NOT NULL DEFAULT true,
  allow_lesson_content boolean NOT NULL DEFAULT true,
  allow_post_content boolean NOT NULL DEFAULT true,
  allow_event_content boolean NOT NULL DEFAULT true,
  allow_resource_content boolean NOT NULL DEFAULT true,
  require_approved_sources boolean NOT NULL DEFAULT true,
  fallback_message text NOT NULL DEFAULT 'I do not have enough information to answer that yet. Try checking the course library, events page, or asking an admin.',
  assistant_name text NOT NULL DEFAULT 'Community Helper',
  assistant_instructions text NOT NULL DEFAULT 'You are a friendly community helper. Use approved content to help members find lessons, posts, events, and resources. If you do not know, say so clearly.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_helper_settings TO authenticated;
GRANT ALL ON public.ai_helper_settings TO service_role;
ALTER TABLE public.ai_helper_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone authed reads helper settings"
  ON public.ai_helper_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage helper settings"
  ON public.ai_helper_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- ai_content_sources (admin-curated content references for member AI)
CREATE TABLE public.ai_content_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid,
  title text NOT NULL,
  content text,
  visibility text NOT NULL DEFAULT 'public',
  approved_for_member_ai boolean NOT NULL DEFAULT false,
  embedding_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_content_sources TO authenticated;
GRANT ALL ON public.ai_content_sources TO service_role;
ALTER TABLE public.ai_content_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read approved sources"
  ON public.ai_content_sources FOR SELECT TO authenticated
  USING (approved_for_member_ai = true OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "admins manage sources"
  ON public.ai_content_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- ai_member_insights (admin-only)
CREATE TABLE public.ai_member_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  summary text NOT NULL,
  engagement_level text NOT NULL DEFAULT 'medium',
  risk_level text NOT NULL DEFAULT 'none',
  suggested_actions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_message text,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_member_insights_user_idx ON public.ai_member_insights(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_member_insights TO authenticated;
GRANT ALL ON public.ai_member_insights TO service_role;
ALTER TABLE public.ai_member_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage member insights"
  ON public.ai_member_insights FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- member_ai_conversations (per-user)
CREATE TABLE public.member_ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_ai_conv_user_idx ON public.member_ai_conversations(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_ai_conversations TO authenticated;
GRANT ALL ON public.member_ai_conversations TO service_role;
ALTER TABLE public.member_ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own conversations select"
  ON public.member_ai_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "users own conversations insert"
  ON public.member_ai_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users own conversations update"
  ON public.member_ai_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users own conversations delete"
  ON public.member_ai_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- member_ai_messages
CREATE TABLE public.member_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.member_ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  related_sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_ai_msg_conv_idx ON public.member_ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_ai_messages TO authenticated;
GRANT ALL ON public.member_ai_messages TO service_role;
ALTER TABLE public.member_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own ai messages"
  ON public.member_ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.member_ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'))));
CREATE POLICY "users insert own ai messages"
  ON public.member_ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.member_ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "users delete own ai messages"
  ON public.member_ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.member_ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- updated_at trigger reuse
CREATE TRIGGER ai_helper_settings_touch BEFORE UPDATE ON public.ai_helper_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_content_sources_touch BEFORE UPDATE ON public.ai_content_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_member_insights_touch BEFORE UPDATE ON public.ai_member_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER member_ai_conv_touch BEFORE UPDATE ON public.member_ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: helper settings + sample sources
INSERT INTO public.ai_helper_settings (member_ai_enabled) VALUES (false);

INSERT INTO public.ai_content_sources (source_type, title, content, visibility, approved_for_member_ai, embedding_status) VALUES
  ('platform_page_placeholder', 'Welcome to the Community', 'A friendly overview of how this community works, where to start, and how to find your first conversation.', 'public', true, 'ready'),
  ('course', 'Getting Started Course', 'A short orientation course covering the basics: spaces, posts, events, and how to set up your profile.', 'public', true, 'ready'),
  ('lesson', 'Lesson: Introduce Yourself', 'A quick lesson on how to write a great introduction post in the Welcome space.', 'public', true, 'ready'),
  ('event', 'Monthly Live Q&A', 'A monthly live event where members can ask questions about courses, content, and community.', 'public', true, 'ready'),
  ('resource_placeholder', 'Resource Library (Coming Soon)', 'A planned library of downloadable guides and templates.', 'public', false, 'pending'),
  ('announcement', 'New Courses This Month', 'Announcement summarizing the latest courses available to members.', 'public', true, 'ready');
