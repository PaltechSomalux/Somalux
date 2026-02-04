import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styled from 'styled-components';
import { FiDownload, FiShare2, FiCopy, FiMail } from 'react-icons/fi';
import { SiX, SiFacebook, SiWhatsapp, SiTelegram, SiLinkedin } from 'react-icons/si';

const QRContainer = styled.div`
  background: #0a0f14;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  margin: 20px auto;
  text-align: center;
`;

const QRTitle = styled.h3`
  color: #e9edef;
  margin-bottom: 12px;
  font-size: 1.1rem;
  font-weight: 600;
`;

const QRDescription = styled.p`
  color: #8696a0;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
  position: relative;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
`;

const LogoOverlay = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  padding: 4px;
  border-radius: 8px;
  z-index: 10;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const AllButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  margin-bottom: 15px;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 500px) {
    gap: 6px;
  }
`;

const SmallButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 6px;
  background: #080b10;
  color: #b8bcc4;
  border: 1px solid #141a22;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.7rem;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #0f1419;
    border-color: #00a884;
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    font-size: 14px;
    color: #b8bcc4;
  }
`;

const SocialPanel = styled.div`
  position: absolute;
  bottom: 100%;
  right: 10px;
  background: #0a1419;
  border: none;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  z-index: 1000;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 168, 132, 0.15);
  min-width: 340px;
  animation: slideDown 0.2s ease;
  backdrop-filter: blur(10px);

  @media (max-width: 500px) {
    right: -20px;
    min-width: 300px;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SocialPanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const SocialPanelButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: #e9edef;
  font-size: 0.55rem;
  font-weight: 600;

  &:active {
    opacity: 0.8;
  }

  svg {
    width: 40px;
    height: 40px;
    padding: 4px;
    border-radius: 10px;
    background: ${props => props.bgColor || '#00a884'};
    color: ${props => props.iconColor || 'white'};
  }
`;

const ShareButtonContainer = styled.div`
  position: relative;
  display: flex;
`;

const PanelOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
`;

const ShareText = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 0;
`;

const URLDisplay = styled.div`
  background: #202c33;
  border: 1px solid #2a3942;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  word-break: break-all;
  font-size: 0.8rem;
  color: #00a884;
`;

