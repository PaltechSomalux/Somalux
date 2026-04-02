# QR Code Sharing Integration Examples

## Overview
This guide shows how to integrate the enhanced QR Code sharing features into different parts of your application.

## 1. Profile.js Integration (BookDashboard)

### Current Implementation
Location: `src/SomaLux/BookDashboard/Profile.js`

The QR Code modal is already integrated. Here's the current code:

```jsx
{showQRCode && (
  <div className="qr-modal-overlay" onClick={() => setShowQRCode(false)}>
    <div 
      className="qr-modal-container"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '450px', overflow: 'visible', position: 'relative' }}
    >
      {/* Close Button */}
      <button
        className="qr-modal-close-btn"
        onClick={() => setShowQRCode(false)}
        aria-label="Close"
        style={{...}}
      >
        ×
      </button>

      <QRCodeShare 
        url="https://somalux.co.ke"
        title="Scan to Visit SomaLux"
        description="Share this QR code to help others discover our platform"
      />
    </div>
  </div>
)}
```

### Enhanced Implementation with Tracking

Replace the above with:

```jsx
{showQRCode && (
  <div className="qr-modal-overlay" onClick={() => setShowQRCode(false)}>
    <div 
      className="qr-modal-container"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '450px', overflow: 'visible', position: 'relative' }}
    >
      {/* Close Button */}
      <button
        className="qr-modal-close-btn"
        onClick={() => setShowQRCode(false)}
        aria-label="Close"
        style={{...}}
      >
        ×
      </button>

      <QRCodeShare 
        url={`https://somalux.co.ke/profile/${authUser?.id || 'somalux'}`}
        title="My SomaLux Profile"
        description="Share this QR code to help others discover my profile"
        shareText={`Check out my profile on SomaLux! Join our community and connect with me.`}
        onShareSuccess={(platform, format) => {
          console.log(`✅ Shared via ${platform}`, format ? `(${format})` : '');
          // Track analytics
          if (window.gtag) {
            gtag.event('qr_code_share', {
              platform: platform,
              format: format || 'link',
              profile_id: authUser?.id
            });
          }
        }}
      />
    </div>
  </div>
)}
```

## 2. ChatMe ProfileViewer Integration

### Location
`src/components/ChatMe/ChatList/Components/ProfileViewer.jsx`

### Implementation Example

Add this state for QR Code modal:

```jsx
const [showQRCodeModal, setShowQRCodeModal] = useState(false);
```

Add a QR Code button in the profile header:

```jsx
<button 
  onClick={() => setShowQRCodeModal(true)}
  style={{
    padding: '5px 9px',
    background: 'transparent',
    border: '1px solid #00a884',
    color: '#00a884',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  }}
>
  📱 Profile QR
