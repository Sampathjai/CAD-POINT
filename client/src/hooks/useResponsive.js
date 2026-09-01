import { useState, useEffect } from 'react';

/**
 * Custom hook to detect window dimensions and viewport device type.
 * Breakpoints:
 * - Mobile / Touch Device: < 1024px or Mobile UserAgent (Renders MobileLayout, NO sidebar)
 * - Desktop: >= 1024px and Non-Mobile UserAgent (Renders Existing DesktopLayout with sidebar)
 */
export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    function checkResponsive() {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      setWindowWidth(width);
      const isTouchOrMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice(isTouchOrMobile);
    }

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  const isMobile = windowWidth < 1024 || isMobileDevice;
  const isDesktop = windowWidth >= 1024 && !isMobileDevice;

  return {
    windowWidth,
    isMobile,
    isDesktop,
    screenType: isMobile ? 'mobile' : 'desktop'
  };
}
