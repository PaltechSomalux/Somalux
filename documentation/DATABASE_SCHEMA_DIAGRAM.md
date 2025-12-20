# 📊 Database Schema Relationship Diagram

Visual guide to all 23 tables and their relationships.

```
╔════════════════════════════════════════════════════════════════════════════════════╗
║                          SOMALUX DATABASE ARCHITECTURE                            ║
║                            23 Tables | 50+ Functions                              ║
╚════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION & USER MANAGEMENT                                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  📋 profiles
│  ├─ id (UUID) PRIMARY KEY → auth.users
│  ├─ email UNIQUE
│  ├─ username UNIQUE  
│  ├─ full_name
│  ├─ role (user|moderator|admin|super_admin)
│  ├─ tier (free|standard|premium|enterprise)
│  ├─ avatar_url
│  ├─ is_verified BOOLEAN
│  └─ timestamps (created_at, updated_at, last_login)
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  LIBRARY & CONTENT MANAGEMENT                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  📚 categories
│  ├─ id (UUID) PRIMARY KEY
│  ├─ name UNIQUE
│  ├─ description
│  ├─ color
│  └─ slug
│    │
│    ├──→ books (category_id FK)
│    │    ├─ id (UUID) PRIMARY KEY
│    │    ├─ title
│    │    ├─ author
│    │    ├─ cover_url
│    │    ├─ file_url
│    │    ├─ downloads INT
│    │    ├─ views INT
│    │    ├─ average_rating DECIMAL(3,2)
│    │    ├─ rating_count INT
│    │    ├─ is_featured BOOLEAN
│    │    ├─ status (draft|pending|published|archived)
│    │    ├─ submitted_by UUID FK → profiles
│    │    └─ timestamps
│    │         │
│    │         ├──→ book_views
│    │         │    ├─ id (UUID) PRIMARY KEY
│    │         │    ├─ user_id UUID FK → profiles
│    │         │    ├─ book_id UUID FK → books
│    │         │    └─ viewed_at TIMESTAMP
│    │         │
│    │         ├──→ book_likes
│    │         │    ├─ id (UUID) PRIMARY KEY
│    │         │    ├─ user_id UUID FK → profiles
│    │         │    ├─ book_id UUID FK → books
│    │         │    └─ created_at TIMESTAMP
│    │         │         UNIQUE(user_id, book_id)
│    │         │
│    │         ├──→ book_ratings
│    │         │    ├─ id (UUID) PRIMARY KEY
│    │         │    ├─ user_id UUID FK → profiles
│    │         │    ├─ book_id UUID FK → books
│    │         │    ├─ rating INT (1-5)
│    │         │    ├─ review TEXT
│    │         │    ├─ helpful_count INT
│    │         │    └─ timestamps
│    │         │         UNIQUE(user_id, book_id)
│    │         │
│    │         └──→ book_comments
│    │              ├─ id (UUID) PRIMARY KEY
│    │              ├─ user_id UUID FK → profiles
│    │              ├─ book_id UUID FK → books
│    │              ├─ parent_comment_id UUID FK → book_comments
│    │              ├─ content TEXT
│    │              ├─ likes_count INT
│    │              └─ timestamps
│    │
│    └──→ reading_sessions
│         ├─ id (UUID) PRIMARY KEY
│         ├─ user_id UUID FK → profiles
│         ├─ book_id UUID FK → books
│         ├─ started_at TIMESTAMP
│         ├─ ended_at TIMESTAMP
│         ├─ pages_read INT
│         ├─ progress_percent DECIMAL(5,2)
│         ├─ duration_minutes INT
│         └─ timestamps
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  READING ANALYTICS & ACHIEVEMENTS                                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  👤 profiles
│   │
│   ├──→ user_reading_stats
│   │    ├─ id (UUID) PRIMARY KEY
│   │    ├─ user_id UUID UNIQUE FK → profiles
│   │    ├─ total_books_completed INT
│   │    ├─ total_pages_read INT
│   │    ├─ genres_explored INT
│   │    ├─ most_read_category_id UUID FK → categories
│   │    └─ timestamps
│   │
│   ├──→ reading_goals
│   │    ├─ id (UUID) PRIMARY KEY
│   │    ├─ user_id UUID FK → profiles
│   │    ├─ goal_type (pages|books|minutes|streak)
│   │    ├─ target_value INT
│   │    ├─ current_value INT
│   │    ├─ period (daily|weekly|monthly|yearly)
│   │    ├─ start_date TIMESTAMP
│   │    ├─ end_date TIMESTAMP
│   │    ├─ status (active|completed|abandoned)
│   │    └─ timestamps
│   │
│   ├──→ reading_streaks
│   │    ├─ id (UUID) PRIMARY KEY
│   │    ├─ user_id UUID UNIQUE FK → profiles
│   │    ├─ current_streak INT
│   │    ├─ longest_streak INT
│   │    ├─ last_read_date DATE
│   │    └─ timestamps
│   │
│   └──→ user_achievements
│        ├─ id (UUID) PRIMARY KEY
│        ├─ user_id UUID FK → profiles
│        ├─ achievement_type TEXT
│        ├─ title TEXT
│        ├─ description TEXT
│        ├─ icon_url TEXT
│        ├─ earned_at TIMESTAMP
│        └─ created_at TIMESTAMP
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  UNIVERSITIES & PAST PAPERS                                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  🏫 universities
│  ├─ id (UUID) PRIMARY KEY
│  ├─ name UNIQUE
│  ├─ description
│  ├─ location
│  ├─ country
│  ├─ website_url
│  ├─ logo_url
│  └─ timestamps
│    │
│    ├──→ user_universities
│    │    ├─ id (UUID) PRIMARY KEY
│    │    ├─ user_id UUID FK → profiles
│    │    ├─ university_id UUID FK → universities
│    │    ├─ enrollment_date DATE
│    │    ├─ graduation_date DATE
│    │    ├─ degree TEXT
│    │    ├─ field_of_study TEXT
│    │    ├─ is_current BOOLEAN
│    │    ├─ created_at TIMESTAMP
│    │    └─ UNIQUE(user_id, university_id)
│    │
│    └──→ past_papers
│         ├─ id (UUID) PRIMARY KEY
│         ├─ title TEXT
│         ├─ subject TEXT
│         ├─ university_id UUID FK → universities
│         ├─ course_code TEXT
│         ├─ exam_year INT
│         ├─ exam_month TEXT
│         ├─ file_url TEXT
│         ├─ downloads INT
│         ├─ views INT
│         ├─ average_rating DECIMAL(3,2)
│         ├─ rating_count INT
│         ├─ status (published|pending|archived)
│         ├─ submitted_by UUID FK → profiles
│         ├─ is_featured BOOLEAN
│         └─ timestamps
│              │
│              └──→ past_paper_views
│                   ├─ id (UUID) PRIMARY KEY
│                   ├─ user_id UUID FK → profiles
│                   ├─ past_paper_id UUID FK → past_papers
│                   └─ viewed_at TIMESTAMP
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SUBMISSIONS & MODERATION                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  📤 book_submissions
│  ├─ id (UUID) PRIMARY KEY
│  ├─ user_id UUID FK → profiles
│  ├─ title TEXT
│  ├─ author TEXT
│  ├─ category_id UUID FK → categories
│  ├─ file_url TEXT
│  ├─ status (pending|approved|rejected)
│  ├─ rejection_reason TEXT
│  ├─ reviewed_by UUID FK → profiles
│  ├─ reviewed_at TIMESTAMP
│  └─ timestamps
│
│  📤 past_paper_submissions
│  ├─ id (UUID) PRIMARY KEY
│  ├─ user_id UUID FK → profiles
│  ├─ title TEXT
│  ├─ subject TEXT
│  ├─ university_id UUID FK → universities
│  ├─ file_url TEXT
│  ├─ status (pending|approved|rejected)
│  ├─ rejection_reason TEXT
│  ├─ reviewed_by UUID FK → profiles
│  ├─ reviewed_at TIMESTAMP
│  └─ timestamps
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ADVERTISING SYSTEM                                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  📢 ads
│  ├─ id (UUID) PRIMARY KEY
│  ├─ title TEXT
│  ├─ description TEXT
│  ├─ image_url TEXT
│  ├─ advertiser_id UUID FK → profiles
│  ├─ target_url TEXT
│  ├─ placement (header|sidebar|footer|modal|banner)
│  ├─ start_date TIMESTAMP
│  ├─ end_date TIMESTAMP
│  ├─ is_active BOOLEAN
│  ├─ impressions INT
│  ├─ clicks INT
│  ├─ budget DECIMAL(10,2)
│  ├─ cost_per_click DECIMAL(10,4)
│  ├─ status (pending|approved|rejected|paused|expired)
│  ├─ reviewed_by UUID FK → profiles
│  ├─ review_notes TEXT
│  └─ timestamps
│    │
│    ├──→ ad_clicks
│    │    ├─ id (UUID) PRIMARY KEY
│    │    ├─ ad_id UUID FK → ads
│    │    ├─ user_id UUID FK → profiles
│    │    ├─ clicked_at TIMESTAMP
│    │    ├─ ip_address TEXT
│    │    └─ user_agent TEXT
│    │
│    └──→ ad_impressions
│         ├─ id (UUID) PRIMARY KEY
│         ├─ ad_id UUID FK → ads
│         ├─ user_id UUID FK → profiles
│         ├─ viewed_at TIMESTAMP
│         ├─ ip_address TEXT
│         └─ user_agent TEXT
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  BILLING & SUBSCRIPTIONS                                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  👤 profiles
│   │
│   ├──→ subscriptions
│   │    ├─ id (UUID) PRIMARY KEY
│   │    ├─ user_id UUID FK → profiles
│   │    ├─ plan_name TEXT
│   │    ├─ status (active|cancelled|expired|pending)
│   │    ├─ start_date TIMESTAMP
│   │    ├─ end_date TIMESTAMP
│   │    ├─ renewal_date TIMESTAMP
│   │    ├─ price DECIMAL(10,2)
│   │    ├─ currency TEXT
│   │    ├─ auto_renew BOOLEAN
│   │    └─ timestamps
│   │
│   └──→ payments
│        ├─ id (UUID) PRIMARY KEY
│        ├─ user_id UUID FK → profiles
│        ├─ subscription_id UUID FK → subscriptions
│        ├─ amount DECIMAL(10,2)
│        ├─ currency TEXT
│        ├─ payment_method TEXT
│        ├─ provider TEXT
│        ├─ provider_reference_id TEXT UNIQUE
│        ├─ status (pending|completed|failed|refunded)
│        └─ timestamps
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RANKINGS & ANALYTICS                                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  👤 profiles
│   │
│   └──→ user_rankings
│        ├─ id (UUID) PRIMARY KEY
│        ├─ user_id UUID UNIQUE FK → profiles
│        ├─ rank INT
│        ├─ total_score DECIMAL(15,2)
│        ├─ books_read INT
│        ├─ past_papers_viewed INT
│        ├─ reading_minutes INT
│        ├─ comments_count INT
│        ├─ likes_received INT
│        ├─ achievements_count INT
│        └─ updated_at TIMESTAMP
│
│  author_stats (No FK - computed from books table)
│  ├─ id (UUID) PRIMARY KEY
│  ├─ author_name TEXT UNIQUE
│  ├─ books_count INT
│  ├─ average_rating DECIMAL(3,2)
│  ├─ rating_count INT
│  ├─ likes_count INT
│  ├─ loves_count INT
│  ├─ followers_count INT
│  ├─ total_downloads INT
│  └─ total_views INT
│
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  AUDITING & ADMINISTRATION                                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│
│  📝 search_events
│  ├─ id (UUID) PRIMARY KEY
│  ├─ scope TEXT
│  ├─ query_text TEXT
│  ├─ user_id UUID FK → profiles
│  ├─ category_id UUID FK → categories
│  ├─ book_id UUID FK → books
│  ├─ author_name TEXT
│  ├─ past_paper_id UUID FK → past_papers
│  ├─ results_count INT
│  └─ created_at TIMESTAMP
│
│  🔍 audit_logs
│  ├─ id (UUID) PRIMARY KEY
│  ├─ actor UUID FK → profiles
│  ├─ action TEXT
│  ├─ entity TEXT
│  ├─ record_id UUID
│  ├─ details JSONB
│  ├─ ip TEXT
│  ├─ user_agent TEXT
│  └─ created_at TIMESTAMP
│
│  📊 system_logs
│  ├─ id (UUID) PRIMARY KEY
│  ├─ log_level (info|warning|error|debug)
│  ├─ component TEXT
│  ├─ message TEXT
│  ├─ details JSONB
│  └─ created_at TIMESTAMP
│
│  🔔 notifications
│  ├─ id (UUID) PRIMARY KEY
│  ├─ user_id UUID FK → profiles
│  ├─ title TEXT
│  ├─ message TEXT
│  ├─ notification_type TEXT
│  ├─ related_id UUID
│  ├─ is_read BOOLEAN
│  ├─ read_at TIMESTAMP
│  └─ created_at TIMESTAMP
│
│  ⚙️  admin_settings
│  ├─ id (UUID) PRIMARY KEY
│  ├─ setting_key TEXT UNIQUE
│  ├─ setting_value JSONB
│  ├─ description TEXT
│  ├─ updated_by UUID FK → profiles
│  └─ timestamps
│
└─────────────────────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════════════════════╗
║                            KEY STATISTICS                                         ║
├════════════════════════════════════════════════════════════════════════════════════╤
║  Tables: 23                                                                        │
║  Indexes: 50+                                                                      │
║  Functions: 50+                                                                    │
║  Triggers: 20+                                                                     │
║  RLS Policies: 10+                                                                 │
║  Foreign Key Relationships: 30+                                                    │
║  Unique Constraints: 10+                                                           │
║  Check Constraints: 20+                                                            │
╚════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔗 Relationship Summary

### One-to-Many Relationships
- `categories` → `books` (1 category has many books)
- `categories` → `reading_goals` (implied through user goals)
- `universities` → `user_universities` (1 university, many users)
- `universities` → `past_papers` (1 university, many papers)
- `profiles` → `reading_sessions` (1 user, many sessions)
- `profiles` → `book_ratings` (1 user, many ratings)
- `profiles` → `book_comments` (1 user, many comments)
- `profiles` → `book_submissions` (1 user, many submissions)
- `profiles` → `subscriptions` (1 user, many subscriptions)
- `profiles` → `notifications` (1 user, many notifications)
- `ads` → `ad_clicks` (1 ad, many clicks)
- `ads` → `ad_impressions` (1 ad, many impressions)
- `books` → `reading_sessions` (1 book, many sessions)

### Many-to-Many Relationships
- `profiles` ↔ `books` (through `book_likes`, `book_ratings`, `book_comments`, `book_views`)
- `profiles` ↔ `universities` (through `user_universities`)
- `profiles` ↔ `past_papers` (through `past_paper_views`)

### Self-Referencing Relationships
- `book_comments` → `book_comments` (nested comments)

### Implicit Relationships
- `book_ratings` → triggers → `books.average_rating`
- `reading_sessions` → triggers → `user_reading_stats`
- `book_likes` → triggers → `books.likes_count`

---

## 📐 Data Flow

```
USER SIGNUP
    ↓
