-- ============================================================
-- ENHANCED AD SYSTEM - VIDEO SUPPORT & ADVANCED FEATURES
-- ============================================================

-- ============================================================
-- 1. ALTER EXISTING ADS TABLE - ADD NEW COLUMNS
-- ============================================================

ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_type VARCHAR(50) DEFAULT 'image'; -- 'image', 'video', 'carousel'
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_url VARCHAR(2048);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_duration INTEGER DEFAULT 0; -- Duration in seconds
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_thumbnail_url VARCHAR(2048);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100) DEFAULT 'Learn More';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_button_color VARCHAR(20) DEFAULT '#007bff';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS daily_budget DECIMAL(10, 2);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cost_per_click DECIMAL(10, 2) DEFAULT 0.5;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 100;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_gender VARCHAR(50); -- 'all', 'male', 'female'
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_devices TEXT; -- JSON: ["mobile", "tablet", "desktop"]
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_locations TEXT; -- JSON: array of countries/regions
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_interests TEXT; -- JSON: array of interests
ALTER TABLE ads ADD COLUMN IF NOT EXISTS frequency_cap INTEGER DEFAULT 0; -- Max impressions per user per day
ALTER TABLE ads ADD COLUMN IF NOT EXISTS conversion_tracking BOOLEAN DEFAULT false;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS conversion_url VARCHAR(2048);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS pixel_id VARCHAR(255);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'; -- 'draft', 'scheduled', 'active', 'paused', 'completed'
ALTER TABLE ads ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ab_test_group VARCHAR(50); -- 'control', 'variant_a', 'variant_b', etc.
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ab_test_id UUID;

-- ============================================================
-- 2. CREATE VIDEO AD PLAYBACK TRACKING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_video_playback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  placement VARCHAR(50),
  device_type VARCHAR(50),
  video_duration INTEGER,
  play_duration INTEGER, -- How long user watched
  percentage_watched INTEGER, -- 0-100
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  paused_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE CAROUSEL SLIDES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_carousel_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  image_url VARCHAR(2048),
  video_url VARCHAR(2048),
  title VARCHAR(255),
  description TEXT,
  cta_text VARCHAR(100),
  cta_url VARCHAR(2048),
  duration_seconds INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ad_id, slide_number)
);

-- ============================================================
-- 4. CREATE CONVERSION TRACKING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  conversion_type VARCHAR(100), -- 'purchase', 'signup', 'download', 'view'
  conversion_value DECIMAL(10, 2) DEFAULT 0,
  pixel_id VARCHAR(255),
  referral_source VARCHAR(255),
  converted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. CREATE AD CAMPAIGN TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  objective VARCHAR(50) NOT NULL, -- 'awareness', 'reach', 'traffic', 'conversions'
  budget DECIMAL(12, 2),
  daily_budget DECIMAL(10, 2),
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed'
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. CREATE A/B TESTING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  control_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  variant_a_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  variant_b_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  variant_c_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  test_duration_days INTEGER DEFAULT 7,
  sample_size_percent INTEGER DEFAULT 50,
  winning_variant VARCHAR(50), -- 'control', 'a', 'b', 'c'
  confidence_level DECIMAL(5, 2) DEFAULT 0.95,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. CREATE AUDIENCE SEGMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_criteria TEXT NOT NULL, -- JSON: age range, gender, interests, devices, locations
  audience_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. ENHANCE AD ANALYTICS TABLE
-- ============================================================

ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS video_played BOOLEAN DEFAULT false;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS video_completion_percent INTEGER DEFAULT 0;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS play_duration INTEGER DEFAULT 0;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS conversion_event BOOLEAN DEFAULT false;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS revenue DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS audience_segment_id UUID REFERENCES ad_audience_segments(id);

