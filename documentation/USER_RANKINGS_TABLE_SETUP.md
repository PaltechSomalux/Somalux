# User Rankings Table - Creation Instructions

## Issue
The backend was trying to query `public.user_rankings` table which didn't exist, causing error:
```
PGRST205: Could not find the table 'public.user_rankings' in the schema cache
```

## Solution
Created migration file: `backend/migrations/021_create_user_rankings.sql`

## How to Apply

### Option 1: Via Supabase Dashboard
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the entire content of `backend/migrations/021_create_user_rankings.sql`
3. Paste into SQL editor
4. Click **Run** button
5. Confirm success message

### Option 2: Via psql/CLI
```bash
psql -U postgres -d your_db_name -f backend/migrations/021_create_user_rankings.sql
```

### Option 3: Programmatically
The migration will be applied automatically when the backend migration system runs.

## Table Schema

**Table:** `public.user_rankings`

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id), UNIQUE |
| score | DECIMAL | Total leaderboard score |
| tier | TEXT | Rank tier (bronze, silver, gold, platinum, legend) |
| rank_position | INTEGER | Position in leaderboard (1st, 2nd, etc) |
| reading_score | DECIMAL | Points from reading activity |
| engagement_score | DECIMAL | Points from engagement (likes, comments) |
| contribution_score | DECIMAL | Points from uploads/submissions |
| goals_score | DECIMAL | Points from completed goals |
| achievements_score | DECIMAL | Points from achievements |
| subscription_bonus_applied | BOOLEAN | Whether premium bonus applied |
| created_at | TIMESTAMP | When record created |
| updated_at | TIMESTAMP | When record last updated |

## Indexes Created
- `idx_user_rankings_user_id` - For fast user lookups
- `idx_user_rankings_rank_position` - For leaderboard queries
- `idx_user_rankings_score` - For sorting by score

## Row Level Security (RLS)
- **Public:** Anyone can view rankings (read-only)
- **Admin:** Full access (insert, update, delete)
- **Users:** Cannot modify rankings directly

## After Application
1. Email server is configured ✅
2. User rankings table is created ✅
3. Run `/api/admin/user-rankings/recompute` endpoint to populate rankings

## Verification
To verify the table was created:
```sql
SELECT * FROM public.user_rankings LIMIT 5;
```

Should return 0 rows (empty table) initially, then populate after recompute endpoint is called.
