'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Report Core Web Vitals
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS(console.log);
        onFCP(console.log);
        onINP(console.log); // FID is deprecated, replaced with INP
        onLCP(console.log);
        onTTFB(console.log);
      }).catch(() => {
        // Ignore web-vitals import errors in development
      });
    }

    // Monitor largest contentful paint elements
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP candidate:', entry);
          }
        }
      });
      
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // Browser doesn't support this metric
      }

      return () => observer.disconnect();
    }
  }, []);

  return null; // This component doesn't render anything
}