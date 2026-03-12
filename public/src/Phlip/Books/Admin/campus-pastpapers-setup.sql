-- =====================================================
-- Campus Life: Universities and Past Papers Setup
-- =====================================================
-- This script creates tables, storage buckets, RLS policies
-- and real-time functionality for Universities and Past Papers
-- =====================================================

-- =====================================================
-- 1. UNIVERSITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  cover_image_url TEXT,
  location TEXT,
  established INTEGER,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT universities_name_check CHECK (char_length(name) > 0)
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_created_at ON universities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_universities_uploaded_by ON universities(uploaded_by);

-- =====================================================
-- 2. UNIVERSITY RATINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS university_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one rating per user per university
  UNIQUE(university_id, user_id)
);

-- Indexes for ratings
CREATE INDEX IF NOT EXISTS idx_university_ratings_university ON university_ratings(university_id);
CREATE INDEX IF NOT EXISTS idx_university_ratings_user ON university_ratings(user_id);

-- =====================================================
-- 3. UNIVERSITY VIEWS TABLE (for tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS university_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Track unique views per day
  UNIQUE(university_id, user_id, DATE(viewed_at))
);

CREATE INDEX IF NOT EXISTS idx_university_views_university ON university_views(university_id);
CREATE INDEX IF NOT EXISTS idx_university_views_user ON university_views(user_id);

-- =====================================================
-- 4. PAST PAPERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  faculty TEXT NOT NULL,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  year INTEGER,
  semester TEXT,
  exam_type TEXT, -- e.g., 'Main', 'Supplementary', 'CAT'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT past_papers_unit_code_check CHECK (char_length(unit_code) > 0),
  CONSTRAINT past_papers_unit_name_check CHECK (char_length(unit_name) > 0)
);

-- Indexes for past papers
CREATE INDEX IF NOT EXISTS idx_past_papers_university ON past_papers(university_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_faculty ON past_papers(faculty);
CREATE INDEX IF NOT EXISTS idx_past_papers_unit_code ON past_papers(unit_code);
CREATE INDEX IF NOT EXISTS idx_past_papers_created_at ON past_papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_past_papers_uploaded_by ON past_papers(uploaded_by);

-- =====================================================
-- 5. PAST PAPER VIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS past_paper_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Track unique views per day
  UNIQUE(paper_id, user_id, DATE(viewed_at))
);

CREATE INDEX IF NOT EXISTS idx_past_paper_views_paper ON past_paper_views(paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_views_user ON past_paper_views(user_id);

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for university cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('university-covers', 'university-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for past papers PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('past-papers', 'past-papers', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. STORAGE POLICIES
-- =====================================================

-- University Covers Storage Policies
CREATE POLICY "University covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'university-covers');

CREATE POLICY "Authenticated users can upload university covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'university-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own university covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'university-covers' 
    AND auth.uid()::text = owner
  );

CREATE POLICY "Users can delete their own university covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'university-covers' 
    AND auth.uid()::text = owner
  );

-- Past Papers Storage Policies
CREATE POLICY "Past papers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'past-papers');

CREATE POLICY "Authenticated users can upload past papers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'past-papers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own past papers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'past-papers' 
    AND auth.uid()::text = owner
  );

CREATE POLICY "Users can delete their own past papers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'past-papers' 
    AND auth.uid()::text = owner
  );

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_paper_views ENABLE ROW LEVEL SECURITY;

-- Universities Policies
CREATE POLICY "Universities are viewable by everyone"
  ON universities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert universities"
  ON universities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own universities"
  ON universities FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own universities"
  ON universities FOR DELETE
  USING (uploaded_by = auth.uid());

-- University Ratings Policies
CREATE POLICY "University ratings are viewable by everyone"
  ON university_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ratings"
  ON university_ratings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own ratings"
  ON university_ratings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings"
  ON university_ratings FOR DELETE
  USING (user_id = auth.uid());

-- University Views Policies
CREATE POLICY "University views are viewable by everyone"
  ON university_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert views"
  ON university_views FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Past Papers Policies
CREATE POLICY "Past papers are viewable by everyone"
  ON past_papers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert past papers"
  ON past_papers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own past papers"
  ON past_papers FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own past papers"
  ON past_papers FOR DELETE
  USING (uploaded_by = auth.uid());

-- Past Paper Views Policies
CREATE POLICY "Past paper views are viewable by everyone"
  ON past_paper_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert paper views"
  ON past_paper_views FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON universities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_university_ratings_updated_at ON university_ratings;
CREATE TRIGGER update_university_ratings_updated_at
  BEFORE UPDATE ON university_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_past_papers_updated_at ON past_papers;
CREATE TRIGGER update_past_papers_updated_at
  BEFORE UPDATE ON past_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate average rating for a university
CREATE OR REPLACE FUNCTION get_university_avg_rating(university_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
  FROM university_ratings
  WHERE university_id = university_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to get total rating count for a university
CREATE OR REPLACE FUNCTION get_university_rating_count(university_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM university_ratings
  WHERE university_id = university_uuid;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 10. ENABLE REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Enable real-time for universities
ALTER PUBLICATION supabase_realtime ADD TABLE universities;
ALTER PUBLICATION supabase_realtime ADD TABLE university_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE past_papers;

-- =====================================================
-- 11. VIEWS FOR ENHANCED QUERIES
-- =====================================================

-- View to get universities with ratings
CREATE OR REPLACE VIEW universities_with_ratings AS
SELECT 
  u.*,
  COALESCE(AVG(ur.rating), 0) as avg_rating,
  COUNT(ur.id) as rating_count
FROM universities u
LEFT JOIN university_ratings ur ON u.id = ur.university_id
GROUP BY u.id;

-- View to get past papers with university info
CREATE OR REPLACE VIEW past_papers_with_university AS
SELECT 
  pp.*,
  u.name as university_name,
  u.location as university_location
FROM past_papers pp
LEFT JOIN universities u ON pp.university_id = u.id;

-- =====================================================
-- 12. SAMPLE DATA MIGRATION (Optional)
-- =====================================================

-- This section can be used to migrate existing data from UniversityData.js
-- You can run this after the tables are created

-- Example: INSERT INTO universities (name, description, location, established, student_count, cover_image_url)
-- VALUES ('University of Nairobi', 'Premier university in Kenya', 'Nairobi', 1956, 84000, 'url_here');

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- To verify the setup, run:
-- SELECT * FROM universities LIMIT 5;
-- SELECT * FROM past_papers LIMIT 5;

-- To test real-time, in your Supabase dashboard:
-- 1. Go to Database > Replication
-- 2. Ensure universities and past_papers are enabled for real-time
