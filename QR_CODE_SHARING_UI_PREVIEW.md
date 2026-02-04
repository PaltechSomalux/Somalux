# QR Code Sharing UI Preview

## Visual Layout

### QR Code Modal Layout
```
┌─────────────────────────────────────────────┐
│  Scan to Visit SomaLux                 ×    │
│                                             │
│  Scan the QR code with your phone to        │
│  visit our platform                         │
│                                             │
│  URL: https://somalux.co.ke                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │   [QR CODE WITH LOGO OVERLAY]      │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ ⬇ PNG        │  │ ⬇ JPG        │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ════════════════════════════════════════   │
│                                             │
│  Share Link                                 │
│  ┌──────────────────┐  ┌──────────────┐    │
│  │ 📋 Copy Link     │  │ 🔗 Share     │    │
│  └──────────────────┘  └──────────────┘    │
│  ✓ Link copied to clipboard!                │
│                                             │
│  Share on Social Media                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Twitter │ │ Facebook │ │ WhatsApp │    │
│  └─────────┘ └──────────┘ └──────────┘    │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐    │
│  │LinkedIn │ │ Telegram │ │  Email   │    │
│  └─────────┘ └──────────┘ └──────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

## Feature Breakdown

### 1. Download Section
```
[⬇ PNG]  [⬇ JPG]
```
- Download QR code in PNG format (recommended for web)
- Download QR code in JPG format (compressed)
- Both include embedded SomaLux logo
- Feedback message: "Downloaded as PNG!" ✓

### 2. Share Link Section
```
[📋 Copy Link]  [🔗 Share]
```
**Copy Link Button**
- Click to copy URL to clipboard
- Shows: "Link copied to clipboard!" ✓
- Works on HTTPS and modern browsers

**Share Button** (if Web Share API available)
- Opens native device share menu
- Available on iOS Safari, Android Chrome, Edge
- Lets users choose their preferred app

### 3. Social Media Section
```
[Twitter]  [Facebook]  [WhatsApp]
[LinkedIn] [Telegram]  [Email]
```

**Twitter**
- Opens Twitter with URL and message
- Format: `https://twitter.com/intent/tweet?url=...&text=...`

**Facebook**
- Opens Facebook share dialog
- Format: `https://www.facebook.com/sharer/sharer.php?u=...`

**WhatsApp**
- Opens WhatsApp Web with message
- Format: `https://wa.me/?text=...`

**LinkedIn**
- Opens LinkedIn share dialog
- Format: `https://www.linkedin.com/sharing/share-offsite/?url=...`

**Telegram**
- Opens Telegram with message and link
- Format: `https://t.me/share/url?url=...&text=...`

**Email**
- Opens default email client
- Format: `mailto:?subject=...&body=...`

## Design Colors

### Color Palette
```
Background:     #111b21  (Dark theme - matches WhatsApp)
Secondary:      #202c33  (Darker background for sections)
Border:         #2a3942  (Subtle divider)
Text Primary:   #e9edef  (Light text)
Text Secondary: #8696a0  (Dimmed text)
Accent:         #00a884  (SomaLux brand green)
Success:        #10b981  (Green checkmark)
Error:          #ef4444  (Red error message)
```

## Interactive States

### Button Hover Effects
```
Normal State:
┌──────────┐
│ Button   │
└──────────┘

Hover State:
┌──────────┐
│ Button   │ ↑ (slight lift)
└──────────┘ (darker background)

Active/Click State:
┌──────────┐
│ Button   │ (scale 0.98)
└──────────┘ (immediate feedback)
```

### Feedback Messages
```
Copy Success:
✓ Link copied to clipboard! (Green #10b981)

Download Success:
✓ Downloaded as PNG! (Green #10b981)

Error Message:
✗ Error downloading QR code (Red #ef4444)

Messages auto-disappear after 2 seconds
```

## Responsive Design

### Desktop (450px max-width)
```
Full layout with all features visible
- QR code: 300x300px
- Social grid: 3 columns
- Buttons: Full width sections
```

### Tablet (90% width)
```
Adjusted for smaller screens
- QR code: 280x280px (responsive)
- Social grid: 3 columns (fits)
- Buttons: Stack properly
```

### Mobile (< 768px)
```
Optimized layout
- Modal takes full screen
- QR code: 200x200px (responsive)
- Social grid: 3 columns or 2 columns
- Close button at top (← Back on small screens)
```

