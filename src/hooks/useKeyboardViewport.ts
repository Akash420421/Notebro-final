import { useState, useEffect } from 'react';

export interface ViewportMetrics {
  viewportHeight: number;
  viewportTop: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

/**
 * Custom hook to monitor mobile software keyboard state and visual viewport dimensions
 * using the modern window.visualViewport API.
 * 
 * Works seamlessly on Android Chrome, iOS Safari, mobile PWAs, and desktop browsers.
 */
export function useKeyboardViewport(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() => {
    if (typeof window === 'undefined') {
      return {
        viewportHeight: 0,
        viewportTop: 0,
        keyboardHeight: 0,
        isKeyboardOpen: false,
      };
    }

    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const top = vv ? vv.offsetTop : 0;
    const keyboardH = Math.max(0, Math.round(window.innerHeight - (height + top)));

    return {
      viewportHeight: height,
      viewportTop: top,
      keyboardHeight: keyboardH,
      isKeyboardOpen: keyboardH > 40,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;

    const updateMetrics = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const layoutHeight = window.innerHeight;
        const currentHeight = vv ? vv.height : layoutHeight;
        const currentTop = vv ? vv.offsetTop : 0;
        
        // Calculate the height of the software keyboard
        const computedKeyboardHeight = Math.max(
          0,
          Math.round(layoutHeight - (currentHeight + currentTop))
        );

        // A threshold of > 40px differentiates soft keyboard from browser UI bar adjustments
        const keyboardActive = computedKeyboardHeight > 40;

        setMetrics({
          viewportHeight: currentHeight,
          viewportTop: currentTop,
          keyboardHeight: computedKeyboardHeight,
          isKeyboardOpen: keyboardActive,
        });
      });
    };

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateMetrics);
      visualViewport.addEventListener('scroll', updateMetrics);
    }

    window.addEventListener('resize', updateMetrics);
    window.addEventListener('orientationchange', updateMetrics);

    // Initial check
    updateMetrics();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateMetrics);
        visualViewport.removeEventListener('scroll', updateMetrics);
      }
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
    };
  }, []);

  return metrics;
}
