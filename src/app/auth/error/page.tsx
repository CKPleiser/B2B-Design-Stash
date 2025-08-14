/**
 * Auth error page
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const description = searchParams.get('description');
  const [errorMessage, setErrorMessage] = useState('An authentication error occurred.');

  useEffect(() => {
    switch (error) {
      case 'callback_failed':
        setErrorMessage('Authentication callback failed. Please try signing in again.');
        break;
      case 'server_error':
        setErrorMessage('A server error occurred during authentication. Please try again.');
        break;
      case 'missing_code':
        setErrorMessage('Invalid authentication request. Please start the sign-in process again.');
        break;
      case 'access_denied':
        setErrorMessage('Authentication was cancelled or access was denied.');
        break;
      default:
        setErrorMessage('An authentication error occurred. Please try again.');
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 font-['Kumbh_Sans',sans-serif] mb-2">
            Authentication Error
          </h2>
          
          <p className="text-gray-600 font-['Inter',sans-serif] mb-4">
            {errorMessage}
          </p>

          {/* Debug info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-xs">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>Error: {error || 'none'}</p>
            {description && <p>Description: {decodeURIComponent(description)}</p>}
            <p className="mt-2 text-blue-600">
              💡 Most likely fix: Add redirect URL to Supabase dashboard
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => window.history.back()}
              className="w-full"
              variant="primary"
            >
              Try Again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="mx-auto h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}