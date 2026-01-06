-- Feature Flags Table Schema
-- Run this migration to setup the feature flags system

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id BIGSERIAL PRIMARY KEY,
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  min_tier TEXT CHECK (min_tier IN ('free', 'pro', 'premium')),
  config JSONB DEFAULT '{}'::jsonb,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX idx_feature_flags_created_at ON public.feature_flags(created_at);

-- Create feature_flag_events table (optional - for auditing)
CREATE TABLE IF NOT EXISTS public.feature_flag_events (
  id BIGSERIAL PRIMARY KEY,
  feature_id BIGINT REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'enabled', 'disabled', 'rollout_changed')),
  old_value JSONB,
  new_value JSONB,
  changed_by TEXT, -- admin user id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on events
CREATE INDEX idx_feature_flag_events_feature_id ON public.feature_flag_events(feature_id);
CREATE INDEX idx_feature_flag_events_created_at ON public.feature_flag_events(created_at);

-- Enable RLS (Row Level Security) on feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read feature flags
CREATE POLICY "Allow public read feature_flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Policy: Only admins can write
CREATE POLICY "Allow admin write feature_flags"
  ON public.feature_flags
  FOR INSERT
  WITH CHECK (
    -- TODO: Add admin check
    true
  );

CREATE POLICY "Allow admin update feature_flags"
  ON public.feature_flags
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin delete feature_flags"
  ON public.feature_flags
  FOR DELETE
  USING (true);

-- Seed initial features (optional)
INSERT INTO public.feature_flags (feature_key, name, description, enabled, rollout_percentage, version)
VALUES
  ('dark_mode', 'Dark Mode', 'Enable dark theme across the app', true, 100, '1.0.0'),
  ('new_search_ui', 'New Search UI', 'Updated search interface with improved UX', true, 50, '1.0.0'),
  ('advanced_filters', 'Advanced Filters', 'Enhanced filtering options for content discovery', false, 0, '1.0.0'),
  ('ai_recommendations', 'AI Recommendations', 'ML-based content recommendations', false, 10, '1.0.0'),
  ('collaboration_tools', 'Collaboration Tools', 'Real-time collaboration features', false, 0, '1.0.0')
ON CONFLICT (feature_key) DO NOTHING;

-- Create a view for easier querying
CREATE OR REPLACE VIEW public.vw_active_features AS
SELECT 
  feature_key,
  name,
  description,
  rollout_percentage,
  config,
  version,
  updated_at
FROM public.feature_flags
WHERE enabled = true
ORDER BY updated_at DESC;

-- Grant permissions
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT SELECT ON public.vw_active_features TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;
GRANT ALL ON public.feature_flag_events TO service_role;
