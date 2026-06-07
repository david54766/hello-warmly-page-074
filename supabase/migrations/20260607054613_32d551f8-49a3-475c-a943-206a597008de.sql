
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'open';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'event';
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'course';
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'lesson';

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS moderator_notes text;
