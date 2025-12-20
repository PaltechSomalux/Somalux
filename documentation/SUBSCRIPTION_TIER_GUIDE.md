# Subscription Tier System Implementation Guide

## Overview
The subscription tier system adds Premium and Premium Pro verification badges to the SomaLux platform, similar to Twitter's verified checkmark. This allows users to unlock enhanced features and administrators to manage user verification status.

## Components Created/Modified

### 1. Database Migration (`/sql/ADD_SUBSCRIPTION_TIER.sql`)
**Purpose**: Adds subscription tier tracking to the database

**New Columns**:
- `subscription_tier` (VARCHAR(50)): Stores tier level (basic, premium, premium_pro)
- `subscription_started_at` (TIMESTAMP): When subscription was activated
- `subscription_expires_at` (TIMESTAMP): When subscription expires (for future renewal logic)

**New Table**:
- `subscription_changes`: Audit log for all subscription tier changes

**Deploy Steps**:
1. Open Supabase Console → SQL Editor
2. Copy contents of `/sql/ADD_SUBSCRIPTION_TIER.sql`
3. Run the migration

### 2. Backend Tier Update Endpoint (`/backend/index.js`)
**Route**: `PATCH /api/elib/users/:id/tier`

**Request Body**:
```json
{
  "subscription_tier": "premium" | "premium_pro" | "basic"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "id": "user-uuid",
    "subscription_tier": "premium",
    "subscription_started_at": "2024-01-15T10:30:00Z",
    "subscription_expires_at": "2025-01-15T10:30:00Z"
  }
}
```

**Features**:
- Automatically sets subscription dates (1-year expiry)
- Clears subscription dates if downgrading to "basic"
- Logs all changes to audit_logs table
- Uses Supabase admin key for authorization

### 3. API Functions (`/src/SomaLux/Books/Admin/api.js`)

**New Functions**:

#### `updateUserTier(userId, tier)`
Updates a user's subscription tier through the backend API.
```javascript
const result = await updateUserTier('user-id', 'premium');
```

#### `fetchAllProfilesForVerify()`
Fetches all profiles with subscription tier information.
```javascript
const profiles = await fetchAllProfilesForVerify();
// Returns: [ { id, email, full_name, subscription_tier, subscription_started_at, subscription_expires_at }, ... ]
```

### 4. Admin Verify Component (`/src/SomaLux/Books/Admin/pages/Verify.jsx`)
**Location**: Admin Dashboard → Verify Tab

**Features**:
- **Search**: Filter users by name or email
- **Tier Filter**: View users by subscription tier (All, Basic, Premium, Premium Pro)
- **Batch Operations**: Update individual user tiers via dropdown
- **Visual Indicators**:
  - Blue checkmark (✓) for Premium users
  - Gold crown (♔) for Premium Pro users
  - Gray star (★) for Basic users
- **Subscription Dates**: Display when subscription started
- **Pagination**: View 10 users per page

**UI Components**:
- Real-time search with icon
- Dropdown selects for tier changes
- Color-coded tier badges
- Pagination controls
- Information box explaining tier levels

### 5. Verification Badge Component (`/src/SomaLux/Books/Admin/components/VerificationBadge.jsx`)
**Purpose**: Reusable component to display verification badges across the app

**Props**:
```javascript
<VerificationBadge 
  tier="premium"              // 'basic' | 'premium' | 'premium_pro'
  size="md"                   // 'sm' | 'md' | 'lg'
  showLabel={false}           // Display tier name
  showTooltip={true}          // Show hover tooltip
/>
```

**Usage Examples**:
```jsx
// In user profile
<VerificationBadge tier={userProfile.subscription_tier} size="md" showLabel={true} />

// In rankings list
<VerificationBadge tier={user.subscription_tier} size="sm" />

// Full badge with label
<VerificationBadge tier="premium_pro" showLabel={true} showTooltip={true} />
```

### 6. Navigation Updates (`/src/SomaLux/Books/Admin/BooksAdmin.jsx`)

**Sidebar Navigation**:
- Added "Verify" link with FiCheck icon after Users link

**Route**: 
```jsx
{isAdmin && (
  <Route path="verify" element={<Verify userProfile={userProfile} />} />
)}
```

**Mobile Bottom Bar**:
- Added "Verify" button for mobile admin access

