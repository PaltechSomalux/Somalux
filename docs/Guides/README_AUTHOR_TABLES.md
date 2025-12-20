# Author Tables Migration

## Overview
This migration adds real-time support for author interactions including:
- Follows
- Likes
- Loves
- Ratings (minimum rating: 1)

## Tables Created

### 1. `author_follows`
Tracks which users follow which authors.
- `follower_id`: References auth.users
- `author_name`: Author's name (from books table)
- Unique constraint on (follower_id, author_name)

### 2. `author_likes`
Tracks author likes from users.
- `user_id`: References auth.users
- `author_name`: Author's name
- Unique constraint on (user_id, author_name)

### 3. `author_loves`
Tracks author loves from users.
- `user_id`: References auth.users
- `author_name`: Author's name
- Unique constraint on (user_id, author_name)

### 4. `author_ratings`
Tracks author ratings from users.
- `user_id`: References auth.users
- `author_name`: Author's name
- `rating`: Integer between 1 and 5 (minimum is 1)
- Unique constraint on (user_id, author_name)

### 5. `author_stats` (Materialized View)
Aggregated statistics for each author:
- `author_name`: Author's name
- `books_count`: Number of books
- `average_rating`: Average rating (0 if no ratings)
- `rating_count`: Total number of ratings
- `likes_count`: Total likes
- `loves_count`: Total loves
- `followers_count`: Total followers

## Real-time Updates

The migration sets up triggers that automatically refresh the `author_stats` materialized view whenever:
- A rating is added/updated/deleted
- A like is added/deleted
- A love is added/deleted
- A follow is added/deleted

## Running the Migration

### Using Supabase CLI
```bash
supabase db push
```

### Using SQL Editor in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20251118_create_author_tables.sql`
4. Click "Run"

### Using psql
```bash
psql -h your-db-host -U postgres -d your-database -f backend/migrations/20251118_create_author_tables.sql
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- **SELECT**: Everyone can view all records
- **INSERT**: Users can only insert their own interactions
- **UPDATE**: Users can only update their own ratings
- **DELETE**: Users can only delete their own interactions

## Indexes

Performance indexes are created on:
- `follower_id` and `author_name` for follows
- `user_id` and `author_name` for likes, loves, and ratings

## Features

### Real-time Updates
The Authors page now subscribes to real-time changes on all interaction tables. When any user:
- Follows/unfollows an author
- Likes/unlikes an author
- Loves/unloves an author
- Rates/updates rating for an author

All connected users will see the updated counts immediately.

### Rating Constraints
- Minimum rating: 1 star
- Maximum rating: 5 stars
- Users can update their rating at any time
- Average rating is calculated automatically

## Testing

After running the migration, test the following:
1. Follow an author - check if follower count updates
2. Like an author - check if like count updates
3. Love an author - check if love count updates
4. Rate an author (try rating 1-5) - check if average rating updates
5. Open the page in two different browsers/tabs and verify real-time updates work

## Rollback

If you need to rollback this migration:
```sql
DROP MATERIALIZED VIEW IF EXISTS public.author_stats CASCADE;
DROP TABLE IF EXISTS public.author_ratings CASCADE;
DROP TABLE IF EXISTS public.author_loves CASCADE;
DROP TABLE IF EXISTS public.author_likes CASCADE;
DROP TABLE IF EXISTS public.author_follows CASCADE;
DROP FUNCTION IF EXISTS refresh_author_stats() CASCADE;
```