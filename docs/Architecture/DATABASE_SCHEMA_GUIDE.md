# Database Schema - What Gets Created

## 📊 6 Tables

### 1. **ads** (Main table - stores ad details)
```
┌─────────────────────────────────┐
│           ads TABLE             │
├─────────────────────────────────┤
│ id                    (UUID)     │ ← Primary Key
│ title                 (Text)     │ ← Ad name
│ image_url             (Text)     │ ← Image URL/path
│ click_url             (Text)     │ ← Redirect URL
│ placement             (Text)     │ ← homepage, sidebar, etc
│ start_date            (Date)     │ ← When to start
│ end_date              (Date)     │ ← When to end
│ countdown_seconds     (Number)   │ ← Timer duration
│ is_skippable          (Bool)     │ ← Can user close?
│ is_active             (Bool)     │ ← Show it?
│ total_impressions     (Number)   │ ← Total views
│ total_clicks          (Number)   │ ← Total clicks
│ total_dismisses       (Number)   │ ← Total closes
│ created_at            (Date)     │ ← Created when
│ updated_at            (Date)     │ ← Last updated
└─────────────────────────────────┘
```

### 2. **ad_analytics** (Event log - every interaction)
```
┌──────────────────────────────────┐
│     ad_analytics TABLE           │
├──────────────────────────────────┤
│ id                   (UUID)      │ ← Record ID
│ ad_id                (UUID FK)   │ ← Which ad?
│ user_id              (Text)      │ ← Who viewed?
│ placement            (Text)      │ ← Where shown?
│ event_type           (Text)      │ ← impression/click/dismiss
│ view_duration        (Number)    │ ← Seconds watched
│ device_type          (Text)      │ ← mobile/tablet/desktop
│ user_agent           (Text)      │ ← Browser info
│ geo_country          (Text)      │ ← Country
│ geo_region           (Text)      │ ← Region
│ created_at           (Date)      │ ← When happened
└──────────────────────────────────┘
```

### 3. **ad_engagement_metrics** (Daily summary)
```
┌──────────────────────────────────┐
│   ad_engagement_metrics TABLE    │
├──────────────────────────────────┤
│ id                   (UUID)      │
│ ad_id                (UUID FK)   │
│ placement            (Text)      │
│ date_recorded        (Date)      │ ← Per day
│ impressions          (Number)    │ ← Views per day
│ clicks               (Number)    │ ← Clicks per day
│ dismisses            (Number)    │ ← Closes per day
│ avg_view_duration    (Decimal)   │ ← Avg seconds
│ completion_rate      (Decimal)   │ ← % watched full
│ click_through_rate   (Decimal)   │ ← CTR %
│ mobile/tablet/desk...            │ ← Device breakdown
└──────────────────────────────────┘
```

### 4. **ad_performance_summary** (Overall stats)
```
┌──────────────────────────────────┐
│   ad_performance_summary TABLE   │
├──────────────────────────────────┤
│ id                   (UUID)      │
│ ad_id                (UUID FK)   │
│ total_impressions    (Number)    │ ← All time views
│ total_clicks         (Number)    │ ← All time clicks
│ overall_ctr          (Decimal)   │ ← CTR %
│ reach_percentage     (Decimal)   │ ← Reach %
│ mobile/tablet/desk_clicks        │ ← Device clicks
│ status               (Text)      │ ← performing/new
│ last_updated         (Date)      │
└──────────────────────────────────┘
```

### 5. **ad_dismissals** (Why users closed)
```
┌──────────────────────────────────┐
│      ad_dismissals TABLE         │
├──────────────────────────────────┤
│ id                   (UUID)      │
│ ad_id                (UUID FK)   │
│ user_id              (Text)      │
│ placement            (Text)      │
│ view_duration        (Number)    │ ← How long before close
│ device_type          (Text)      │ ← What device
│ dismissal_time       (Date)      │
└──────────────────────────────────┘
```

### 6. **ad_engagement_metrics** (For future use)
Already included in migration for advanced analytics.

---

## 🔗 Relationships (Foreign Keys)

```
ads (main table)
  ↓
  ├─→ ad_analytics (many events per ad)
  ├─→ ad_engagement_metrics (daily summary per ad)
  ├─→ ad_performance_summary (overall stats per ad)
  └─→ ad_dismissals (dismissal details per ad)
```

When you delete an ad, all related records auto-delete (CASCADE).

---

## 📈 Data Flow Example

### When user views an ad:

```
1. Ad displays on page
   ↓
2. System creates record in ad_analytics
   event_type = 'impression'
   view_duration = 0
   device_type = 'mobile'
   ↓
3. View timer starts (counts seconds)
   ↓
4. User clicks X button (or countdown ends)
   ↓
5. System updates ad_analytics record
   event_type = 'dismiss'
   view_duration = 7 (seconds)
   ↓
6. Creates record in ad_dismissals
   ↓
7. Daily summary in ad_engagement_metrics updates
   dismisses = 1
   total_view_duration += 7
   ↓
8. Overall summary in ad_performance_summary updates
```

---

## 🎯 What Each Table Is Used For

| Table | Purpose | Used By |
|-------|---------|---------|
| **ads** | Store ad config | Admin dashboard, display code |
| **ad_analytics** | Log every event | Backend API, analytics |
| **ad_engagement_metrics** | Daily summaries | Analytics dashboard |
| **ad_performance_summary** | Overall metrics | Analytics dashboard |
| **ad_dismissals** | Dismissal tracking | Analytics, research |

---

## 📊 Indexes Created

Indexes speed up queries by 100x+:

```
- idx_ads_placement_active
  → Speed up finding active ads by placement

- idx_ad_analytics_ad_id
  → Speed up finding events for an ad

- idx_ad_analytics_event_type
  → Speed up filtering by event type (click/dismiss)

- idx_ad_analytics_date
  → Speed up date range queries

- idx_ad_analytics_device
  → Speed up device type filtering

- idx_engagement_metrics_date
  → Speed up daily data queries

- idx_dismissals_ad_id
  → Speed up dismissal lookup
```

---

## 💾 Storage & Limits

**Current setup handles:**
- ✅ 1000+ ads
- ✅ 1 million+ events
- ✅ Unlimited daily summaries
- ✅ Real-time analytics

**If you need more:** Contact Supabase for upgrade

---

## 🔒 Security

All tables have:
- ✅ UUIDs (not sequential IDs)
- ✅ Foreign key constraints
- ✅ Cascade delete (prevent orphaned records)
- ✅ Timestamp tracking
- ✅ Type validation

---

## 📝 Column Types Explained

| Type | Example | Use |
|------|---------|-----|
| **UUID** | 550e8400-e29b-41d4-a716-446655440000 | Unique ID |
| **VARCHAR** | "Homepage Banner" | Text with limit |
| **TEXT** | Long text | Unlimited text |
| **INTEGER** | 123 | Whole numbers |
| **DECIMAL** | 12.34 | Decimals (accurate) |
| **BOOLEAN** | true/false | Yes/No |
| **TIMESTAMP** | 2025-12-06 15:30:00 | Date & time |
| **DATE** | 2025-12-06 | Just date |

---

## ✨ You're Ready!

Copy the complete SQL and run it in Supabase. All 6 tables will be created with:
- ✅ Proper relationships
- ✅ Performance indexes
- ✅ Type safety
- ✅ Cascade deletes
- ✅ Default values

Next: Create your first ad! 🚀