## Usage Workflow

### For Admin Users

1. **Access Verify Dashboard**:
   - Login as admin
   - Click "Admin" → "Verify" tab

2. **Find User**:
   - Use search box to find by name/email
   - Or filter by current tier

3. **Update Tier**:
   - Click dropdown under "Change Tier To" column
   - Select: Basic, Premium, or Premium Pro
   - System automatically records subscription dates

4. **Track Changes**:
   - All changes logged in audit_logs
   - Available for compliance/reporting

### For Developers

#### Integrate Badge in User Profiles
```jsx
import VerificationBadge from './Admin/components/VerificationBadge';

function UserProfile({ userProfile }) {
  return (
    <div>
      <h2>
        {userProfile.display_name}
        <VerificationBadge 
          tier={userProfile.subscription_tier} 
          size="md" 
        />
      </h2>
    </div>
  );
}
```

#### Integrate Badge in Rankings
```jsx
import VerificationBadge from './Admin/components/VerificationBadge';

function RankingsTable({ users }) {
  return (
    <table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              {user.display_name}
              <VerificationBadge 
                tier={user.subscription_tier} 
                size="sm"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Tier Specifications

### Basic (Default)
- No visible badge
- All standard features
- No special designation

### Premium (Blue ✓)
- Blue checkmark badge
- Enhanced user features (future)
- Priority support (future)
- 1-year subscription

### Premium Pro (Gold ♔)
- Gold crown badge
- All premium features
- Premium analytics dashboard (future)
- Priority support (future)
- 1-year subscription

## Current Status

### ✅ Completed
- Database schema with subscription columns
- Backend tier update endpoint
- Admin Verify component with full UI
- API integration functions
- Navigation integration
- Reusable badge component
- Audit logging

### 🔄 Next Steps
1. Apply ADD_SUBSCRIPTION_TIER.sql migration to Supabase
2. Integrate VerificationBadge into:
   - User profile pages
   - Rankings displays
   - Search results
   - User feeds
3. Create payment integration for tier upgrades
4. Add subscription renewal/expiry logic
5. Create user-facing tier selection UI
6. Add tier-specific features and permissions

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Admin can access Verify tab
- [ ] Can search users by name/email
- [ ] Tier filter works correctly
- [ ] Can update user tier via dropdown
- [ ] Success toast appears on tier update
- [ ] Tier change reflected in database
- [ ] Audit log records change
- [ ] Mobile Verify button works
- [ ] Badges display correctly in profile (after integration)
- [ ] Badges display in rankings (after integration)

## Troubleshooting

### Verify Tab Not Appearing
- Ensure user has admin role (verified in database)
- Check browser cache and hard refresh
- Verify BooksAdmin.jsx imports are correct

### Tier Update Fails
- Check backend is running (port 5000)
- Verify Supabase admin key is set
- Check browser console for error messages
- Verify user UUID exists in database

### Badges Not Showing
- Ensure subscription_tier column exists (check migration)
- Verify tier value is one of: basic, premium, premium_pro
- Check component is importing VerificationBadge correctly

## File Locations

```
/sql/ADD_SUBSCRIPTION_TIER.sql                           # Database migration
/backend/index.js                                         # Tier endpoint (line ~600)
/src/SomaLux/Books/Admin/api.js                          # updateUserTier, fetchAllProfilesForVerify
/src/SomaLux/Books/Admin/pages/Verify.jsx                # Admin dashboard page
/src/SomaLux/Books/Admin/components/VerificationBadge.jsx # Reusable badge component
/src/SomaLux/Books/Admin/BooksAdmin.jsx                  # Navigation updates
```

## Future Enhancements

1. **Payment Integration**:
   - Stripe/M-Pesa for tier purchases
   - Recurring billing

2. **Tier Features**:
   - Premium analytics dashboard
   - Enhanced profile customization
   - Priority support badge

3. **Automatic Expiry**:
   - Scheduled job to downgrade expired tiers
   - Renewal reminders

4. **Tier-Specific Permissions**:
   - Extra upload limits for premium users
   - Analytics access for premium pro
   - Custom branding for premium pro

5. **Display Enhancements**:
   - Tier badge in profile headers
   - Tier indicator in user search results
   - Tier filter in user listings
