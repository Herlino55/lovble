
-- Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_updater';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_deleter';

-- Add parent_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id uuid DEFAULT NULL;
