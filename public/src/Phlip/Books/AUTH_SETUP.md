# Authentication & Realtime Setup Guide

## Overview
Your BookPanel now requires Google authentication for:
- Liking books
- Downloading books
- Commenting on books
- Viewing book details (increments view count)

All actions sync in realtime across all users via Supabase Realtime.

---

## Step 1: Run Database Migrations

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `supabase-migrations.sql`
5. Paste and click **Run**

This creates:
- `book_likes` table (stores user likes with realtime enabled)
- `book_comments` table (stores comments with realtime enabled)
- Row Level Security (RLS) policies
- Indexes for performance
- Realtime publication configuration

---

## Step 2: Enable Google OAuth

### A. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Choose **Web application**
7. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - Your production domain
8. Add **Authorized redirect URIs**:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Example: `https://hoegjepmtegvgnnaohdr.supabase.co/auth/v1/callback`
9. Save and copy your **Client ID** and **Client Secret**

### B. Configure Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and enable it
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **Save**

### C. Add Redirect URLs (if needed)

1. Go to **Authentication** > **URL Configuration**
2. Add your site URLs to **Redirect URLs**:
   - `http://localhost:3000` (development)
   - Your production domain

---

## Step 3: Verify Realtime is Enabled

1. Go to **Database** > **Replication**
2. Ensure the following tables are enabled:
   - ✅ `books`
   - ✅ `book_likes`
   - ✅ `book_comments`
3. If not, toggle them on

---

## Step 4: Test the Integration

### Test Authentication:
1. Open your app at `http://localhost:3000`
2. Try to like a book → Auth modal should appear
3. Click "Continue with Google"
4. Complete OAuth flow
5. You should be redirected back and signed in

### Test Realtime:
1. Open your app in two browser windows
2. Sign in on both
3. Like a book in window 1
4. The like count should update in window 2 immediately
5. Add a comment in window 1
6. The comment should appear in window 2 immediately

---

## How It Works

### Authentication Flow:
```
User clicks Like/Download/Comment
  ↓
Check if authenticated
  ↓
If NO → Show AuthModal
  ↓
User signs in with Google
  ↓
Supabase OAuth redirects back
  ↓
User is authenticated
  ↓
Action proceeds
```

### Realtime Sync:
```
User A likes book X
  ↓
Insert into book_likes table
  ↓
Supabase Realtime broadcasts change
  ↓
All connected clients receive update
  ↓
Like count increments for User B, C, D...
```

---

## Features Implemented

✅ **Google Sign-In Modal** - Beautiful, modern auth UI
✅ **Auth Gating** - All protected actions require sign-in
✅ **Realtime Likes** - Like counts sync instantly
✅ **Realtime Comments** - Comments appear immediately for all users
✅ **Realtime Downloads** - Download counts update live
✅ **View Tracking** - Opens/views increment automatically
✅ **User-Specific State** - Users see their own likes highlighted
✅ **RLS Security** - Users can only delete their own comments/likes
✅ **Optimistic Updates** - UI updates instantly before server confirms

---

## Troubleshooting

### "Invalid login credentials" error
- Check that Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct
- Ensure redirect URLs match exactly

### Likes/comments not syncing in realtime
- Check Realtime is enabled for tables in Database > Replication
- Check browser console for WebSocket errors
- Verify RLS policies allow SELECT for public

### "relation book_likes does not exist"
- Run the migration SQL script in Supabase SQL Editor
- Refresh your database schema

### Users can't delete comments
- Ensure they're signed in
- Check RLS policies allow DELETE where user_id matches
- Check auth.uid() returns correct user

---

## Database Schema

### book_likes
```sql
- id (uuid, primary key)
- book_id (uuid, foreign key → books.id)
- user_id (uuid, foreign key → auth.users.id)
- created_at (timestamp)
- UNIQUE constraint on (book_id, user_id)
```

### book_comments
```sql
- id (uuid, primary key)
- book_id (uuid, foreign key → books.id)
- user_id (uuid, foreign key → auth.users.id)
- user_email (text)
- text (text)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Anonymous users can read likes/comments
- Only authenticated users can write
- Users can only delete their own content
- Google OAuth tokens are managed by Supabase
- No passwords stored in your database

---

## Need Help?

1. Check Supabase logs: Dashboard > Logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test OAuth flow in incognito mode

---

🎉 **Setup Complete!** Your book panel now has full authentication and realtime features.
