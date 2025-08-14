/**
 * GatedDesignPage - Design page wrapper with detail view gating
 */
'use client';

import { useEffect } from 'react';
import { Asset, SwipeNeighbor } from '@/types/asset';
import { DesignPageComponent } from './design-page';
import { PaywallModal } from './PaywallModal';
import { UnlockCTA } from './UnlockCTA';
import { useGate } from '@/hooks/useGate';
import { useAuth } from '@/hooks/useAuth';
import { signInWithProvider, signInWithEmail } from '@/lib/auth';
import { trackAuthStart, trackAuthSuccess, trackAuthError, trackStashView } from '@/lib/analytics';
import { AuthProvider } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { DesignBuffsLogo } from './design-buffs-logo';
import { ArrowLeft, Lock } from 'lucide-react';

interface GatedDesignPageProps {
  asset: Asset;
  prevSwipe: SwipeNeighbor | null;
  nextSwipe: SwipeNeighbor | null;
  recommendations: Asset[];
}

export function GatedDesignPage({ 
  asset, 
  prevSwipe, 
  nextSwipe, 
  recommendations 
}: GatedDesignPageProps) {
  const { isAuthenticated } = useAuth();
  
  const {
    shouldShowModal,
    showModal,
    hideModal,
    recordView,
    gateResult,
  } = useGate({
    type: 'detail',
    enabled: true,
  });

  // Check if user should see this page or be gated
  useEffect(() => {
    if (!isAuthenticated) {
      recordView();
      trackStashView('detail', asset.id, asset.category);
    }
  }, [isAuthenticated, recordView, asset.id, asset.category, gateResult]);

  const handleProviderAuth = async (provider: AuthProvider) => {
    trackAuthStart(provider, 'detail_paywall');

    try {
      const { error } = await signInWithProvider(provider);
      
      if (error) {
        console.error('Auth error:', error);
        trackAuthError(provider, error.message, 'detail_paywall');
        toast.error(`Failed to sign in: ${error.message}`);
        return;
      }

      // Success tracking happens in the callback
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Provider auth error:', error);
      trackAuthError(provider, errorMessage, 'detail_paywall');
      toast.error(`Authentication failed: ${errorMessage}`);
    }
  };

  const handleEmailAuth = async (email: string) => {
    trackAuthStart('email', 'detail_paywall');

    try {
      const { error } = await signInWithEmail(email);
      
      if (error) {
        console.error('Email auth error:', error);
        trackAuthError('email', error.message, 'detail_paywall');
        toast.error(`Failed to send magic link: ${error.message}`);
        return;
      }

      trackAuthSuccess('email', 'detail_paywall');
      toast.success('Magic link sent! Check your email to sign in.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email auth error:', error);
      trackAuthError('email', errorMessage, 'detail_paywall');
      toast.error(`Failed to send magic link: ${errorMessage}`);
    }
  };

  // If authenticated or gate allows, show full content
  if (isAuthenticated || !gateResult?.gated) {
    return (
      <DesignPageComponent 
        asset={asset}
        prevSwipe={prevSwipe}
        nextSwipe={nextSwipe}
        recommendations={recommendations}
      />
    );
  }

  // Show teaser/gated version
  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <DesignBuffsLogo size="sm" />
              </div>
              <UnlockCTA onClick={showModal} variant="inline" />
            </div>
          </div>
        </header>

        {/* Teaser Content */}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Asset Preview (blurred) */}
            <div className="relative mb-8">
              <div className="blur-sm pointer-events-none select-none">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.file_url}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              
              {/* Center overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2 font-['Kumbh_Sans',sans-serif]">
                    Sign In to View Full Design
                  </h2>
                  <p className="text-gray-600 mb-6 font-['Inter',sans-serif]">
                    Get free access to view this design in full resolution plus thousands more.
                  </p>
                  <UnlockCTA 
                    onClick={showModal} 
                    variant="inline"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Asset Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 font-['Kumbh_Sans',sans-serif]">
                  {asset.title}
                </h1>
                <p className="text-xl text-gray-600 font-['Inter',sans-serif]">
                  by {asset.company}
                </p>
              </div>

              {/* Tags preview */}
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asset.tags.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 5 && (
                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                      +{asset.tags.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* CTA Banner */}
              <UnlockCTA 
                onClick={showModal}
                variant="banner"
                className="max-w-2xl mx-auto"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={shouldShowModal}
        onClose={hideModal}
        onAuthStart={handleProviderAuth}
        onEmailAuth={handleEmailAuth}
        source="detail"
        intendedUrl={`/design/${asset.slug}`}
      />
    </>
  );
}