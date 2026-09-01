import { useState, useEffect } from 'react';

/**
 * Custom hook to detect window dimensions and viewport device type.
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: >= 1024px
 */
export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    screenType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}

