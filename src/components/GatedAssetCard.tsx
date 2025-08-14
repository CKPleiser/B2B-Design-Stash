/**
 * GatedAssetCard - Asset card with simple blur and lock indicator
 */
'use client';

import { Asset } from '@/types/asset';
import { AssetCard } from './asset-card';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface GatedAssetCardProps {
  asset: Asset;
  onClick?: (asset: Asset) => void;
  showModal?: boolean;
  isBlurred?: boolean;
  className?: string;
}

export function GatedAssetCard({
  asset,
  onClick,
  showModal = false,
  isBlurred = false,
  className,
}: GatedAssetCardProps) {
  if (!isBlurred) {
    return (
      <AssetCard 
        asset={asset} 
        onClick={onClick} 
        showModal={showModal}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred Asset Card */}
      <div className="blur-[6px] pointer-events-none select-none">
        <AssetCard 
          asset={asset} 
          onClick={undefined} 
          showModal={false}
        />
      </div>
      
      {/* Lock Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white/90 dark:bg-slate-800/90 rounded-full p-3 shadow-sm">
          <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
    </div>
  );
}