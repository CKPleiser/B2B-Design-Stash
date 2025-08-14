'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Asset, AssetCategory, IndustryTag, DesignStyle } from '@/types/asset';
import { SearchFilters } from '@/components/search-filters';
import { GatedAssetGallery } from '@/components/GatedAssetGallery';
import { StructuredData } from '@/components/structured-data';
import { DesignBuffsLogo } from '@/components/design-buffs-logo';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { getUser, signOut, signInWithProvider, signInWithEmail } from '@/lib/auth';
import { useGate } from '@/hooks/useGate';
import { trackAuthStart, trackAuthSuccess, trackAuthError } from '@/lib/analytics';
import { toast } from 'react-hot-toast';
import type { AuthProvider } from '@/lib/auth';

const SubmissionForm = lazy(() => import('@/components/submission-form').then(module => ({ default: module.SubmissionForm })));
const PaywallModal = lazy(() => import('@/components/PaywallModal').then(module => ({ default: module.PaywallModal })));

export default function Home() {
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryTag | null>(null);
  const [selectedDesignStyles, setSelectedDesignStyles] = useState<DesignStyle[]>([]);
  const [designBuffsOnly, setDesignBuffsOnly] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Gate hook for paywall functionality
  const {
    shouldShowModal,
    showModal,
    hideModal,
  } = useGate({
    type: 'list',
    totalCount: filteredAssets.length,
    enabled: true,
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await getUser();
        setUser(user);
      } catch {
        // Handle auth errors silently - user is just not logged in
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setShowUserMenu(false);
    // Redirect to home page (already here, but refresh to clear state)
    window.location.reload();
  };

  // Fetch assets from API
  useEffect(() => {
    let isCancelled = false;
    
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        if (selectedIndustry) params.append('industry', selectedIndustry);
        if (selectedDesignStyles.length > 0) params.append('design_styles', selectedDesignStyles.join(','));
        if (designBuffsOnly) params.append('made_by_db', 'true');

        const controller = new AbortController();
        const response = await fetch(`/api/assets?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'force-cache',
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (isCancelled) return;
        
        const data = await response.json();
        setFilteredAssets(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Request was cancelled
        }
        console.error('Error fetching assets:', error);
        if (!isCancelled) {
          setFilteredAssets([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    // Debounce search queries
    const debounceTimer = setTimeout(() => {
      fetchAssets();
    }, searchQuery ? 300 : 0);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, selectedCategory, selectedIndustry, selectedDesignStyles, designBuffsOnly]);

  // Auth handlers for paywall modal
  const handleProviderAuth = async (provider: AuthProvider) => {
    trackAuthStart(provider, 'hero_paywall');

    try {
      const { error } = await signInWithProvider(provider);
      
      if (error) {
        console.error('Auth error:', error);
        trackAuthError(provider, error.message, 'hero_paywall');
        toast.error(`Failed to sign in: ${error.message}`);
        return;
      }

      // Success tracking happens in the callback
      // Modal will be automatically dismissed by the useAuth hook
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Provider auth error:', error);
      trackAuthError(provider, errorMessage, 'hero_paywall');
      toast.error(`Authentication failed: ${errorMessage}`);
    }
  };

  const handleEmailAuth = async (email: string) => {
    trackAuthStart('email', 'hero_paywall');

    try {
      const { error } = await signInWithEmail(email);
      
      if (error) {
        console.error('Email auth error:', error);
        trackAuthError('email', error.message, 'hero_paywall');
        toast.error(`Failed to send magic link: ${error.message}`);
        return;
      }

      trackAuthSuccess('email', 'hero_paywall');
      toast.success('Magic link sent! Check your email to sign in.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email auth error:', error);
      trackAuthError('email', errorMessage, 'hero_paywall');
      toast.error(`Failed to send magic link: ${errorMessage}`);
    }
  };

  // Clear all filters function
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedIndustry(null);
    setSelectedDesignStyles([]);
    setDesignBuffsOnly(false);
  };

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-background">
      {/* Header */}
     <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a
            href="https://designbuffs.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Go to Design Buffs website"
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <DesignBuffsLogo size="sm" />
          </a>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="text-sm font-normal"
              onClick={() => setShowSubmissionForm(!showSubmissionForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Get Your Work Featured
            </Button>
            
            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block">{user.email}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>


      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4 text-balance leading-tight text-brand-contrast">
            Get 200+ Proven B2B Design Templates. See What Works. Copy What Converts.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-body">
            Join free to access premium templates and fresh B2B design inspiration.
          </p>
          <div className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto">
            {!user ? (
              // Anonymous users - prominent unlock CTA
              <>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={showModal}
                >
                  🔓 Unlock Full Stash (Free)
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg text-sm"
                  onClick={() => setShowSubmissionForm(true)}
                >
                  Get Your Work Featured
                </Button>
              </>
            ) : (
              // Authenticated users - prominent feature work CTA
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setShowSubmissionForm(true)}
                >
                  ✨ Get Your Work Featured
                </Button>
                <p className="text-lg text-gray-700 font-medium">
                  Share your best work with 5,000+ designers
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8" data-gallery>
        {showSubmissionForm ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-headline font-semibold text-brand-contrast">Submit Your Design</h3>
              <Button
                className="btn-secondary"
                onClick={() => setShowSubmissionForm(false)}
              >
                Back to Gallery
              </Button>
            </div>
            <Suspense fallback={
              <div className="flex items-center justify-center py-16">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              </div>
            }>
              <SubmissionForm />
            </Suspense>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Filters */}
            <SearchFilters
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onIndustryChange={setSelectedIndustry}
              onDesignStyleChange={setSelectedDesignStyles}
              onDesignBuffsToggle={setDesignBuffsOnly}
              onClearAll={handleClearAllFilters}
              searchValue={searchQuery}
              selectedCategory={selectedCategory}
              selectedIndustry={selectedIndustry}
              selectedDesignStyles={selectedDesignStyles}
              designBuffsOnly={designBuffsOnly}
            />

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 stagger-animation">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Loading inspiration...
                </h3>
                <p className="text-gray-500">
                  Discovering the latest B2B design gems for you
                </p>
              </div>
            ) : (
              <ErrorBoundary>
                <GatedAssetGallery assets={filteredAssets} />
              </ErrorBoundary>
            )}
          </div>
        )}
      </main>

      {/* CTA Section - Only show prominently for authenticated users */}
      {!showSubmissionForm && user && (
        <section className="py-16 border-t border-gray-100 bg-green-50">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-3xl font-headline font-semibold mb-4 text-balance text-brand-contrast">
              Got great B2B design work?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto font-body">
              Be seen by top B2B marketers & designers. Add your work to help others get inspired by real work that converts.
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-12 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => setShowSubmissionForm(true)}
            >
              ✨ Get Your Work Featured
            </Button>
            <p className="text-sm text-green-700 mt-3 font-medium">
              You&apos;re signed in! Ready to share your best work?
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <DesignBuffsLogo size="md" />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="https://designbuffs.com" className="text-gray-600 hover:text-primary transition-colors font-body" target="_blank">About Design Buffs</a>
              <a href="mailto:hello@designbuffs.com" className="text-gray-600 hover:text-primary transition-colors font-body">Contact</a>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 font-body">
              © 2024 Design Buffs.
            </p>
          </div>
        </div>
      </footer>
      </div>

      {/* Paywall Modal */}
      {shouldShowModal && (
        <Suspense fallback={<div />}>
          <PaywallModal
            isOpen={shouldShowModal}
            onClose={hideModal}
            onAuthStart={handleProviderAuth}
            onEmailAuth={handleEmailAuth}
            source="list"
            intendedUrl="/"
          />
        </Suspense>
      )}
    </>
  );
}