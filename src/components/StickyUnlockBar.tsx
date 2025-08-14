/**
 * StickyUnlockBar - Calm, single-action unlock nudge
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Lock } from 'lucide-react';

interface StickyUnlockBarProps {
  isVisible: boolean;
  onUnlock: () => void;
  totalCount: number;
  freeCount: number;
}

const DISMISS_KEY = 'db_unlock_bar_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function StickyUnlockBar({ 
  isVisible, 
  onUnlock, 
  totalCount, 
  freeCount 
}: StickyUnlockBarProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible24h, setIsVisible24h] = useState(true);

  // Check 24h dismissal on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const now = Date.now();
      if (now - dismissTime < DISMISS_DURATION) {
        setIsVisible24h(false);
        return;
      } else {
        // Expired, remove
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible24h(false);
  };

  // Don't show if dismissed or if there are very few items
  if (!isVisible || isDismissed || !isVisible24h || totalCount <= freeCount) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-200 animate-in slide-in-from-bottom-4 fade-in"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
      }}
    >
      <div className="mx-auto max-w-[720px] px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg mx-4 mb-4">
          <div className="flex items-center justify-between p-4">
            {/* Left content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                You&apos;re seeing <span className="font-medium">{freeCount}</span> of <span className="font-medium">{totalCount}+</span> designs. Sign up free to unlock them all.
              </p>
            </div>
            
            {/* Right actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={onUnlock}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm md:text-base font-medium min-h-[44px] px-4"
              >
                🔓 Unlock All Designs
              </Button>
              
              <button
                onClick={handleDismiss}
                className="p-2 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                aria-label="Dismiss for 24 hours"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}