-- ============================================================
-- SOMALUX COMPLETE DATABASE SETUP
-- Run this single file to set up entire database
-- ============================================================

-- ============================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'editor', 'admin', 'super_admin'
  tier TEXT DEFAULT 'free', -- 'free', 'premium', 'pro'
  tier_expiry TIMESTAMP,
  bio TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. CONTENT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon_url TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  cover_image_url TEXT,
  file_url TEXT,
  file_size INTEGER,
  pages INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

CREATE TABLE IF NOT EXISTS book_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  view_date TIMESTAMP DEFAULT NOW(),
  session_id TEXT,
  ip_address TEXT,
  device_type TEXT -- 'mobile', 'tablet', 'desktop'
);

-- ============================================================
-- 3. UNIVERSITIES & ACADEMIC
-- ============================================================

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  website TEXT,
  location TEXT,
  country TEXT,
  logo_url TEXT,
  banner_image_url TEXT,
  established_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  enrollment_year INTEGER,
  degree TEXT,
  field_of_study TEXT,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

CREATE TABLE IF NOT EXISTS past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  subject TEXT,
  course_code TEXT,
  exam_year INTEGER,
  semester TEXT,
  level TEXT, -- 'first_year', 'second_year', 'third_year', 'fourth_year'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. READING ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  pages_read INTEGER DEFAULT 0,
  progress_percent DECIMAL(5, 2) DEFAULT 0,
  duration_minutes INTEGER,
  device_type TEXT
);

CREATE TABLE IF NOT EXISTS user_reading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_books_read INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,
  total_reading_minutes INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  average_daily_reading_minutes DECIMAL(8, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  target_pages INTEGER NOT NULL,
  target_minutes INTEGER,
  current_progress INTEGER DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  description TEXT,
  badge_icon_url TEXT,
  unlock_date TIMESTAMP DEFAULT NOW(),
  progress_percent INTEGER DEFAULT 100,
  UNIQUE(user_id, achievement_name)
);

-- ============================================================
-- 5. AUTHOR INTERACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS author_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  follow_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, author_name)
);

CREATE TABLE IF NOT EXISTS author_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  like_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, author_name)
);

CREATE TABLE IF NOT EXISTS author_loves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  love_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, author_name)
);

CREATE TABLE IF NOT EXISTS author_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS author_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, author_name)
);

CREATE TABLE IF NOT EXISTS author_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  shared_date TIMESTAMP DEFAULT NOW(),
  share_platform TEXT, -- 'facebook', 'twitter', 'whatsapp', 'email'
  is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- 6. ADVERTISEMENT SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  click_url VARCHAR(2048),
  placement VARCHAR(50) NOT NULL,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  countdown_seconds INTEGER DEFAULT 10,
  is_skippable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_dismisses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  placement VARCHAR(50),
  event_type VARCHAR(20) NOT NULL, -- 'impression', 'click', 'dismiss'
  view_duration INTEGER DEFAULT 0,
  device_type VARCHAR(50),
  user_agent VARCHAR(500),
  geo_country VARCHAR(100),
  geo_region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  placement VARCHAR(50) NOT NULL,
  date_recorded DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  dismisses INTEGER DEFAULT 0,
  mobile_impressions INTEGER DEFAULT 0,
  tablet_impressions INTEGER DEFAULT 0,
  desktop_impressions INTEGER DEFAULT 0,
  avg_view_duration DECIMAL(10, 2) DEFAULT 0,
  click_through_rate DECIMAL(5, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ad_performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL UNIQUE REFERENCES ads(id) ON DELETE CASCADE,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_dismisses INTEGER DEFAULT 0,
  overall_ctr DECIMAL(5, 2) DEFAULT 0,
  unique_impressions INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  placement VARCHAR(50),
  view_duration INTEGER,
  dismissal_time TIMESTAMP DEFAULT NOW(),
  device_type VARCHAR(50)
);

-- ============================================================
-- 7. SEARCH ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  search_type TEXT, -- 'books', 'papers', 'authors'
  results_count INTEGER,
  selected_result_id UUID,
  search_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT UNIQUE NOT NULL,
  total_searches INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  popular_results TEXT[], -- Array of popular result IDs
  avg_results_count DECIMAL(8, 2),
  last_searched TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. PAYMENT & SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL, -- 'free', 'premium', 'pro'
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  payment_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. NOTIFICATIONS & COMMUNICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT, -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. FILE OPERATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  entity_type TEXT, -- 'book', 'paper', 'avatar', 'ad'
  entity_id UUID,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  downloaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  download_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================
-- 11. ADMIN & SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT, -- 'string', 'number', 'boolean', 'json'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Books
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON books(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_books_is_active ON books(is_active);

-- Book Views
CREATE INDEX IF NOT EXISTS idx_book_views_user ON book_views(user_id);
CREATE INDEX IF NOT EXISTS idx_book_views_book ON book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_date ON book_views(view_date);

-- Past Papers
CREATE INDEX IF NOT EXISTS idx_past_papers_university ON past_papers(university_id);
CREATE INDEX IF NOT EXISTS idx_past_papers_exam_year ON past_papers(exam_year);

-- Reading
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON reading_sessions(book_id);

-- Ads
CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_placement_active ON ads(placement, is_active);

-- Ad Analytics
CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad ON ad_analytics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event ON ad_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_date ON ad_analytics(created_at);

-- Search
CREATE INDEX IF NOT EXISTS idx_search_events_user ON search_events(user_id);
CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(search_query);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Books RLS
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Users can insert books" ON books FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update their own books" ON books FOR UPDATE USING (auth.uid() = uploaded_by);

-- Reading Sessions RLS
CREATE POLICY "Users can view their reading sessions" ON reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their reading sessions" ON reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Messages RLS
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, order_index) VALUES
  ('Fiction', 'fiction', 'Fictional stories and novels', 1),
  ('Science', 'science', 'Science and nature books', 2),
  ('History', 'history', 'Historical works and biographies', 3),
  ('Technology', 'technology', 'Tech and programming books', 4),
  ('Self-Help', 'self-help', 'Personal development books', 5),
  ('Education', 'education', 'Educational textbooks', 6),
  ('Business', 'business', 'Business and economics', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert sample universities
INSERT INTO universities (name, slug, code, country) VALUES
  ('University of Nairobi', 'university-of-nairobi', 'UON', 'Kenya'),
  ('Kenyatta University', 'kenyatta-university', 'KU', 'Kenya'),
  ('Strathmore University', 'strathmore-university', 'SU', 'Kenya'),
  ('Jomo Kenyatta University', 'jomo-kenyatta-university', 'JKUAT', 'Kenya'),
  ('Mount Kenya University', 'mount-kenya-university', 'MKU', 'Kenya'),
  ('Technical University of Kenya', 'technical-university-of-kenya', 'TUK', 'Kenya'),
  ('Maseno University', 'maseno-university', 'MU', 'Kenya'),
  ('Moi University', 'moi-university', 'MU2', 'Kenya')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
-- Database setup complete!
-- All tables, indexes, RLS policies, and initial data have been created.
