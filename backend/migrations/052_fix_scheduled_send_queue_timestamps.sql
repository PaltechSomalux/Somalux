-- Fix scheduled_send_queue timezone issues
-- This addresses timezone conversion errors in the scheduled send processor

-- Ensure scheduled_send_queue columns use proper timestamp types
ALTER TABLE public.scheduled_send_queue
  ALTER COLUMN scheduled_time SET DATA TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE public.scheduled_send_queue
  ALTER COLUMN created_at SET DATA TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN updated_at SET DATA TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN processed_at SET DATA TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN cancelled_at SET DATA TYPE TIMESTAMP WITHOUT TIME ZONE;

-- Create an index on scheduled_time for query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_send_queue_scheduled_time 
  ON public.scheduled_send_queue (scheduled_time)
  WHERE status = 'pending';
