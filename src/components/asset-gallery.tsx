'use client';

import { useState } from 'react';
import { Asset } from '@/types/asset';
import { AssetCard } from './asset-card';
import { AssetModal } from './asset-modal';

interface AssetGalleryProps {
  assets: Asset[];
}

export function AssetGallery({ assets }: AssetGalleryProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="break-inside-avoid">
            <AssetCard
              asset={asset}
              onClick={setSelectedAsset}
            />
          </div>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center py-16 stagger-animation">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No designs found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search terms to discover more inspiration.
            </p>
          </div>
        </div>
      )}

      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}