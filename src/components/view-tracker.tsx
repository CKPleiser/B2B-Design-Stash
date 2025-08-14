'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  assetId: string;
}

export function ViewTracker({ assetId }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    
    const trackView = async () => {
      try {
        // Check if this asset was viewed recently (within last 30 minutes)
        const viewKey = `viewed_${assetId}`;
        const lastViewed = localStorage.getItem(viewKey);
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        
        if (lastViewed && parseInt(lastViewed) > thirtyMinutesAgo) {
          console.log('Asset recently viewed, skipping view count increment');
          return;
        }
        
        // Use a small delay to ensure the page has loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch('/api/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assetId }),
        });

        if (response.ok) {
          console.log('View tracked successfully for asset:', assetId);
          // Store timestamp in localStorage to prevent duplicate counts
          localStorage.setItem(viewKey, Date.now().toString());
        } else {
          const errorData = await response.text();
          console.error('Failed to track view. Status:', response.status, 'Error:', errorData);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
    hasTracked.current = true;
  }, [assetId]);

  // This component doesn't render anything
  return null;
}