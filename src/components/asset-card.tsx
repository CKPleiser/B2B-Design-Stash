'use client';

import { Asset } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, Eye, Sparkles } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  onClick?: (asset: Asset) => void; // Make onClick optional for new link-based approach
  showModal?: boolean; // Control whether to show modal or navigate to page
}

export function AssetCard({ asset, onClick, showModal = false }: AssetCardProps) {
  const isPDF = asset.file_url.toLowerCase().endsWith('.pdf');

  const handleClick = () => {
    if (showModal && onClick) {
      onClick(asset);
    }
    // If showModal is false, the Link will handle navigation
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (showModal) {
      return (
        <div onClick={handleClick}>
          {children}
        </div>
      );
    }

    return (
      <Link href={`/design/${asset.slug}`}>
        {children}
      </Link>
    );
  };

  return (
    <CardWrapper>
      <Card className="design-card group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
        <CardContent className="p-0">
          {/* Image Section with Gradient Overlay */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 w-full h-56 overflow-hidden">
            {isPDF ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="bg-white rounded-full p-4 shadow-md mb-2">
                    <FileText className="h-8 w-8 text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">PDF Document</span>
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={asset.file_url}
                  alt={asset.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <div class="text-center">
                            <div class="bg-white rounded-full p-4 shadow-md mb-2">
                              <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p class="text-xs text-gray-500">Image unavailable</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
                {/* Gradient Overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
            

            {/* Bottom info overlay - Only shows company on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm font-semibold truncate">{asset.company}</p>
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0 backdrop-blur-sm mt-1">
                {asset.category}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                  {asset.title}
                </h3>
                <p className="text-sm text-gray-600">{asset.company}</p>
              </div>

              {/* Tags with better styling */}
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 3 && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                      +{asset.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* View count at bottom - always show the stats bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{(asset.view_count || 0).toLocaleString()}</span>
                </div>
                {asset.made_by_db && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Curated</span>
                  </div>
                )}
              </div>
              {asset.view_count && asset.view_count > 100 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Trending
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}