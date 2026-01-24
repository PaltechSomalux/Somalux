-- Fix created_by column to be nullable
ALTER TABLE public.admin_notifications 
ALTER COLUMN created_by DROP NOT NULL;