profile created
    ↓
┌─────────────────────────────────┐
│ USER CAN NOW:                   │
├─────────────────────────────────┤
│ • Browse books & categories     │
│ • View past papers              │
│ • Search content                │
│ • Like books                    │
│ • Rate & review books           │
│ • Comment on books              │
│ • Start reading sessions        │
│ • Set reading goals             │
│ • Subscribe to premium tier     │
│ • Submit books/papers           │
│ • View ads                      │
└─────────────────────────────────┘
    ↓
DATA AUTOMATICALLY AGGREGATED
    ↓
┌─────────────────────────────────┐
│ STATISTICS UPDATED:             │
├─────────────────────────────────┤
│ • user_reading_stats            │
│ • reading_streaks               │
│ • user_achievements             │
│ • book ratings & downloads      │
│ • search_events analytics       │
│ • user_rankings (leaderboard)   │
│ • audit_logs (actions tracked)  │
└─────────────────────────────────┘
```

---

## 🔒 Row Level Security (RLS) Policies

| Table | Policy | Condition |
|-------|--------|-----------|
| `profiles` | SELECT | true (public read) |
| `profiles` | UPDATE | auth.uid() = id |
| `books` | SELECT | status = 'published' OR auth.uid() = submitted_by |
| `reading_sessions` | SELECT | auth.uid() = user_id |
| `reading_sessions` | INSERT | auth.uid() = user_id |
| `ads` | SELECT | is_active = true AND NOW() BETWEEN start_date AND end_date |
| `subscriptions` | SELECT | auth.uid() = user_id |
| `notifications` | SELECT | auth.uid() = user_id |

---

**Schema Last Updated**: December 10, 2025  
**Status**: ✅ Complete and Ready for Deployment
