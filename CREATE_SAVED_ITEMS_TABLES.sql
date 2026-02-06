-- Create user_book_downloads table
CREATE TABLE IF NOT EXISTS user_book_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Create user_paper_downloads table
CREATE TABLE IF NOT EXISTS user_paper_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, paper_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_book_downloads_user_id ON user_book_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_downloads_downloaded_at ON user_book_downloads(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_paper_downloads_user_id ON user_paper_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paper_downloads_downloaded_at ON user_paper_downloads(downloaded_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_book_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_paper_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for user_book_downloads - Users can only see their own downloads
CREATE POLICY "Users can view their own book downloads"
  ON user_book_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book downloads"
  ON user_book_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book downloads"
  ON user_book_downloads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policy for user_paper_downloads - Users can only see their own downloads
CREATE POLICY "Users can view their own paper downloads"
  ON user_paper_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paper downloads"
  ON user_paper_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paper downloads"
  ON user_paper_downloads
  FOR DELETE
  USING (auth.uid() = user_id);
