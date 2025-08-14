/**
 * Auth success page - shows when authentication completes successfully
 */
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

export default function AuthSuccessPage() {
  useEffect(() => {
    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 font-['Kumbh_Sans',sans-serif] mb-2">
            Welcome to Stash!
          </h2>
          
          <p className="text-gray-600 font-['Inter',sans-serif] mb-6">
            You&apos;ve been successfully authenticated. You now have full access to all designs and resources.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              ✨ You can now view all designs without limits!
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Explore the Stash
            </Button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}