## Icon Sources

### Feather Icons (react-icons/fi)
```
FiDownload  → ⬇ Download button
FiShare2    → 🔗 Share button
FiCopy      → 📋 Copy button
FiMail      → ✉ Email button
```

### Font Awesome Icons (react-icons/fa)
```
FaTwitter   → 𝕏 Twitter/X
FaFacebook  → f Facebook
FaWhatsapp  → ᆥ WhatsApp
FaTelegram  → ✈ Telegram
FaLinkedin  → in LinkedIn
```

## User Flow

```
User Opens Profile
        ↓
Clicks "QR Code" Button
        ↓
Modal Opens with QR Code
        ↓
User Has Several Options:
    ├─→ Download PNG/JPG
    │   └─→ File saved to Downloads
    │
    ├─→ Copy Link
    │   └─→ Link in clipboard (paste anywhere)
    │
    └─→ Share on Platform
        ├─→ Twitter → Opens Twitter
        ├─→ Facebook → Opens Facebook
        ├─→ WhatsApp → Opens WhatsApp
        ├─→ LinkedIn → Opens LinkedIn
        ├─→ Telegram → Opens Telegram
        ├─→ Email → Opens email client
        └─→ Native Share → Uses device menu
```

## Message Examples

### Share Text Customization
```javascript
// For personal profile
"Check out my profile on SomaLux!"

// For author
"Follow me on SomaLux and check out my work!"

// For premium user
"Connect with me on SomaLux - Premium member!"

// For community invitation
"Join SomaLux and connect with our community!"
```

## Accessibility Features

### ARIA Labels
```html
<button title="Share on Twitter" aria-label="Share on Twitter">
  <FaTwitter /> Twitter
</button>
```

### Semantic HTML
```html
<h4>Share Link</h4>        <!-- Section title -->
<h4>Share on Social Media</h4>  <!-- Section title -->
<button>...</button>       <!-- Interactive elements -->
```

### Keyboard Navigation
```
Tab → Cycle through buttons
Enter → Activate button
Escape → Close modal (if implemented)
```

## Status Messages Timeline

```
User Action         | Message Shown         | Duration
─────────────────────────────────────────────────────
Copy Link Clicked   | "Link copied..."      | 2 seconds
PNG Download        | "Downloaded as PNG!"  | 2 seconds
JPG Download        | "Downloaded as JPG!"  | 2 seconds
Copy Error          | "Failed to copy link" | 2 seconds
Download Error      | "Error downloading..." | 2 seconds
```

## Social Media Integration Details

### URL Parameters Used
```
Twitter:    url, text
Facebook:   u (URL)
WhatsApp:   text (with URL embedded)
LinkedIn:   url
Telegram:   url, text
Email:      subject, body
```

### Character Limits
```
Twitter:     280 characters per tweet
Facebook:    No strict limit
WhatsApp:    Message length varies by device
LinkedIn:    No strict limit
Telegram:    No strict limit
Email:       Subject: 78 chars recommended, Body: unlimited
```

## Browser Compatibility Indicator

```
✅ Full Support      Chrome 90+, Firefox 89+, Safari 14+, Edge 90+
⚠️  Partial Support  Older browsers (graceful degradation)
❌ Not Supported     < IE 11 (outdated)

Feature Breakdown:
- QR Code:          ✅ All modern browsers
- Download:         ✅ All modern browsers
- Copy API:         ✅ Modern, needs HTTPS
- Social Share:     ✅ All browsers (URL based)
- Native Share:     ⚠️  Mobile/Safari only
- Web Share API:    ⚠️  Chrome, Safari, Edge
```

## Performance Metrics

```
Initial Load:       < 100ms
QR Generation:      < 200ms (on component mount)
Share Click:        < 50ms (opens new window)
Copy Action:        < 100ms (clipboard operation)
File Download:      < 300ms (QR generation + download)
```

## Analytics Data Available

When `onShareSuccess` callback is triggered:

```javascript
{
  platform: "twitter|facebook|whatsapp|linkedin|telegram|email|copy|download|native",
  format: "png|jpg",  // Only for downloads
  timestamp: ISO8601,
  userAgent: navigator.userAgent,
  profileId: user.id,
  success: boolean
}
```

---

This visual guide helps understand the complete QR Code Sharing UI and functionality!