export const QRCodeShare = ({ 
  url = 'https://somalux.co.ke',
  title = 'Scan to Visit SomaLux',
  description = 'Scan the QR code with your phone to visit our platform',
  shareText = 'Check out SomaLux - Join our community!',
  onShareSuccess = null
}) => {
  const [downloadStatus, setDownloadStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const canvasRef = useRef();

  const handleDownload = (format = 'png') => {
    if (!canvasRef.current) return;

    try {
      const qrCanvas = canvasRef.current.querySelector('canvas');
      if (!qrCanvas) {
        setDownloadStatus('Error: Could not generate QR code');
        setTimeout(() => setDownloadStatus(''), 2000);
        return;
      }

      // Create a new canvas with logo
      const canvas = document.createElement('canvas');
      canvas.width = qrCanvas.width;
      canvas.height = qrCanvas.height;
      const ctx = canvas.getContext('2d');

      // Draw QR code
      ctx.drawImage(qrCanvas, 0, 0);

      // Load and draw logo
      const logoImg = new Image();
      logoImg.onload = () => {
        const logoSize = 80;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);

        // Download
        const link = document.createElement('a');
        link.download = `somalux-qrcode.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();

        setDownloadStatus(`Downloaded as ${format.toUpperCase()}!`);
        setTimeout(() => setDownloadStatus(''), 2000);
        
        if (onShareSuccess) onShareSuccess('download', format);
      };
      logoImg.src = '/PaltechBlack192.png';
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Error downloading QR code');
      setTimeout(() => setDownloadStatus(''), 2000);
    }
  };

  // Copy URL to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('Link copied to clipboard!');
      setTimeout(() => setCopyStatus(''), 2000);
      if (onShareSuccess) onShareSuccess('copy');
    } catch (error) {
      console.error('Copy error:', error);
      setCopyStatus('Failed to copy link');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  // Twitter share
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    if (onShareSuccess) onShareSuccess('twitter');
  };

  // Facebook share
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    if (onShareSuccess) onShareSuccess('facebook');
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
    if (onShareSuccess) onShareSuccess('whatsapp');
  };

  // Telegram share
  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    if (onShareSuccess) onShareSuccess('telegram');
  };

  // LinkedIn share
  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    if (onShareSuccess) onShareSuccess('linkedin');
  };

  // Email share
  const handleEmailShare = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${shareText}\n${url}`)}`;
    window.location.href = emailUrl;
    if (onShareSuccess) onShareSuccess('email');
  };

  // Web Share API (fallback for native sharing)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: url,
        });
        if (onShareSuccess) onShareSuccess('native');
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: open a share menu
      alert('Web Share API not supported. Use the buttons below to share!');
    }
  };

  return (
    <QRContainer>
      <QRTitle>{title}</QRTitle>
      <QRDescription>{description}</QRDescription>

      <URLDisplay>
        URL: {url}
      </URLDisplay>

      <QRCodeWrapper ref={canvasRef}>
        <QRCodeCanvas
          value={url}
          size={300}
          level="H"
          includeMargin={true}
          quietZone={10}
        />
        <LogoOverlay src="/PaltechBlack192.png" alt="SomaLux Logo" />
      </QRCodeWrapper>

      {/* All Buttons in One Row */}
      <AllButtonsRow>
        <SmallButton onClick={() => handleDownload('png')} title="Download as PNG">
          <FiDownload size={16} />
          PNG
        </SmallButton>
        <SmallButton onClick={() => handleDownload('jpg')} title="Download as JPG">
          <FiDownload size={16} />
          JPG
        </SmallButton>
        <SmallButton onClick={handleCopyLink} title="Copy link to clipboard">
          <FiCopy size={16} />
          Copy
        </SmallButton>
        <ShareButtonContainer>
          <SmallButton 
            onClick={() => setShowSocialPanel(!showSocialPanel)}
            title="Share on social media"
          >
            <FiShare2 size={16} />
            Share
          </SmallButton>

          {/* Social Media Popup Panel */}
          {showSocialPanel && (
            <>
              <PanelOverlay onClick={() => setShowSocialPanel(false)} />
              <SocialPanel>
                <SocialPanelGrid>
                  <SocialPanelButton 
                    onClick={handleTwitterShare}
                    title="Share on X"
                    bgColor="#000000"
                  >
                    <SiX />
                    X
                  </SocialPanelButton>
                  <SocialPanelButton 
                    onClick={handleFacebookShare}
                    title="Share on Facebook"
                    bgColor="#1877F2"
                  >
                    <SiFacebook />
                    Facebook
                  </SocialPanelButton>
                  <SocialPanelButton 
                    onClick={handleWhatsAppShare}
                    title="Share on WhatsApp"
                    bgColor="#25D366"
                  >
                    <SiWhatsapp />
                    WhatsApp
                  </SocialPanelButton>
                  <SocialPanelButton 
                    onClick={handleLinkedInShare}
                    title="Share on LinkedIn"
                    bgColor="#0A66C2"
                  >
                    <SiLinkedin />
                    LinkedIn
                  </SocialPanelButton>
                  <SocialPanelButton 
                    onClick={handleTelegramShare}
                    title="Share on Telegram"
                    bgColor="#FFFFFF"
                    iconColor="#31a3e1"
                  >
                    <SiTelegram />
                    Telegram
                  </SocialPanelButton>
                  <SocialPanelButton 
                    onClick={handleEmailShare}
                    title="Share via Email"
                    bgColor="#EA4335"
                  >
                    <FiMail />
                    Email
                  </SocialPanelButton>
                </SocialPanelGrid>
              </SocialPanel>
            </>
          )}
        </ShareButtonContainer>
      </AllButtonsRow>

      {/* Status Messages */}
      {downloadStatus && (
        <ShareText style={{ color: downloadStatus.includes('Error') ? '#ef4444' : '#10b981', marginBottom: '10px' }}>
          {downloadStatus}
        </ShareText>
      )}

      {copyStatus && (
        <ShareText style={{ color: copyStatus.includes('Failed') ? '#ef4444' : '#10b981', marginBottom: '10px' }}>
          {copyStatus}
        </ShareText>
      )}
    </QRContainer>
  );
};

export default QRCodeShare;
