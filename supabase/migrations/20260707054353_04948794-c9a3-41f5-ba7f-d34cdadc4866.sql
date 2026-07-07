CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'member'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
);

INSERT INTO public.user_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences pr WHERE pr.user_id = u.id
);

INSERT INTO public.notification_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences np WHERE np.user_id = u.id
);

SELECT
  (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id))              AS missing_profiles,
  (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id))       AS missing_roles,
  (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.notification_preferences n WHERE n.user_id = u.id)) AS missing_notif_prefs;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notifications',
    'messages',
    'conversations',
    'conversation_members',
    'message_reactions'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename  = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END;
$$;

-- REVOKE EXECUTE ON FUNCTION public.lookup_invitation_by_token(TEXT)  FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.lookup_invite_link_by_token(TEXT) FROM anon;
-- ALTER TABLE public.invitations  ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32), 'hex');
-- ALTER TABLE public.invite_links ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32), 'hex');