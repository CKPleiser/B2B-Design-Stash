/**
 * Standalone login page for deep links
 */
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaywallModal } from '@/components/PaywallModal';
import { signInWithProvider, signInWithEmail } from '@/lib/auth';
import { trackAuthStart, trackAuthSuccess, trackAuthError } from '@/lib/analytics';
import { AuthProvider } from '@/lib/auth';
import { toast } from 'react-hot-toast';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const intendedUrl = searchParams.get('redirect') || '/';
  const source = searchParams.get('source') as 'list' | 'detail' || 'detail';
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProviderAuth = async (provider: AuthProvider) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    trackAuthStart(provider, 'login_page');

    try {
      const { error } = await signInWithProvider(provider);
      
      if (error) {
        console.error('Auth error:', error);
        trackAuthError(provider, error.message, 'login_page');
        toast.error(`Failed to sign in with ${provider}: ${error.message}`);
        return;
      }

      // Note: Success tracking happens in the callback route
      // The provider redirect will handle the rest
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Provider auth error:', error);
      trackAuthError(provider, errorMessage, 'login_page');
      toast.error(`Authentication failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailAuth = async (email: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    trackAuthStart('email', 'login_page');

    try {
      const { error } = await signInWithEmail(email);
      
      if (error) {
        console.error('Email auth error:', error);
        trackAuthError('email', error.message, 'login_page');
        toast.error(`Failed to send magic link: ${error.message}`);
        return;
      }

      trackAuthSuccess('email', 'login_page');
      toast.success('Magic link sent! Check your email to sign in.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email auth error:', error);
      trackAuthError('email', errorMessage, 'login_page');
      toast.error(`Failed to send magic link: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Always show the modal as standalone */}
        <PaywallModal
          isOpen={true}
          onClose={() => {
            // Redirect to home instead of closing
            window.location.href = intendedUrl;
          }}
          onAuthStart={handleProviderAuth}
          onEmailAuth={handleEmailAuth}
          source={source}
          intendedUrl={intendedUrl}
          className="relative max-w-none shadow-none bg-white border"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <div className="animate-pulse text-center space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}