-- ============================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_ab_test ON ads(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON ads(priority DESC);

CREATE INDEX IF NOT EXISTS idx_ad_video_playback_ad ON ad_video_playback(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_video_playback_completion ON ad_video_playback(percentage_watched);
CREATE INDEX IF NOT EXISTS idx_ad_video_playback_date ON ad_video_playback(created_at);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_ad ON ad_carousel_slides(ad_id);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_number ON ad_carousel_slides(ad_id, slide_number);

CREATE INDEX IF NOT EXISTS idx_conversions_ad ON ad_conversions(ad_id);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON ad_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON ad_conversions(converted_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ab_tests_campaign ON ad_ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ad_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_analytics_video ON ad_analytics(video_played);
CREATE INDEX IF NOT EXISTS idx_analytics_revenue ON ad_analytics(revenue);
CREATE INDEX IF NOT EXISTS idx_analytics_cost ON ad_analytics(cost);

-- ============================================================
-- 10. CREATE VIEWS FOR REPORTING
-- ============================================================

DROP VIEW IF EXISTS ad_performance_by_type CASCADE;
CREATE VIEW ad_performance_by_type AS
SELECT 
  ad_type,
  COUNT(DISTINCT ads.id) as total_ads,
  SUM(ads.total_impressions) as total_impressions,
  SUM(ads.total_clicks) as total_clicks,
  SUM(ads.total_dismisses) as total_dismisses,
  ROUND(
    CASE 
      WHEN SUM(ads.total_impressions) > 0 
      THEN (SUM(ads.total_clicks)::DECIMAL / SUM(ads.total_impressions)) * 100 
      ELSE 0 
    END, 2
  ) as click_through_rate,
  AVG(ads.countdown_seconds) as avg_countdown
FROM ads
GROUP BY ad_type;

DROP VIEW IF EXISTS campaign_performance CASCADE;
CREATE VIEW campaign_performance AS
SELECT 
  c.id,
  c.name,
  c.objective,
  COUNT(DISTINCT a.id) as total_ads,
  SUM(a.total_impressions) as impressions,
  SUM(a.total_clicks) as clicks,
  ROUND(
    CASE 
      WHEN SUM(a.total_impressions) > 0 
      THEN (SUM(a.total_clicks)::DECIMAL / SUM(a.total_impressions)) * 100 
      ELSE 0 
    END, 2
  ) as ctr,
  c.budget,
  c.budget_spent,
  c.status,
  c.start_date,
  c.end_date
FROM ad_campaigns c
LEFT JOIN ads a ON c.id = a.campaign_id
GROUP BY c.id, c.name, c.objective, c.budget, c.budget_spent, c.status, c.start_date, c.end_date;

DROP VIEW IF EXISTS video_ad_performance CASCADE;
CREATE VIEW video_ad_performance AS
SELECT 
  a.id,
  a.title,
  a.video_duration,
  COUNT(DISTINCT avp.id) as total_plays,
  COUNT(CASE WHEN avp.completed = true THEN 1 END) as completed_plays,
  ROUND(AVG(avp.percentage_watched), 2) as avg_watch_percentage,
  ROUND(AVG(avp.play_duration), 2) as avg_play_duration,
  SUM(avp.paused_count) as total_pauses
FROM ads a
LEFT JOIN ad_video_playback avp ON a.id = avp.ad_id
WHERE a.ad_type = 'video'
GROUP BY a.id, a.title, a.video_duration;

-- ============================================================
-- 11. CREATE TRIGGER FOR CAMPAIGN BUDGET TRACKING
-- ============================================================

CREATE OR REPLACE FUNCTION update_campaign_budget()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ad_campaigns 
  SET budget_spent = budget_spent + NEW.cost
  WHERE id = (SELECT campaign_id FROM ads WHERE id = NEW.ad_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_campaign_budget ON ad_analytics;
CREATE TRIGGER trg_update_campaign_budget
AFTER INSERT ON ad_analytics
FOR EACH ROW
EXECUTE FUNCTION update_campaign_budget();

-- ============================================================
-- 12. CREATE STORED FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================

-- Function to get ad by type and placement
CREATE OR REPLACE FUNCTION get_ads_by_type(
  p_ad_type VARCHAR(50),
  p_placement VARCHAR(50),
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  image_url VARCHAR,
  video_url VARCHAR,
  click_url VARCHAR,
  ad_type VARCHAR,
  placement VARCHAR,
  countdown_seconds INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.image_url,
    a.video_url,
    a.click_url,
    a.ad_type,
    a.placement,
    a.countdown_seconds,
    a.is_active
  FROM ads a
  WHERE a.ad_type = p_ad_type 
    AND a.placement = p_placement
    AND a.is_active = true
    AND (a.start_date IS NULL OR a.start_date <= NOW())
    AND (a.end_date IS NULL OR a.end_date >= NOW())
  ORDER BY a.priority DESC, a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate ad ROI
CREATE OR REPLACE FUNCTION calculate_ad_roi(p_ad_id UUID)
RETURNS TABLE (
  ad_id UUID,
  total_cost DECIMAL,
  total_revenue DECIMAL,
  total_conversions BIGINT,
  roi_percent DECIMAL,
  roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_ad_id,
    COALESCE(SUM(aa.cost), 0)::DECIMAL,
    COALESCE(SUM(ac.conversion_value), 0)::DECIMAL,
    COUNT(DISTINCT ac.id),
    CASE 
      WHEN SUM(aa.cost) > 0 
      THEN ROUND(((SUM(ac.conversion_value) - SUM(aa.cost)) / SUM(aa.cost)) * 100, 2)
      ELSE 0
    END,
    CASE 
      WHEN SUM(aa.cost) > 0 
      THEN ROUND(SUM(ac.conversion_value) / SUM(aa.cost), 2)
      ELSE 0
    END
  FROM ad_analytics aa
  LEFT JOIN ad_conversions ac ON aa.ad_id = ac.ad_id
  WHERE aa.ad_id = p_ad_id
  GROUP BY p_ad_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 13. PERMISSIONS & ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Disable RLS for now (implement based on your auth model)
-- ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

COMMIT;