</button>
```

Add the QR Modal JSX:

```jsx
{showQRCodeModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  }}>
    <div style={{
      backgroundColor: '#111b21',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '450px',
      width: '90%',
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
    }}>
      <button
        onClick={() => setShowQRCodeModal(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#8696a0',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px'
        }}
      >
        ×
      </button>

      <QRCodeShare 
        url={`https://somalux.co.ke/profile/${profile?.id}`}
        title={`${profile?.name || 'User'}'s Profile`}
        description="Scan this QR code to view my profile on SomaLux"
        shareText={`Check out ${profile?.name || 'my'} profile on SomaLux!`}
        onShareSuccess={(platform) => {
          console.log(`Profile shared via ${platform}`);
        }}
      />
    </div>
  </div>
)}
```

## 3. Advanced: User Profile QR with Dynamic URL

### Personalized Profile Sharing

```jsx
const ProfileQRModal = ({ profile, isOpen, onClose }) => {
  const [shareMessage, setShareMessage] = useState(
    `Check out ${profile?.full_name}'s profile on SomaLux!`
  );

  // Generate unique profile URL
  const profileUrl = `https://somalux.co.ke/profile/${profile?.id}`;

  // Customize message based on user role/tier
  const getCustomMessage = () => {
    if (profile?.role === 'author') {
      return `Follow ${profile?.full_name} on SomaLux and check out their work!`;
    }
    if (profile?.subscription_tier === 'premium_pro') {
      return `Connect with premium member ${profile?.full_name} on SomaLux!`;
    }
    return shareMessage;
  };

  return (
    <>
      {isOpen && (
        <div style={modalOverlayStyles}>
          <div style={modalContainerStyles}>
            <button 
              onClick={onClose}
              style={closeButtonStyles}
            >
              ×
            </button>

            <QRCodeShare 
              url={profileUrl}
              title={`${profile?.full_name}'s SomaLux Profile`}
              description={`Scan to view ${profile?.full_name}'s profile, engagement, and activity on SomaLux`}
              shareText={getCustomMessage()}
              onShareSuccess={(platform) => {
                logShareEvent(platform, profile?.id);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
```

## 4. With Analytics Tracking

### Enhanced Tracking Function

```jsx
const logShareEvent = (platform, profileId) => {
  // Send to analytics service
  const event = {
    type: 'qr_code_share',
    platform: platform,
    profileId: profileId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  // Firebase Analytics
  if (window.gtag) {
    gtag.event('qr_share', {
      platform: platform,
      profile_id: profileId
    });
  }

  // Custom backend logging
  fetch('/api/events/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  }).catch(err => console.error('Analytics error:', err));

  // Local notifications
  console.log(`✅ QR shared via ${platform}`);
};
```

## 5. Conditional QR Display

### Show QR Only for Certain Users

```jsx
// In ProfileViewer component
const canShareProfile = () => {
  // Allow sharing if:
  // - It's the user's own profile
  // - Profile is public
  // - User has verified email
  return (
    isSelfProfile || 
    profile?.visibility === 'public' || 
    profile?.email_verified
  );
};

return (
  <>
    {/* Profile header */}
    <div style={profileHeaderStyles}>
      <h2>{profile?.name}</h2>
      
      {/* Show QR button only if allowed */}
      {canShareProfile() && (
        <button 
          onClick={() => setShowQRModal(true)}
          title="Share profile QR code"
        >
          📱 Share
        </button>
      )}
    </div>

    {/* QR Modal */}
    {showQRModal && (
      <QRCodeShare 
        url={`https://somalux.co.ke/profile/${profile?.id}`}
        // ... other props
      />
    )}
  </>
);
```

## 6. Mobile-Optimized Implementation

### Responsive QR Modal for Mobile

```jsx
const QRModalMobile = ({ profile, isOpen, onClose }) => {
  const isMobile = window.innerWidth <= 768;

  const modalStyles = isMobile ? {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: '#111b21',
    zIndex: 9999,
    overflowY: 'auto',
    padding: '20px 10px'
  } : {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#111b21',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '450px',
    zIndex: 9999
  };

  return (
    <>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9998
        }} onClick={onClose} />
      )}
      
      {isOpen && (
        <div style={modalStyles}>
          <button onClick={onClose} style={closeStyles}>
            ← Back
          </button>
          <QRCodeShare 
            url={`https://somalux.co.ke/profile/${profile?.id}`}
            shareText={`Check out my SomaLux profile!`}
          />
        </div>
      )}
    </>
  );
};
```

## 7. Custom Branding Variations

### Create Different QR Codes for Different Purposes

```jsx
// Book Download QR
<QRCodeShare 
  url={`https://somalux.co.ke/book/${bookId}`}
  title="Scan to Download"
  description="Share this book with others"
  shareText={`Check out this book on SomaLux: ${bookTitle}`}
/>

// Author Profile QR
<QRCodeShare 
  url={`https://somalux.co.ke/author/${authorId}`}
  title="Author Profile"
  description="Follow this author"
  shareText={`Follow ${authorName} on SomaLux!`}
/>

// Campus Document QR
<QRCodeShare 
  url={`https://somalux.co.ke/document/${docId}`}
  title="Campus Document"
  description="Share this resource"
  shareText={`Check out this campus document on SomaLux`}
/>
```

## Key Points

✅ **URL Encoding**: All special characters are properly encoded  
✅ **Error Handling**: Graceful fallbacks for unsupported platforms  
✅ **Analytics Ready**: Callback hooks for tracking  
✅ **Mobile Friendly**: Works seamlessly on mobile devices  
✅ **Accessible**: Proper ARIA labels and keyboard support  
✅ **Cross-Browser**: Compatible with all modern browsers  

## Testing Checklist

- [ ] QR code generates correctly
- [ ] All social media buttons open correct URLs
- [ ] Copy to clipboard works on HTTPS
- [ ] Download PNG/JPG functions properly
- [ ] Modal closes when clicking outside
- [ ] Mobile layout is responsive
- [ ] Analytics callback fires on share
- [ ] Browser console shows no errors
- [ ] All icons display correctly
- [ ] Status messages appear and disappear

---

For more information, see:
- [QR_CODE_SHARING_FEATURES.md](./QR_CODE_SHARING_FEATURES.md)
- [QR_CODE_SHARING_QUICKREF.md](./QR_CODE_SHARING_QUICKREF.md)
