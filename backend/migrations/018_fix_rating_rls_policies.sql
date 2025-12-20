-- Migration 018: Fix RLS Policies for All Rating Tables
-- Add missing RLS policies for book_ratings and author_ratings

-- ============================================================
-- BOOK RATINGS RLS POLICIES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view book ratings" ON public.book_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert book ratings" ON public.book_ratings;
DROP POLICY IF EXISTS "Users can update own book ratings" ON public.book_ratings;
DROP POLICY IF EXISTS "Users can delete own book ratings" ON public.book_ratings;

-- RLS Policy 1: Anyone can view book ratings
CREATE POLICY "Anyone can view book ratings"
  ON public.book_ratings
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert book ratings
CREATE POLICY "Authenticated users can insert book ratings"
  ON public.book_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can update their own book ratings
CREATE POLICY "Users can update own book ratings"
  ON public.book_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 4: Users can delete their own book ratings
CREATE POLICY "Users can delete own book ratings"
  ON public.book_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- AUTHOR RATINGS RLS POLICIES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Users can update own author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Users can delete own author ratings" ON public.author_ratings;

-- RLS Policy 1: Anyone can view author ratings
CREATE POLICY "Anyone can view author ratings"
  ON public.author_ratings
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert author ratings
CREATE POLICY "Authenticated users can insert author ratings"
  ON public.author_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can update their own author ratings
CREATE POLICY "Users can update own author ratings"
  ON public.author_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 4: Users can delete their own author ratings
CREATE POLICY "Users can delete own author ratings"
  ON public.author_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Fix constraint order to match Supabase upsert expectations
-- ============================================================

-- Note: The upsert constraints in the frontend code now use:
-- book_ratings: onConflict 'user_id,book_id'
-- university_ratings: onConflict 'user_id,university_id'
-- author_ratings: onConflict 'user_id,author_id'

-- These match the UNIQUE constraints defined:
-- UNIQUE(book_id, user_id) - order irrelevant for uniqueness
-- UNIQUE(university_id, user_id) - order irrelevant for uniqueness
-- UNIQUE(user_id, author_name) - order irrelevant for uniqueness
