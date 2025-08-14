/**
 * PaywallModal - Soft paywall component with authentication options
 * Inspired by adswipefile.com styling: simple, centered modal with clear social buttons
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthProvider } from '@/lib/auth';
import { Loader2, Mail, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FocusTrap } from '@/lib/focus-trap';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: (suppressDuration?: number) => void;
  onAuthStart: (provider: AuthProvider) => Promise<void>;
  onEmailAuth: (email: string) => Promise<void>;
  source: 'list' | 'detail';
  intendedUrl?: string;
  className?: string;
}

export function PaywallModal({
  isOpen,
  onClose,
  onAuthStart,
  onEmailAuth,
  className,
}: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState<AuthProvider | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  const handleProviderAuth = async (provider: AuthProvider) => {
    setIsLoading(provider);
    try {
      await onAuthStart(provider);
    } catch (error) {
      console.error(`Error with ${provider} auth:`, error);
      setIsLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading('email');
    try {
      await onEmailAuth(email);
      setShowEmailForm(false);
      setEmail('');
    } catch (error) {
      console.error('Error with email auth:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Focus trap management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      focusTrapRef.current = new FocusTrap(modalRef.current);
      focusTrapRef.current.activate();

      return () => {
        focusTrapRef.current?.deactivate();
        focusTrapRef.current = null;
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent escape key from closing the modal
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      // Instead, suppress the modal for 30 minutes
      onClose(30 * 60 * 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent 
        ref={modalRef}
        className={cn(
          "max-w-md mx-4 p-8 bg-white rounded-xl shadow-lg border border-slate-200",
          "focus:outline-none",
          className
        )}
        showCloseButton={false}
        onKeyDown={handleKeyDown}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        role="dialog"
        aria-modal="true"
      >
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Get 200+ Proven B2B Design Templates
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-base">
              Join 5,000+ designers. Sign up free to unlock the full stash.
            </DialogDescription>
          </div>

          {/* Auth Options */}
          <div className="space-y-3">
            {false ? ( // Temporarily force auth buttons to show
              /* Supabase not configured - show setup message */
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-['Inter',sans-serif]">
                  Authentication is not configured yet. Please set up Supabase to enable sign-in.
                </p>
                <p className="text-xs text-yellow-600 mt-2 font-['Inter',sans-serif]">
                  See <code>SETUP_QUICK.md</code> for 5-minute setup instructions.
                </p>
              </div>
            ) : !showEmailForm ? (
              <>
                {/* Google Sign In */}
                <Button
                  onClick={() => handleProviderAuth('google')}
                  disabled={!!isLoading}
                  className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                  variant="outline"
                >
                  {isLoading === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* LinkedIn Sign In */}
                <Button
                  onClick={() => handleProviderAuth('linkedin_oidc')}
                  disabled={!!isLoading}
                  className="w-full h-12 bg-[#0077B5] text-white hover:bg-[#006396] font-medium"
                >
                  {isLoading === 'linkedin_oidc' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )}
                  Continue with LinkedIn
                </Button>

                {/* Email Option */}
                <Button
                  onClick={() => setShowEmailForm(true)}
                  disabled={!!isLoading}
                  className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Continue with Email
                </Button>
              </>
            ) : (
              /* Email Form */
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    disabled={!!isLoading}
                    className="flex-1 h-12"
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={!!isLoading || !email.trim()}
                    className="flex-1 h-12 bg-[var(--orange)] text-black hover:bg-[var(--orange-hover)]"
                  >
                    {isLoading === 'email' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    Send Magic Link
                  </Button>
                </div>
              </form>
            )}
          </div>


          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed text-center">
              No spam. One-click sign out anytime.
            </p>
            
            {/* Escape Hatch */}
            <button
              onClick={() => onClose(30 * 60 * 1000)} // Suppress for 30 minutes
              className="mt-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline w-full"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}