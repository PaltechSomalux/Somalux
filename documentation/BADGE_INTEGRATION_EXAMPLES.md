# Quick Integration Examples - VerificationBadge Component

## 📝 Basic Usage

### Import
```jsx
import VerificationBadge from './Admin/components/VerificationBadge';
```

---

## 🎨 Usage Examples

### 1. User Profile Header
```jsx
function UserProfile({ user }) {
  return (
    <div className="profile-header">
      <h1>
        {user.display_name}
        <VerificationBadge 
          tier={user.subscription_tier}
          size="md"
          showLabel={false}
          showTooltip={true}
        />
      </h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Result**: Shows user name with small badge icon

---

### 2. Rankings Table
```jsx
function RankingsTable({ users }) {
  return (
    <table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td className="rank">{user.rank}</td>
            <td className="user">
              <img src={user.avatar_url} alt={user.display_name} />
              <span>{user.display_name}</span>
              <VerificationBadge 
                tier={user.subscription_tier}
                size="sm"
              />
            </td>
            <td className="score">{user.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Result**: Shows rank, user, score with verification badge

---

### 3. User Search Results
```jsx
function UserSearchResult({ user }) {
  return (
    <div className="search-result-card">
      <div className="card-header">
        <h3>
          {user.display_name}
          <VerificationBadge 
            tier={user.subscription_tier}
            size="md"
            showLabel={true}
            showTooltip={true}
          />
        </h3>
        <p className="subtitle">{user.email}</p>
      </div>
      <div className="card-body">
        <p>{user.bio}</p>
      </div>
    </div>
  );
}
```

**Result**: Shows user card with name, tier label, and tooltip

---

### 4. Admin Users Table
```jsx
function AdminUsersTable({ users }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Tier</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              <strong>{user.display_name}</strong>
              <VerificationBadge 
                tier={user.subscription_tier}
                size="sm"
              />
            </td>
            <td>{user.email}</td>
            <td>
              <span className="tier-label">
                {user.subscription_tier}
              </span>
            </td>
            <td>{user.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Result**: Shows user table with inline verification badges

---

### 5. User Comment/Post Card
```jsx
function CommentCard({ comment, author }) {
  return (
    <div className="comment-card">
      <div className="author-info">
        <img src={author.avatar_url} alt={author.display_name} />
        <div className="author-name">
          <strong>
            {author.display_name}
            <VerificationBadge 
              tier={author.subscription_tier}
              size="sm"
            />
          </strong>
          <time>{new Date(comment.created_at).toLocaleDateString()}</time>
        </div>
      </div>
      <div className="comment-text">
        {comment.text}
      </div>
    </div>
  );
}
```

**Result**: Shows comment author with verification badge

---

### 6. User Card with Full Label
```jsx
function UserCard({ user }) {
  return (
    <div className="user-card">
      <div className="user-avatar">
        <img src={user.avatar_url} alt={user.display_name} />
      </div>
      <div className="user-info">
        <div className="name-row">
          <h3>{user.display_name}</h3>
          <VerificationBadge 
            tier={user.subscription_tier}
            size="md"
            showLabel={true}
            showTooltip={true}
          />
        </div>
        <p className="email">{user.email}</p>
        <p className="bio">{user.bio}</p>
      </div>
    </div>
  );
}
```

**Result**: Shows full user card with large badge and label

---

### 7. Notifications/Mentions
```jsx
function Notification({ user, message }) {
  return (
    <div className="notification">
      <VerificationBadge 
        tier={user.subscription_tier}
        size="sm"
      />
      <span>
        <strong>{user.display_name}</strong> {message}
      </span>
      <time>{formatTime(Date.now())}</time>
    </div>
  );
}
```

**Result**: Shows notification with sender's verification badge

---

## 🎛️ Props Reference

### Props
```typescript
interface VerificationBadgeProps {
  tier?: 'basic' | 'premium' | 'premium_pro';  // Default: 'basic'
  size?: 'sm' | 'md' | 'lg';                    // Default: 'md'
  showLabel?: boolean;                          // Default: false
  showTooltip?: boolean;                        // Default: true
}
```

### Size Specifications
- **sm** (Small): 12px icon, 10px font - for compact displays
- **md** (Medium): 14px icon, 11px font - for standard displays
- **lg** (Large): 16px icon, 12px font - for prominent displays

### Tier Behavior
- **basic**: No badge shown unless showLabel=true
- **premium**: Blue checkmark badge shown
- **premium_pro**: Gold crown badge shown

---

## 🎨 Styling Tips

### CSS Classes (if needed)
```css
/* No className on badge, but you can wrap it */
.user-with-badge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-with-badge .badge {
  flex-shrink: 0;
}
```

### Inline Styling Pattern
```jsx
<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
  {user.display_name}
  <VerificationBadge tier={user.subscription_tier} size="sm" />
</span>
```

---

## 🔄 Conditional Display

### Only Show for Premium
```jsx
{(user.subscription_tier === 'premium' || user.subscription_tier === 'premium_pro') && (
  <VerificationBadge tier={user.subscription_tier} showLabel={true} />
)}
```

### Show All Tiers with Label
```jsx
<VerificationBadge 
  tier={user.subscription_tier} 
  showLabel={true}
  showTooltip={true}
/>
```

### Hide Tooltips on Mobile
```jsx
const isMobile = window.innerWidth < 768;
<VerificationBadge 
  tier={user.subscription_tier}
  showTooltip={!isMobile}
/>
```

---

## 📊 Integration Checklist

Use this checklist when integrating VerificationBadge into new components:

- [ ] Import VerificationBadge component
- [ ] Get user's subscription_tier (from props or data)
- [ ] Add VerificationBadge JSX next to user name
- [ ] Choose appropriate size (sm/md/lg)
- [ ] Set showLabel based on available space
- [ ] Test badge displays correctly
- [ ] Test badge on mobile
- [ ] Verify tier colors are visible in dark mode
- [ ] Check spacing around badge looks good

---

## 🚀 Performance Notes

- Component is lightweight (no API calls)
- Memoization built-in
- No re-renders unless tier changes
- Safe to render many badges (100+)

---

## 🐛 Common Issues

### Badge Not Showing
**Check**: 
- Is tier value one of: 'basic', 'premium', 'premium_pro'?
- If basic, is showLabel=true?
- Is subscription_tier field populated from database?

### Badge Color Wrong
**Check**:
- Verify subscription_tier value in database
- Check that migration was applied
- Try hard-coding tier to test

### Tooltip Not Showing
**Check**:
- Is showTooltip={true}?
- Is tier not 'basic'?
- Is z-index high enough?

---

## 📱 Mobile Optimization

```jsx
// Responsive badge size
const badgeSize = isMobile ? 'sm' : 'md';

<VerificationBadge 
  tier={user.subscription_tier}
  size={badgeSize}
  showLabel={!isMobile}
  showTooltip={!isMobile}
/>
```

---

## 🎯 Best Practices

1. **Use appropriate size**
   - sm: In tables, comments, search results
   - md: In user profiles, cards
   - lg: In profile headers, banners

2. **Label only when space allows**
   - Show label in user cards/profiles
   - Hide label in tight spaces (tables, lists)

3. **Position consistently**
   - Always place right after user name
   - Use flexbox for alignment

4. **Color contrast**
   - Badges are visible on dark backgrounds
   - No additional styling needed

5. **Avoid redundancy**
   - Don't show tier in multiple places in same component
   - One badge per user per section is enough

---

## 📞 Support

For issues with badge integration:
1. Check `/SUBSCRIPTION_TIER_GUIDE.md` - Troubleshooting section
2. Verify subscription_tier column exists in database
3. Check tier value is one of the 3 valid options
4. Review browser console for errors

---

**Ready to integrate!** 🚀
