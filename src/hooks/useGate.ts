/**
 * useGate hook - Orchestrates paywall modal display and gate logic
 */
'use client';

import { useState, useEffect } from 'react';
import { gate, ShouldGateResult } from '@/lib/gate';
import { trackGateImpression, trackGateBlock } from '@/lib/analytics';

interface UseGateOptions {
  type: 'list' | 'detail';
  totalCount?: number;
  enabled?: boolean;
}

interface UseGateReturn {
  shouldShowModal: boolean;
  gateResult: ShouldGateResult | null;
  showModal: () => void;
  hideModal: (suppressDuration?: number) => void;
  recordView: () => void;
  isAuthenticated: boolean;
}

export function useGate({ 
  type, 
  totalCount, 
  enabled = true 
}: UseGateOptions): UseGateReturn {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [gateResult, setGateResult] = useState<ShouldGateResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Import here to avoid SSR issues
        const { getSession } = await import('@/lib/auth');
        const { session } = await getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    // Listen for auth changes if available
    import('@/lib/supabase/client').then(({ supabase, isSupabaseAvailable }) => {
      if (isSupabaseAvailable() && supabase) {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
          setIsAuthenticated(!!session);
          
          // If user just authenticated, hide modal and clear suppression
          if (session && shouldShowModal) {
            setShouldShowModal(false);
            gate.clearSuppression();
          }
        });

        return () => subscription.unsubscribe();
      }
    });
  }, [shouldShowModal]);

  // Initialize gate check
  useEffect(() => {
    if (!enabled || hasInitialized || isAuthenticated) return;

    const initializeGate = () => {
      const result = gate.shouldGate({ type, totalCount });
      setGateResult(result);
      
      if (result.gated) {
        // Track gate impression
        trackGateImpression(type);
        
        // Track gate block with current counts
        const counts = gate.getCounts();
        trackGateBlock(result.allowedCount || 0, {
          listSeen: counts.listSeen,
          detailSeen: counts.detailSeen,
        });
        
        // Show modal after a brief delay to avoid jarring experience
        setTimeout(() => {
          setShouldShowModal(true);
        }, 500);
      }
      
      setHasInitialized(true);
    };

    // Run on next tick to ensure component is mounted
    setTimeout(initializeGate, 0);
  }, [enabled, hasInitialized, isAuthenticated, type, totalCount]);

  const recordView = () => {
    if (enabled && !isAuthenticated) {
      gate.recordView(type);
    }
  };

  const showModal = () => {
    if (!isAuthenticated) {
      trackGateImpression(type);
      setShouldShowModal(true);
    }
  };

  const hideModal = (suppressDuration?: number) => {
    setShouldShowModal(false);
    
    if (suppressDuration) {
      gate.suppress(suppressDuration);
    }
  };

  return {
    shouldShowModal: shouldShowModal && !isAuthenticated,
    gateResult,
    showModal,
    hideModal,
    recordView,
    isAuthenticated,
  };
}