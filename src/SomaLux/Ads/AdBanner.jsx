import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiX } from 'react-icons/fi';
import ReactDOM from 'react-dom';
import './AdBanner.css';

// Internal component with all the hook logic
function AdBannerContent({ placement, limit = 1, className = '', demo = false }) {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [impressionLogged, setImpressionLogged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAdClosed, setIsAdClosed] = useState(false);
  const viewTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const currentAdRef = useRef(null);
  const videoRef = useRef(null);
  const adIndexRef = useRef(0);
  const isGridPlacementRef = useRef(placement?.startsWith('grid') ?? false);

  // Demo ad for testing
  const demoAd = {
    id: 'demo-ad',
    title: 'Sample Grid Ad',
    ad_type: 'image',
    image_url: 'https://via.placeholder.com/400x300?text=Grid+Ad',
    video_url: null,
    click_url: '#',
    countdown_seconds: 10,
    placement: placement
  };

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        console.log('🔍 [AdBanner] Fetching ads for placement:', placement, 'limit:', limit);
        
        // If demo mode, use demo ad
        if (demo) {
          console.log('📺 [AdBanner] Demo mode enabled');
          setAds([demoAd]);
          adIndexRef.current = 0;
          setCurrentAdIndex(0);
          setCountdown(demoAd.countdown_seconds || 10);
          setLoading(false);
          return;
        }
        const response = await axios.get(`${API_URL}/api/ads/${placement}?limit=${limit}`);
        console.log('✅ [AdBanner] Ads fetched - Total:', response.data.data.length, 'Data:', response.data);
        if (response.data.success && response.data.data.length > 0) {
          const allAds = response.data.data;
          setAds(allAds);
          adIndexRef.current = 0;
          setCurrentAdIndex(0);
          
          const firstAd = allAds[0];
          const firstAdDuration = firstAd.countdown_seconds || 10;
          setCountdown(firstAdDuration);
          
          console.log(`📺 [AdBanner] Loaded ${allAds.length} ads - Starting with: "${firstAd.title}" (${firstAdDuration}s)`);
          
          // Log initial impression
          logImpression(firstAd.id);
          startViewTimer(firstAd.id, firstAdDuration);
        } else {
          console.debug('ℹ️ [AdBanner] No ads available for placement:', placement);
          setError('No ads available');
        }
      } catch (err) {
        console.error('❌ [AdBanner] Failed to fetch ads:', err);
        setError('Failed to load ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [placement, limit]);

  // Countdown timer and rotation - STRICT timer enforcement
  useEffect(() => {
    if (ads.length === 0 || countdown < 0 || isAdClosed) {
      return;
    }

    // If countdown is 0 or less, force immediate transition
    if (countdown === 0) {
      console.log(`⏹️ [AdBanner] TIMER EXPIRED`);
      
      // Immediately stop any playing video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        console.log('🛑 [AdBanner] Video forcefully stopped');
      }
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Check if this is a grid placement - only rotate for grid ads
      const isGridPlacement = placement?.startsWith('grid') ?? false;
      
      if (isGridPlacement) {
        // For grid placements, rotate to next ad
        const nextIndex = (adIndexRef.current + 1) % ads.length;
        adIndexRef.current = nextIndex;
        setCurrentAdIndex(nextIndex);
        
        const nextAd = ads[nextIndex];
        const nextCountdown = nextAd.countdown_seconds || 10;
        
        console.log(`⏳ [AdBanner] Grid Ad ${nextIndex + 1}/${ads.length} starting: "${nextAd.title}" (${nextCountdown}s)`);
        
        // Log impression for new ad
        logImpression(nextAd.id);
        startViewTimer(nextAd.id, nextCountdown);
        setCountdown(nextCountdown);
      } else {
        // For non-grid placements, close the ad
        console.log(`❌ [AdBanner] Closing non-grid ad after countdown expired`);
        setIsAdClosed(true);
      }
      return;
    }

    // Countdown is active, start the timer
    console.log(`⏱️ [AdBanner] Ad ${adIndexRef.current + 1}/${ads.length} - Timer: ${countdown}s remaining`);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        const newCountdown = prev - 1;
        console.log(`⏱️ [AdBanner] Timer: ${newCountdown}s remaining`);
        return newCountdown;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [ads, isAdClosed, placement]);

  // SAFETY: Force stop any video if countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && videoRef.current) {
      console.log('🛑 [SAFETY] Forcing video stop - countdown is 0');
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [countdown]);

  // Start timer to track view duration
  const startViewTimer = (adId, duration = 10) => {
    if (viewTimerRef.current) clearInterval(viewTimerRef.current);
    startTimeRef.current = Date.now();
    
    let viewDuration = 0;
    viewTimerRef.current = setInterval(() => {
      viewDuration += 1;
    }, 1000);

    return viewDuration;
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Log impression when ad loads
  const logImpression = async (adId) => {
    if (impressionLogged) return;
    
    try {
      setImpressionLogged(true);
      const deviceType = getDeviceType();
      const payload = {
        adId,
        placement,
        userId: null, // Add user ID if authenticated
        viewDuration: 0,
        deviceType,
        userAgent: navigator.userAgent
      };
      console.log('📊 [Impression] Sending:', payload);
      const response = await axios.post(`${API_URL}/api/ad-impression`, payload);
      console.log('✅ [Impression] Response:', response.data);
    } catch (err) {
      console.error('❌ [Impression] Failed to log impression:', err);
    }
  };

  // Get device type
  const getDeviceType = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad/.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  };

  // Handle ad click
  const handleAdClick = async (ad) => {
    try {
      const viewDuration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const clickPayload = {
        adId: ad.id,
        placement,
        userId: null, // Add user ID if authenticated
        viewDuration,
        deviceType: getDeviceType()
      };
      console.log('🖱️ [Click] Sending:', clickPayload);
      const response = await axios.post(`${API_URL}/api/ad-click`, clickPayload);
      console.log('✅ [Click] Response:', response.data);
      
      if (ad.click_url) {
        window.open(ad.click_url, '_blank');
      }
    } catch (err) {
      console.error('❌ [Click] Failed to log click:', err);
    }
  };

  // Handle close button
  const handleClose = async (ad) => {
    try {
      const viewDuration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const dismissPayload = {
        adId: ad.id,
        placement,
        userId: null,
        viewDuration,
        deviceType: getDeviceType()
      };
      console.log('❌ [Dismiss] Sending:', dismissPayload);
      const response = await axios.post(`${API_URL}/api/ad-dismiss`, dismissPayload);
      console.log('✅ [Dismiss] Response:', response.data);
    } catch (err) {
      console.error('❌ [Dismiss] Failed to log dismiss:', err);
    }
    
    // Stop current video if playing
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    // Check if this is a grid placement
    const isGridPlacement = placement?.startsWith('grid') ?? false;
    
    if (isGridPlacement) {
      // For grid placements, skip to next ad
      const nextIndex = (adIndexRef.current + 1) % ads.length;
      adIndexRef.current = nextIndex;
      setCurrentAdIndex(nextIndex);
      
      const nextAd = ads[nextIndex];
      const nextCountdown = nextAd.countdown_seconds || 10;
      setCountdown(nextCountdown);
      setCurrentTime(0);
      setIsPlaying(false);
      
      logImpression(nextAd.id);
      startViewTimer(nextAd.id, nextCountdown);
    } else {
      // For non-grid placements, close the ad
      console.log(`❌ [AdBanner] Closing non-grid ad by user`);
      setIsAdClosed(true);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) clearInterval(viewTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (loading) {
    return null;
  }

  if (error || ads.length === 0) {
    return null; // Don't show anything if no ads
  }

  // If non-grid ad is closed, return null
  if (isAdClosed && !(placement?.startsWith('grid') ?? false)) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  
  // Handle both image and video ads
  const isVideoAd = currentAd.ad_type === 'video';
  
  const imageUrl = !isVideoAd && currentAd.image_url 
    ? (currentAd.image_url.startsWith('http') 
      ? currentAd.image_url 
      : `${API_URL}${currentAd.image_url}`)
    : null;

  const videoUrl = isVideoAd && currentAd.video_url
    ? (currentAd.video_url.startsWith('http')
      ? currentAd.video_url
      : `${API_URL}${currentAd.video_url}`)
    : null;

  // Log video URL for debugging
  if (isVideoAd && videoUrl) {
    console.log('🎬 [VIDEO_AD] Full URL:', videoUrl);
    console.log('🎬 [VIDEO_AD] From object:', currentAd.video_url);
    console.log('🎬 [VIDEO_AD] Ad object:', currentAd);
  }

  const adContent = (
    <div className={`ad-banner ${placement?.startsWith('grid') ? 'grid-placement' : ''} ${className}`} ref={currentAdRef}>
      <div className="ad-container">
        <div className="ad-wrapper">
          {isVideoAd ? (
            <div className="ad-video-container">
              {/* Video wrapper */}
              <div className="ad-video-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  className="ad-video"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsPlaying(true);
                      } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  onError={(e) => console.error('❌ [VIDEO] Failed to load:', videoUrl, e.target.error)}
                  onLoadedMetadata={(e) => {
                    console.log('✅ [VIDEO] Metadata loaded:', videoUrl);
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration);
                      videoRef.current.play().then(() => {
                        console.log('✅ [VIDEO] Autoplay started with sound');
                        setIsPlaying(true);
                      }).catch(err => console.error('❌ [VIDEO] Play failed:', err));
                    }
                  }}
                  onCanPlay={() => console.log('✅ [VIDEO] Can play:', videoUrl)}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                >
                  <source 
                    src={videoUrl}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

                {/* Top overlay for ad label and close button */}
                <div className="ad-video-top-overlay">
                  <span className="ad-label">ad</span>
                  <div className="ad-countdown">
                    <span className="countdown-text">{countdown}s</span>
                  </div>
                  <button 
                    onClick={() => handleClose(currentAd)}
                    title="Close ad"
                    className="ad-close-btn"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* MOBILE CONTROLS - Same Minimal Layout */}
              <div className="ad-video-controls">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                  className="ad-video-progress"
                />
                
                {/* Time only */}
                <span className="ad-video-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          ) : (
            <>
              <img
                src={imageUrl}
                alt={currentAd.title}
                onClick={() => handleAdClick(currentAd)}
                className="ad-image"
              />
              <div className="ad-overlay">
                <span className="ad-label">ad</span>
                <div className="ad-countdown">
                  <span className="countdown-text">{countdown}s</span>
                </div>
                <button 
                  className="ad-close-btn"
                  onClick={() => handleClose(currentAd)}
                  title="Close ad"
                >
                  <FiX />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // For grid placement, render simplified grid ad
  if (placement?.startsWith('grid')) {
    const gridAdContent = (
      <div className="ad-grid-card" ref={currentAdRef} onClick={() => handleAdClick(currentAd)}>
        {isVideoAd ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="ad-grid-video"
            onError={(e) => console.error('❌ [VIDEO] Failed to load:', videoUrl, e.target.error)}
            onLoadedMetadata={(e) => {
              console.log('✅ [VIDEO] Grid ad - Metadata loaded:', videoUrl);
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                videoRef.current.play().then(() => {
                  console.log('✅ [VIDEO] Grid ad - Autoplay started');
                  setIsPlaying(true);
                }).catch(err => console.error('❌ [VIDEO] Play failed:', err));
              }
            }}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <img src={imageUrl} alt={currentAd.title} className="ad-grid-image" />
        )}
        <div className="ad-grid-overlay">
          <span className="ad-label">ad</span>
          <div className="ad-countdown">
            <span className="countdown-text">{countdown}s</span>
          </div>
          <button 
            className="ad-close-btn"
            onClick={(e) => { e.stopPropagation(); handleClose(currentAd); }}
            title="Close ad"
          >
            <FiX />
          </button>
        </div>
      </div>
    );
    return gridAdContent;
  }

  // Render ad as portal to overlay it on top of everything
  return ReactDOM.createPortal(adContent, document.body);
}

// Wrapper component that checks subscription tier based on placement
export function AdBanner({ placement, limit = 1, className = '', demo = false, user = null }) {
  const isGridPlacement = placement?.startsWith('grid');
  const userTier = user?.subscription_tier || 'basic';
  
  // premium_pro users: no ads at all
  if (userTier === 'premium_pro') {
    return null;
  }
  
  // premium users: only grid placement ads (grid-books, grid-pastpapers, grid-campus, grid-authors, grid-categories)
  if (userTier === 'premium' && !isGridPlacement) {
    return null;
  }
  
  // basic users and other cases: render the ad
  return <AdBannerContent placement={placement} limit={limit} className={className} demo={demo} />;
}