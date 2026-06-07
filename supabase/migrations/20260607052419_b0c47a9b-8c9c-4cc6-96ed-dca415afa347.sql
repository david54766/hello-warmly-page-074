
-- Enums
CREATE TYPE public.event_type AS ENUM ('in_person','virtual','workshop','community_call','course_session','livestream_placeholder');
CREATE TYPE public.event_visibility AS ENUM ('public','members_only','space_members','hidden');
CREATE TYPE public.event_access AS ENUM ('free','preview','paid_placeholder');
CREATE TYPE public.event_status AS ENUM ('draft','published','canceled','completed');
CREATE TYPE public.rsvp_status AS ENUM ('going','not_going','waitlist');

-- events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type public.event_type NOT NULL DEFAULT 'community_call',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  location text,
  virtual_link text,
  cover_image_url text,
  rsvp_limit integer,
  visibility public.event_visibility NOT NULL DEFAULT 'space_members',
  access_level public.event_access NOT NULL DEFAULT 'free',
  status public.event_status NOT NULL DEFAULT 'published',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Access function
CREATE OR REPLACE FUNCTION public.can_access_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND e.status <> 'draft'
      AND e.visibility <> 'hidden'
      AND (
        public.has_role(_user_id, 'platform_admin')
        OR e.visibility = 'public'
        OR (e.visibility IN ('members_only','space_members') AND public.can_access_space(e.space_id, _user_id))
      )
  )
$$;

CREATE POLICY "Read accessible events" ON public.events
  FOR SELECT TO authenticated
  USING (
    status <> 'draft'
    AND visibility <> 'hidden'
    AND (
      public.has_role(auth.uid(), 'platform_admin')
      OR visibility = 'public'
      OR (visibility IN ('members_only','space_members') AND public.can_access_space(space_id, auth.uid()))
    )
  );

CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Space hosts manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.is_space_host(space_id, auth.uid()))
  WITH CHECK (public.is_space_host(space_id, auth.uid()));

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX events_space_id_idx ON public.events(space_id);
CREATE INDEX events_start_time_idx ON public.events(start_time);

-- event_rsvps table
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.rsvp_status NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read rsvps for accessible events" ON public.event_rsvps
  FOR SELECT TO authenticated
  USING (public.can_access_event(event_id, auth.uid()) OR user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

CREATE POLICY "Insert own rsvp" ON public.event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_access_event(event_id, auth.uid()));

CREATE POLICY "Update own rsvp" ON public.event_rsvps
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own rsvp" ON public.event_rsvps
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'platform_admin'));

CREATE POLICY "Admins manage rsvps" ON public.event_rsvps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(),'platform_admin'));

CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX event_rsvps_event_id_idx ON public.event_rsvps(event_id);
CREATE INDEX event_rsvps_user_id_idx ON public.event_rsvps(user_id);

-- Seed sample events (pick first available space per type)
INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, location, virtual_link, visibility, access_level, status)
SELECT s.id, 'New Member Welcome Call',
  'Meet the team, learn how to get the most out of the community, and ask any onboarding questions.',
  'community_call', now() + interval '3 days', now() + interval '3 days 1 hour', 'UTC',
  NULL, 'https://meet.example.com/welcome', 'public','free','published'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order LIMIT 1;

INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, virtual_link, visibility, access_level, status)
SELECT s.id, 'Weekly Community Session',
  'Our recurring open session — share wins, ask questions, get feedback.',
  'community_call', now() + interval '7 days', now() + interval '7 days 1 hour', 'UTC',
  'https://meet.example.com/weekly','members_only','free','published'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order OFFSET 1 LIMIT 1;

INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, virtual_link, visibility, access_level, status)
SELECT s.id, 'Course Q&A Workshop',
  'Bring your questions about the latest course modules and work through them live.',
  'workshop', now() + interval '10 days', now() + interval '10 days 90 minutes', 'UTC',
  'https://meet.example.com/qa','space_members','free','published'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order OFFSET 2 LIMIT 1;

INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, visibility, access_level, status)
SELECT s.id, 'Live Training Placeholder',
  'Livestreaming will be available in a future release. This is a placeholder for upcoming live trainings.',
  'livestream_placeholder', now() + interval '14 days', now() + interval '14 days 1 hour', 'UTC',
  'space_members','free','published'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order OFFSET 3 LIMIT 1;

INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, visibility, access_level, status)
SELECT s.id, 'VIP Roundtable Placeholder',
  'An exclusive roundtable for VIP members. Paid event support is coming in a future phase.',
  'workshop', now() + interval '21 days', now() + interval '21 days 1 hour', 'UTC',
  'space_members','paid_placeholder','published'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order OFFSET 4 LIMIT 1;

-- Past event for demo
INSERT INTO public.events (space_id, title, description, event_type, start_time, end_time, timezone, visibility, access_level, status)
SELECT s.id, 'Kickoff Session (Recap)',
  'Our community kickoff session. Recordings and notes are pinned in the Space.',
  'community_call', now() - interval '7 days', now() - interval '7 days' + interval '1 hour', 'UTC',
  'public','free','completed'
FROM public.spaces s WHERE NOT s.is_archived ORDER BY s.sort_order LIMIT 1;
