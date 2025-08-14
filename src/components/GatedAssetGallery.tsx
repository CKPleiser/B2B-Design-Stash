/**
 * GatedAssetGallery - Asset gallery with paywall gating support
 */
'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { GatedAssetCard } from './GatedAssetCard';
import { AssetModal } from './asset-modal';
import { PaywallModal } from './PaywallModal';
import { UnlockCTA } from './UnlockCTA';
import { StickyUnlockBar } from './StickyUnlockBar';
import { useGate } from '@/hooks/useGate';
import { useAuth } from '@/hooks/useAuth';
import { signInWithProvider, signInWithEmail } from '@/lib/auth';
import { trackAuthStart, trackAuthSuccess, trackAuthError, trackStashView } from '@/lib/analytics';
import { gate } from '@/lib/gate';
import { AuthProvider } from '@/lib/auth';
import { toast } from 'react-hot-toast';

interface GatedAssetGalleryProps {
  assets: Asset[];
}

export function GatedAssetGallery({ assets }: GatedAssetGalleryProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const {
    shouldShowModal,
    showModal,
    hideModal,
    recordView,
  } = useGate({
    type: 'list',
    totalCount: assets.length,
    enabled: true,
  });

  // Record list view on mount
  useEffect(() => {
    if (assets.length > 0 && !isAuthenticated) {
      recordView();
      trackStashView('list', undefined, 'gallery');
    }
  }, [assets.length, isAuthenticated, recordView]);

  // Calculate visible items based on gate configuration
  const visibleCount = isAuthenticated ? assets.length : gate.getVisibleItemsCount(assets.length);

  // Track scroll position for sticky bar
  useEffect(() => {
    if (isAuthenticated) return;

    const handleScroll = () => {
      const scrolledItems = window.scrollY > window.innerHeight * 0.5; // 50% page height
      const seenItemsRatio = Math.min(visibleCount / assets.length, 0.4); // 40% of items
      const shouldShowBar = scrolledItems || seenItemsRatio >= 0.4;
      
      setShowStickyBar(shouldShowBar);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, visibleCount, assets.length]);
  // Separate DB assets (always visible) from regular assets
  const dbAssets = assets.filter(asset => asset.made_by_db);
  const regularAssets = assets.filter(asset => !asset.made_by_db);
  
  // Apply gating only to regular assets
  const visibleRegularAssets = regularAssets.slice(0, Math.max(0, visibleCount - dbAssets.length));
  const hiddenRegularAssets = regularAssets.slice(Math.max(0, visibleCount - dbAssets.length));
  
  // Combine: all DB assets + visible regular assets
  const visibleAssets = [...dbAssets, ...visibleRegularAssets];
  const hiddenAssets = hiddenRegularAssets;

  const handleProviderAuth = async (provider: AuthProvider) => {
    trackAuthStart(provider, 'gallery_paywall');

    try {
      const { error } = await signInWithProvider(provider);
      
      if (error) {
        console.error('Auth error:', error);
        trackAuthError(provider, error.message, 'gallery_paywall');
        toast.error(`Failed to sign in: ${error.message}`);
        return;
      }

      // Success tracking happens in the callback
      // Modal will be automatically dismissed by the useAuth hook
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Provider auth error:', error);
      trackAuthError(provider, errorMessage, 'gallery_paywall');
      toast.error(`Authentication failed: ${errorMessage}`);
    }
  };

  const handleEmailAuth = async (email: string) => {
    trackAuthStart('email', 'gallery_paywall');

    try {
      const { error } = await signInWithEmail(email);
      
      if (error) {
        console.error('Email auth error:', error);
        trackAuthError('email', error.message, 'gallery_paywall');
        toast.error(`Failed to send magic link: ${error.message}`);
        return;
      }

      trackAuthSuccess('email', 'gallery_paywall');
      toast.success('Magic link sent! Check your email to sign in.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email auth error:', error);
      trackAuthError('email', errorMessage, 'gallery_paywall');
      toast.error(`Failed to send magic link: ${errorMessage}`);
    }
  };


  const handleAssetClick = (asset: Asset) => {
    if (isAuthenticated) {
      setSelectedAsset(asset);
    } else {
      // Check if this click should trigger the gate
      const shouldGate = gate.shouldGate({ type: 'list', totalCount: assets.length });
      if (shouldGate.gated) {
        showModal();
      } else {
        setSelectedAsset(asset);
      }
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Main Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Visible Assets */}
          {visibleAssets.map((asset) => (
            <div key={asset.id} className="break-inside-avoid">
              <GatedAssetCard
                asset={asset}
                onClick={handleAssetClick}
                showModal={false}
                isBlurred={false}
              />
            </div>
          ))}

          {/* Blurred/Hidden Assets */}
          {!isAuthenticated && hiddenAssets.length > 0 && (
            <div className="col-span-full">
              {/* Inline unlock text */}
              <div className="text-center py-6 mb-6">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Locked — 
                  <button 
                    onClick={showModal}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                  >
                    sign in free to see the rest
                  </button>
                </p>
              </div>
              
              {/* Blurred items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {hiddenAssets.slice(0, 8).map((asset) => (
                  <div key={asset.id} className="break-inside-avoid">
                    <GatedAssetCard
                      asset={asset}
                      isBlurred={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Banner CTA for more gated content */}
        {!isAuthenticated && hiddenAssets.length > 0 && (
          <UnlockCTA
            onClick={showModal}
            variant="banner"
            className="max-w-2xl mx-auto"
          />
        )}

        {/* Empty State */}
        {assets.length === 0 && (
          <div className="text-center py-16 stagger-animation">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No designs found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or search terms to discover more inspiration.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Asset Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={shouldShowModal}
        onClose={hideModal}
        onAuthStart={handleProviderAuth}
        onEmailAuth={handleEmailAuth}
        source="list"
        intendedUrl="/"
      />

      {/* Sticky Unlock Bar */}
      <StickyUnlockBar
        isVisible={showStickyBar}
        onUnlock={showModal}
        totalCount={assets.length}
        freeCount={visibleCount}
      />
    </>
  );
}