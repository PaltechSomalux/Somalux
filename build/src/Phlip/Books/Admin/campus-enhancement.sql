-- =====================================================
-- Campus Enhancement: Multiple Images & Auto-Prefill
-- =====================================================
-- Run this AFTER the main campus-pastpapers-setup.sql
-- =====================================================

-- =====================================================
-- 1. UNIVERSITY IMAGES TABLE (Multiple Images Support)
-- =====================================================

CREATE TABLE IF NOT EXISTS university_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_university_images_university_id ON university_images(university_id);
CREATE INDEX IF NOT EXISTS idx_university_images_primary ON university_images(university_id, is_primary);

-- Trigger to ensure only one primary image per university
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE university_images 
    SET is_primary = false 
    WHERE university_id = NEW.university_id 
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_image
BEFORE INSERT OR UPDATE ON university_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_image();

-- =====================================================
-- 2. RLS POLICIES FOR UNIVERSITY IMAGES
-- =====================================================

ALTER TABLE university_images ENABLE ROW LEVEL SECURITY;

-- Allow public to view images
CREATE POLICY "University images are viewable by everyone"
ON university_images FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert images
CREATE POLICY "Authenticated users can insert images"
ON university_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON university_images FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON university_images FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);

-- =====================================================
-- 3. AUTO-PREFILL DATA CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS university_prefill_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT, -- e.g., 'wikipedia', 'manual', 'api'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(university_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prefill_cache_name ON university_prefill_cache(university_name);

-- =====================================================
-- 4. ENHANCED UNIVERSITIES VIEW WITH IMAGES
-- =====================================================

CREATE OR REPLACE VIEW universities_with_images AS
SELECT 
  u.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ui.id,
        'image_url', ui.image_url,
        'caption', ui.caption,
        'is_primary', ui.is_primary,
        'display_order', ui.display_order
      ) ORDER BY ui.is_primary DESC, ui.display_order ASC
    ) FILTER (WHERE ui.id IS NOT NULL),
    '[]'::json
  ) as images,
  (SELECT image_url FROM university_images WHERE university_id = u.id AND is_primary = true LIMIT 1) as primary_image
FROM universities u
LEFT JOIN university_images ui ON u.id = ui.id
GROUP BY u.id;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to add image to university
CREATE OR REPLACE FUNCTION add_university_image(
  p_university_id UUID,
  p_image_url TEXT,
  p_caption TEXT DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT false,
  p_display_order INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_image_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Insert image
  INSERT INTO university_images (
    university_id, 
    image_url, 
    caption, 
    is_primary, 
    display_order,
    uploaded_by
  )
  VALUES (
    p_university_id,
    p_image_url,
    p_caption,
    p_is_primary,
    p_display_order,
    v_user_id
  )
  RETURNING id INTO v_image_id;
  
  RETURN v_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set primary image
CREATE OR REPLACE FUNCTION set_primary_university_image(
  p_image_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE university_images
  SET is_primary = true
  WHERE id = p_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get university images
CREATE OR REPLACE FUNCTION get_university_images(p_university_id UUID)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  caption TEXT,
  is_primary BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.image_url,
    ui.caption,
    ui.is_primary,
    ui.display_order
  FROM university_images ui
  WHERE ui.university_id = p_university_id
  ORDER BY ui.is_primary DESC, ui.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. SAMPLE PREFILL DATA (Kenyan Universities)
-- =====================================================

-- Insert sample prefill data for quick testing
INSERT INTO university_prefill_cache (university_name, data, source) VALUES
(
  'University of Nairobi',
  '{
    "name": "University of Nairobi",
    "description": "The University of Nairobi is a collegiate research university based in Nairobi, Kenya. It was established in 1956 as the Royal Technical College and is the oldest university in Kenya and the largest by enrollment.",
    "website_url": "https://www.uonbi.ac.ke",
    "location": "Nairobi, Kenya",
    "established": 1956,
    "student_count": 84000,
    "cover_images": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/University_of_Nairobi_Main_Campus.jpg/1200px-University_of_Nairobi_Main_Campus.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/UON_Tower.jpg/800px-UON_Tower.jpg"
    ]
  }'::jsonb,
  'wikipedia'
),
(
  'Kenyatta University',
  '{
    "name": "Kenyatta University",
    "description": "Kenyatta University is a public research university with its main campus in Nairobi County, Kenya. It was established in 1985 and is named after Jomo Kenyatta, Kenya''s first president.",
    "website_url": "https://www.ku.ac.ke",
    "location": "Nairobi, Kenya",
    "established": 1985,
    "student_count": 70000,
    "cover_images": [
      "https://www.ku.ac.ke/images/banner1.jpg"
    ]
  }'::jsonb,
  'wikipedia'
),
(
  'Moi University',
  '{
    "name": "Moi University",
    "description": "Moi University is a public university located in Eldoret, Kenya. It was established in 1984 and is named after Daniel arap Moi, the second president of Kenya.",
    "website_url": "https://www.mu.ac.ke",
    "location": "Eldoret, Kenya",
    "established": 1984,
    "student_count": 45000,
    "cover_images": []
  }'::jsonb,
  'wikipedia'
),
(
  'Jomo Kenyatta University of Agriculture and Technology',
  '{
    "name": "Jomo Kenyatta University of Agriculture and Technology",
    "description": "JKUAT is a public university near Nairobi, Kenya. It is known for its agricultural and technological programs and was established as a middle-level college in 1981.",
    "website_url": "https://www.jkuat.ac.ke",
    "location": "Juja, Kenya",
    "established": 1994,
    "student_count": 40000,
    "cover_images": []
  }'::jsonb,
  'wikipedia'
),
(
  'Egerton University',
  '{
    "name": "Egerton University",
    "description": "Egerton University is a public university in Kenya. It was founded as a farm school in 1939 and became a full university in 1987. The university is known for its agricultural programs.",
    "website_url": "https://www.egerton.ac.ke",
    "location": "Njoro, Kenya",
    "established": 1987,
    "student_count": 35000,
    "cover_images": []
  }'::jsonb,
  'wikipedia'
)
ON CONFLICT (university_name) DO UPDATE
SET data = EXCLUDED.data, updated_at = now();

-- =====================================================
-- 7. API FUNCTION TO FETCH PREFILL DATA
-- =====================================================

CREATE OR REPLACE FUNCTION get_university_prefill_data(p_university_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT data INTO v_data
  FROM university_prefill_cache
  WHERE LOWER(university_name) = LOWER(p_university_name);
  
  RETURN v_data;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. SEARCH FUNCTION FOR AUTO-COMPLETE
-- =====================================================

CREATE OR REPLACE FUNCTION search_university_names(p_query TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (university_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT upc.university_name
  FROM university_prefill_cache upc
  WHERE LOWER(upc.university_name) LIKE LOWER(p_query || '%')
  ORDER BY upc.university_name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- To verify the setup, run:
-- SELECT * FROM university_images LIMIT 5;
-- SELECT * FROM university_prefill_cache;
-- SELECT * FROM universities_with_images LIMIT 5;
