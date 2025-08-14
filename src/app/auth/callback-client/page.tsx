/**
 * Client-side auth callback handler for magic links
 * Magic links put tokens in URL fragment which the server can't access
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackClientPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== CLIENT AUTH CALLBACK ===');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);

        // Supabase will automatically handle the tokens from the URL fragment
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError(error.message);
          setStatus('error');
          return;
        }

        if (data.session) {
          console.log('✅ Magic link auth successful!', data.session.user?.email);
          setStatus('success');
          
          // Redirect to success page after a brief moment
          setTimeout(() => {
            window.location.href = '/auth/success';
          }, 1000);
        } else {
          console.log('No session found, checking for auth event...');
          
          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              console.log('Auth state change:', event, session?.user?.email);
              
              if (event === 'SIGNED_IN' && session) {
                console.log('✅ Auth successful via state change!');
                setStatus('success');
                
                // Clean up subscription
                subscription.unsubscribe();
                
                // Redirect to success page
                setTimeout(() => {
                  window.location.href = '/auth/success';
                }, 1000);
              } else if (event === 'SIGNED_OUT') {
                setError('Authentication failed or was cancelled');
                setStatus('error');
                subscription.unsubscribe();
              }
            }
          );

          // If no auth event in 5 seconds, show error
          setTimeout(() => {
            if (status === 'loading') {
              setError('Authentication timeout - no session found');
              setStatus('error');
              subscription.unsubscribe();
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing authentication...
          </h2>
          <p className="text-gray-600">
            Processing your magic link
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="h-4 w-4 bg-green-600 rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication successful!
          </h2>
          <p className="text-gray-600">
            Redirecting you now...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="h-4 w-4 bg-red-600 rounded-full"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication failed
        </h2>
        <p className="text-gray-600 mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}