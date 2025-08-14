/**
 * PreviewDrawer - Right-side drawer for asset preview and progressive gating
 */
'use client';

import { Asset } from '@/types/asset';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SimplePDFViewer } from './simple-pdf-viewer';

interface PreviewDrawerProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export function PreviewDrawer({ 
  asset, 
  isOpen, 
  onClose, 
  onSignup 
}: PreviewDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isFirstUse, setIsFirstUse] = useState(false);

  // Check if this is the user's first preview
  useEffect(() => {
    const firstUse = !localStorage.getItem('db_firstPreviewUsed');
    setIsFirstUse(firstUse);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when drawer opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 350); // After animation completes
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleSignupClick = () => {
    onSignup();
    onClose();
  };


  if (!asset) return null;

  const isPDF = asset.file_url.toLowerCase().includes('.pdf');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-[420px] lg:w-[480px]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 
            id="drawer-title" 
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {isFirstUse ? 'Free Preview' : 'Design Preview'}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isFirstUse ? (
            // First use - show actual content
            <>
              {/* Free preview banner */}
              <div className="px-6 py-3 bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  ✨ Free preview unlocked
                </p>
              </div>

              {/* Asset preview */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {asset.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{asset.company}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {asset.category}
                    </Badge>
                  </div>
                </div>

                {/* Image/PDF viewer */}
                <div className="mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {isPDF ? (
                    <SimplePDFViewer url={asset.file_url} title={asset.title} />
                  ) : (
                    <div className="aspect-video relative">
                      <Image
                        src={asset.file_url}
                        alt={asset.title}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    </div>
                  )}
                </div>

                {/* Meta info */}
                <div className="space-y-3">
                  {asset.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 6).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <Button
                  onClick={handleSignupClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  Unlock Full Stash
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                  Get access to 200+ proven B2B designs
                </p>
              </div>
            </>
          ) : (
            // Subsequent uses - show signup pitch
            <div className="p-6 flex flex-col h-full">
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Unlock 200+ proven B2B design examples
                  </h3>
                  
                  <ul className="space-y-3 text-left max-w-sm mx-auto">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">Filter by channel & industry</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">See what actually converts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">Save to collections</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleSignupClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  >
                    Create free account
                  </Button>
                  <button
                    onClick={onClose}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm underline"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}