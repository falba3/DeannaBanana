import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768) { // Default breakpoint for mobile, e.g., 768px
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile(); // Check on mount
    window.addEventListener('resize', checkIsMobile); // Check on resize

    return () => {
      window.removeEventListener('resize', checkIsMobile); // Clean up
    };
  }, [breakpoint]);

  return isMobile;
}
