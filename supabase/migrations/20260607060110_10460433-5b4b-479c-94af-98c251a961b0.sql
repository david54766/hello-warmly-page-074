
-- Enums
CREATE TYPE public.conversation_type AS ENUM ('direct','group','space');
CREATE TYPE public.message_status AS ENUM ('active','deleted','hidden');
CREATE TYPE public.message_reaction_type AS ENUM ('like','love','celebrate','helpful');

-- Extend existing enums
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_message';
ALTER TYPE public.notification_target ADD VALUE IF NOT EXISTS 'conversation';
ALTER TYPE public.notification_target ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'message';

-- Spaces: chat toggle
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS chat_enabled boolean NOT NULL DEFAULT true;

-- Notification preferences: chat flag
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS messages_enabled boolean NOT NULL DEFAULT true;

-- conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.conversation_type NOT NULL,
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- conversation_members
CREATE TABLE public.conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  muted boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
CREATE INDEX idx_conv_members_user ON public.conversation_members(user_id);
CREATE INDEX idx_conv_members_conv ON public.conversation_members(conversation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  status public.message_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- message_reactions
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type public.message_reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, reaction_type)
);
CREATE INDEX idx_msg_react_message ON public.message_reactions(message_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Helper: can access conversation
CREATE OR REPLACE FUNCTION public.can_access_conversation(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id AND (
      public.has_role(_user_id, 'platform_admin')
      OR EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id = c.id AND m.user_id = _user_id)
      OR (c.type = 'space' AND c.space_id IS NOT NULL AND public.is_space_member(c.space_id, _user_id))
    )
  )
$$;

-- Helper: simple membership check (avoid recursion in conversation_members policies)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  )
$$;

-- RLS: conversations
CREATE POLICY "Read accessible conversations" ON public.conversations FOR SELECT TO authenticated
  USING (public.can_access_conversation(id, auth.uid()));
CREATE POLICY "Create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins manage conversations" ON public.conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin')) WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Update accessible conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (public.can_access_conversation(id, auth.uid()))
  WITH CHECK (public.can_access_conversation(id, auth.uid()));

-- RLS: conversation_members
CREATE POLICY "Read own + co-members" ON public.conversation_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'platform_admin')
    OR public.is_conversation_member(conversation_id, auth.uid())
  );
CREATE POLICY "Insert member to accessible conv" ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );
CREATE POLICY "Update own membership" ON public.conversation_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own or admin" ON public.conversation_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- RLS: messages
CREATE POLICY "Read messages in accessible conv" ON public.messages FOR SELECT TO authenticated
  USING (
    (status = 'active' OR sender_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'))
    AND public.can_access_conversation(conversation_id, auth.uid())
  );
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_conversation(conversation_id, auth.uid()));
CREATE POLICY "Update own message" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Mods hide messages" ON public.messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Delete own message" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- RLS: message_reactions
CREATE POLICY "Read reactions in accessible conv" ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.can_access_conversation(m.conversation_id, auth.uid())
  ));
CREATE POLICY "Insert own reaction" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.can_access_conversation(m.conversation_id, auth.uid())
  ));
CREATE POLICY "Delete own reaction" ON public.message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- updated_at triggers
CREATE TRIGGER conversations_set_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER conv_members_set_updated BEFORE UPDATE ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER messages_set_updated BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bump conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.tg_bump_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_bump_conv AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_conversation_on_message();

-- Notification trigger on new message (direct + group only; skip space chat)
CREATE OR REPLACE FUNCTION public.tg_notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_type public.conversation_type;
  v_sender_name text;
  v_title text;
  v_preview text;
  r RECORD;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  SELECT type, title INTO v_type, v_title FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_type = 'space' THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(p.full_name,''), p.email, 'A member')
    INTO v_sender_name FROM public.profiles p WHERE p.id = NEW.sender_id;
  v_preview := LEFT(NEW.body, 200);

  FOR r IN
    SELECT user_id FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id AND muted = false
  LOOP
    IF public.notif_pref(r.user_id, 'messages_enabled') THEN
      PERFORM public.create_notification(
        r.user_id, 'new_message',
        v_sender_name || (CASE WHEN v_type = 'group' THEN ' (' || COALESCE(v_title,'Group') || ')' ELSE '' END),
        v_preview, 'conversation', NEW.conversation_id, NEW.sender_id
      );
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
