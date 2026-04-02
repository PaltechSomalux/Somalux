# QR Code Sharing - Quick Reference Guide

## 🎯 What's New

Your QR Code component now has powerful sharing features built-in:

### Social Media Sharing
- **Twitter** - Share with custom message
- **Facebook** - Facebook share dialog
- **WhatsApp** - Share via messaging app
- **LinkedIn** - Professional network sharing
- **Telegram** - Messaging platform integration
- **Email** - Default email client

### Direct Sharing
- **Copy Link** - Copy URL to clipboard
- **Native Share** - Use device's native share menu
- **Download** - PNG/JPG formats with logo

## 📦 Dependencies

The component uses these icon libraries (already installed):
```json
"react-icons": "^4.x.x"
"styled-components": "^5.x.x"
"qrcode.react": "^1.x.x"
```

If missing Font Awesome icons, install:
```bash
npm install react-icons
```

## 🚀 Usage Examples

### Basic Usage
```jsx
import QRCodeShare from './components/QRCodeShare';

<QRCodeShare 
  url="https://somalux.co.ke"
  title="Join SomaLux"
  description="Scan to visit our platform"
/>
```

### With Custom Share Text
```jsx
<QRCodeShare 
  url="https://somalux.co.ke/user/123"
  title="My Profile"
  description="Check out my SomaLux profile!"
  shareText="Join me on SomaLux - Connect and share!"
/>
```

### With Success Callback
```jsx
<QRCodeShare 
  url={profileUrl}
  shareText={shareMessage}
  onShareSuccess={(platform, format) => {
    console.log(`User shared via ${platform}`);
    // Track analytics
    analytics.track('qr_shared', { platform });
  }}
/>
```

### In Profile Component
```jsx
// In src/SomaLux/BookDashboard/Profile.js
{showQRCode && (
  <QRCodeShare 
    url={`https://somalux.co.ke/profile/${userId}`}
    title="My SomaLux Profile"
    shareText="Check out my profile on SomaLux!"
    onShareSuccess={(platform) => {
      // Track share metrics
    }}
  />
)}
```

## 🔧 Component API

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | string | 'https://somalux.co.ke' | URL to encode in QR code |
| `title` | string | 'Scan to Visit SomaLux' | Modal title |
| `description` | string | '...' | Modal description |
| `shareText` | string | 'Check out SomaLux...' | Text for social shares |
| `onShareSuccess` | function | null | Callback on share action |

### Callback Function
```javascript
onShareSuccess(platform, optionalFormat) {
  // platform: 'twitter', 'facebook', 'whatsapp', 'linkedin', 
  //           'telegram', 'email', 'copy', 'download', 'native'
  // optionalFormat: 'png' or 'jpg' (only for downloads)
}
```

## 🎨 Styling

All styling is built-in with styled-components. Component uses:
- **Colors**: Dark theme (#111b21, #202c33) with SomaLux green (#00a884)
- **Responsive**: Works on mobile and desktop
- **Animations**: Smooth transitions and hover effects

## 📱 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| QR Code | ✅ | ✅ | ✅ | ✅ |
| Social Share | ✅ | ✅ | ✅ | ✅ |
| Copy Link | ✅ | ✅ | ✅ | ✅ |
| Native Share | ✅ | ✅ | ✅ | ✅ |
| Download | ✅ | ✅ | ✅ | ✅ |

## ⚙️ Customization

### Change Colors
Modify styled components at the top of QRCodeShare.jsx:
```javascript
const QRContainer = styled.div`
  background: #111b21;  // Change background
  // ...
`;

const DownloadButton = styled.button`
  background: #00a884;  // Change button color
  // ...
`;
```

### Adjust Layout
- `SocialShareGrid`: Change grid columns from `repeat(3, 1fr)` to desired layout
- `ShareOptionsGrid`: Adjust gap and columns for link sharing section
- `QRContainer`: Modify max-width, padding, margins

### Add More Platforms
Add new share handler:
```javascript
const handleInstagramShare = () => {
  // Instagram shares link only (no direct API)
  window.open(`https://www.instagram.com/?url=${encodeURIComponent(url)}`);
  if (onShareSuccess) onShareSuccess('instagram');
};
```

Then add button:
```jsx
<SocialButton onClick={handleInstagramShare} title="Share on Instagram">
  <FaInstagram />
  Instagram
</SocialButton>
```

## 🐛 Troubleshooting

### Icons Not Showing
- Check if `react-icons` is installed: `npm list react-icons`
- Ensure imports are correct at top of file
- Clear node_modules and reinstall if needed

### Download Not Working
- Check browser console for errors
- Ensure `/PaltechBlack192.png` exists in public folder
- Test with fallback image or remove logo temporarily

### Share Dialog Not Opening
- Check browser's popup blocker settings
- Some platforms may be blocked in development
- Test in production environment

### Copy to Clipboard Fails
- Only works in secure contexts (HTTPS in production)
- Some older browsers may not support Clipboard API
- Add fallback method if needed

## 📊 Analytics Integration

Track share events easily:
```javascript
<QRCodeShare 
  onShareSuccess={(platform, format) => {
    // Send to your analytics service
    gtag.event('qr_share', {
      platform: platform,
      format: format,
      timestamp: new Date().toISOString()
    });
  }}
/>
```

## 🔐 Security Notes

- All URLs are properly encoded for social platforms
- No sensitive data passed in URLs
- External links open in new tabs/windows
- Works over HTTPS (recommended for Clipboard API)

## 📚 Related Files

- Component: [src/components/QRCodeShare.jsx](../../src/components/QRCodeShare.jsx)
- Used in: [src/SomaLux/BookDashboard/Profile.js](../../src/SomaLux/BookDashboard/Profile.js)
- Documentation: [QR_CODE_SHARING_FEATURES.md](./QR_CODE_SHARING_FEATURES.md)

## 🤝 Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review component console logs
3. Test on different browsers
4. Check social platform rate limits

---

**Last Updated**: February 4, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
