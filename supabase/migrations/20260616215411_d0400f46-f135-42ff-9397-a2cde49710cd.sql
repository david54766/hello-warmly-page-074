
-- Extend event_type enum
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'livestream';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'webinar';

-- Livestream fields on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS livestream_provider TEXT,
  ADD COLUMN IF NOT EXISTS livestream_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS livestream_join_url TEXT,
  ADD COLUMN IF NOT EXISTS replay_url TEXT,
  ADD COLUMN IF NOT EXISTS live_chat_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calendar_url_placeholder TEXT,
  ADD COLUMN IF NOT EXISTS attendance_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_agenda_json JSONB;

-- Attendance tracking
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unknown',
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendance TO authenticated;
GRANT ALL ON public.event_attendance TO service_role;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance"
  ON public.event_attendance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators manage attendance"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'moderator'));

-- Branding controls polish
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS sidebar_style TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS login_bg_url TEXT,
  ADD COLUMN IF NOT EXISTS role_display_names JSONB;
