
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'mock',
  model text NOT NULL DEFAULT 'mock-model',
  api_key_placeholder text,
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 1024,
  ai_enabled boolean NOT NULL DEFAULT true,
  mock_mode_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_settings_admin_all ON public.ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type text NOT NULL DEFAULT 'admin_assistant',
  context_id uuid,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_conversations_admin_all ON public.ai_conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations (user_id, updated_at DESC);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_messages_admin_all ON public.ai_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE INDEX ai_messages_conv_idx ON public.ai_messages (conversation_id, created_at);

CREATE TABLE public.ai_generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'post',
  title text NOT NULL DEFAULT 'Untitled draft',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  target_type text,
  target_id uuid,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generated_content TO authenticated;
GRANT ALL ON public.ai_generated_content TO service_role;
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_drafts_admin_all ON public.ai_generated_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));
CREATE INDEX ai_drafts_user_idx ON public.ai_generated_content (user_id, created_at DESC);

CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_type text NOT NULL,
  prompt_tokens_placeholder integer NOT NULL DEFAULT 0,
  completion_tokens_placeholder integer NOT NULL DEFAULT 0,
  total_tokens_placeholder integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_admin_all ON public.ai_usage_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

INSERT INTO public.ai_settings (provider, model, ai_enabled, mock_mode_enabled, temperature, max_tokens)
VALUES ('mock','mock-model',true,true,0.7,1024);

DO $$
DECLARE admin_id uuid; conv_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role='platform_admin' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.ai_conversations (user_id, title) VALUES (admin_id,'Welcome post brainstorm') RETURNING id INTO conv_id;
  INSERT INTO public.ai_messages (conversation_id, role, content) VALUES
    (conv_id,'user','Help me draft a welcome post for new members.'),
    (conv_id,'assistant','Welcome to MemberHub! We are thrilled to have you join our community. Introduce yourself, explore the Spaces, and check out upcoming events.');
  INSERT INTO public.ai_generated_content (user_id, content_type, title, body, status) VALUES
    (admin_id,'post','Welcome to MemberHub','Welcome to MemberHub! We are thrilled to have you join our community. Introduce yourself, explore Spaces, and join an event.','draft');
  INSERT INTO public.ai_usage_events (user_id, feature_type, status) VALUES
    (admin_id,'assistant_chat','ok'),
    (admin_id,'suggested_action','ok'),
    (admin_id,'mock_response','ok'),
    (admin_id,'draft_saved','ok');
END $$;
