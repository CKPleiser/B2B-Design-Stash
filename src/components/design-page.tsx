'use client';

import { Asset, SwipeNeighbor } from '@/types/asset';
import { DesignBuffsLogo } from '@/components/design-buffs-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimplePDFViewer } from './simple-pdf-viewer';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  Calendar, 
  Tag, 
  Building2, 
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUser, signOut } from '@/lib/auth';

interface DesignPageProps {
  asset: Asset;
  prevSwipe?: SwipeNeighbor | null;
  nextSwipe?: SwipeNeighbor | null;
  recommendations?: Asset[];
}

// TagChip Component
interface TagChipProps {
  tag: string;
  href: string;
}

function TagChip({ tag, href }: TagChipProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label={`Filter by ${tag} tag`}
    >
      {tag}
    </Link>
  );
}


// RecommendationCard Component
interface RecommendationCardProps {
  asset: Asset;
}

function RecommendationCard({ asset }: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <Link
      href={`/design/${asset.slug}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      <div className="bg-white rounded-lg border hover:shadow-md transition-shadow">
        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          )}
          {imageError ? (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <div className="text-center">
                <svg className="h-8 w-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          ) : (
            <Image
              src={asset.file_url}
              alt={`${asset.title} by ${asset.company}`}
              width={300}
              height={200}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              unoptimized={true}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm text-gray-900 truncate">{asset.title}</h3>
          <p className="text-xs text-gray-600 truncate mt-1">{asset.company}</p>
        </div>
      </div>
    </Link>
  );
}

export function DesignPageComponent({ asset, prevSwipe, nextSwipe, recommendations = [] }: DesignPageProps) {
  const [shareSuccess, setShareSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isPDF = asset.file_url.toLowerCase().includes('.pdf');

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
    // Redirect to home page
    window.location.href = '/';
  };
  
  // Prepare display data with fallbacks
  const brandName = asset.brandName || asset.company;
  const industry = asset.industry || asset.industry_tags?.replace('_', ' ');
  const dateAdded = asset.dateAdded || asset.created_at;
  const imageUrl = asset.imageUrl || asset.file_url;
  
  // Convert tags to chip format
  const tagChips = asset.tags.map((tag, index) => ({
    id: index.toString(),
    name: tag,
    slug: tag.toLowerCase().replace(/\s+/g, '-')
  }));

  const handleShare = async () => {
    // Always copy to clipboard first
    await copyToClipboard();
    
    // Then try native share if available (but don't wait for it)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${asset.title} - B2B Design Stash`,
          text: `Check out this ${asset.category} design from ${brandName}`,
          url: window.location.href,
        });
      } catch {
        // Ignore errors - clipboard copy already succeeded
        console.log('Native share cancelled or failed, but link is already copied');
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageError = () => {
    console.warn('Image failed to load:', imageUrl);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const breadcrumbs = [
    { label: 'Home', href: '/', id: 'home' },
    { label: 'Design Gallery', href: '/', id: 'gallery' },
    { label: asset.title, href: `/design/${asset.slug}`, id: 'design' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <DesignBuffsLogo size="sm" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Gallery
                </Button>
              </Link>
              
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

      {/* Breadcrumbs */}
      <nav className="bg-gray-50 py-3">
        <div className="container mx-auto px-6">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.id} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-600 font-medium truncate max-w-xs">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="lg:grid lg:grid-cols-[1fr,400px] lg:gap-8">
          {/* Design Preview - Horizontal Layout */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="md:flex md:h-[600px]">
              {/* Image Section */}
              <div className="md:w-2/3 bg-gray-50 h-[400px] md:h-full flex items-center justify-center">
                {isPDF ? (
                  <SimplePDFViewer url={asset.file_url} title={asset.title} />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-pulse">
                          <div className="h-12 w-12 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    )}
                    {imageError ? (
                      <div className="flex items-center justify-center bg-gray-100 text-gray-400 w-full h-full">
                        <div className="text-center p-8">
                          <svg className="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Image unavailable</p>
                          <p className="text-xs text-gray-400 mt-1">The image could not be loaded</p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={imageUrl}
                        alt={`${asset.title} - ${asset.category} design by ${brandName}`}
                        width={800}
                        height={600}
                        className="max-w-full max-h-full object-contain p-4"
                        priority
                        unoptimized={true}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Info Section */}
              <div className="md:w-1/3 p-6 flex flex-col justify-between">
                {/* Top Info */}
                <div className="space-y-4">
                  <div>
                    {asset.brandLogoUrl && (
                      <div className="mb-3">
                        <Image
                          src={asset.brandLogoUrl}
                          alt={`${brandName} logo`}
                          width={40}
                          height={40}
                          className="rounded-lg"
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <h2 className="text-lg font-semibold text-gray-900">{brandName}</h2>
                      {asset.made_by_db && (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-xs">
                          Design Buffs
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                      {asset.title}
                    </h1>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <Badge variant="secondary" className="capitalize font-medium">
                      {asset.category}
                    </Badge>
                  </div>

                  {/* Industry */}
                  {industry && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <Badge variant="outline" className="capitalize">
                        {industry}
                      </Badge>
                    </div>
                  )}

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {tagChips.slice(0, 4).map((tag) => (
                          <TagChip
                            key={tag.id}
                            tag={tag.name}
                            href={`/?tag=${tag.slug}`}
                          />
                        ))}
                        {asset.tags.length > 4 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            +{asset.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date Added */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Added on {formatDate(dateAdded)}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-3 mt-6">
                  {asset.source_url && (
                    <Button
                      className="w-full inline-flex items-center justify-center rounded-lg px-4 py-3 font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => window.open(asset.source_url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Source
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 font-medium border focus:outline-none focus:ring-2 transition-all duration-200 ${
                      shareSuccess 
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-50' 
                        : 'hover:bg-gray-50 focus:ring-gray-300'
                    }`}
                    onClick={handleShare}
                  >
                    {shareSuccess ? (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Details */}
          <div className="lg:sticky lg:top-24 space-y-6 mt-6 lg:mt-0">
            {/* Additional Tags if more than 4 */}
            {asset.tags.length > 4 && (
              <div className="rounded-2xl border p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  All Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tagChips.map((tag) => (
                    <TagChip
                      key={tag.id}
                      tag={tag.name}
                      href={`/?tag=${tag.slug}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Curator's Notes Section - Full width below main content */}
        {asset.notes && (
          <div className="mt-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Curator&apos;s Notes</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                {asset.notes}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Prev/Next Navigation */}
      {(prevSwipe || nextSwipe) && (
        <nav className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            {prevSwipe ? (
              <Link
                href={`/design/${prevSwipe.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label={`Previous: ${prevSwipe.title}`}
              >
                <ChevronLeft className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Previous</div>
                  <div className="font-medium text-gray-900 truncate max-w-xs">{prevSwipe.title}</div>
                </div>
              </Link>
            ) : (
              <div></div>
            )}
            
            {nextSwipe ? (
              <Link
                href={`/design/${nextSwipe.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label={`Next: ${nextSwipe.title}`}
              >
                <div className="text-right">
                  <div className="text-xs text-gray-500">Next</div>
                  <div className="font-medium text-gray-900 truncate max-w-xs">{nextSwipe.title}</div>
                </div>
                <ChevronRight className="h-5 w-5" />
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </nav>
      )}

      {/* Recommendations Section - Swipeable */}
      {recommendations.length > 0 && (
        <section className="bg-gray-50 py-16 mt-12">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                More {asset.category} designs
              </h2>
              <p className="text-gray-600">
                Swipe to explore similar designs from this category
              </p>
            </div>
            
            {/* Horizontal Scrollable Container */}
            <div className="relative max-w-6xl mx-auto">
              <div className="flex overflow-x-auto scrollbar-hide gap-6 pb-4 snap-x snap-mandatory">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="flex-none w-72 snap-start">
                    <RecommendationCard asset={recommendation} />
                  </div>
                ))}
                {/* Add some padding at the end */}
                <div className="flex-none w-6"></div>
              </div>
              
              {/* Scroll indicators */}
              <div className="flex justify-center mt-4 space-x-2">
                {recommendations.map((_, index) => (
                  <div key={index} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}