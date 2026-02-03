import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreenSize = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice);
      setIsSmallScreen(isSmallScreenSize);
      
      console.log('📱 Device detection:', {
        userAgent,
        isMobileDevice,
        isSmallScreenSize,
        screenWidth: window.innerWidth
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isSmallScreen };
};
