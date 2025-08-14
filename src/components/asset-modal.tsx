'use client';

import { Asset } from '@/types/asset';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimplePDFViewer } from './simple-pdf-viewer';

import Image from 'next/image';
import { ExternalLink, Share2 } from 'lucide-react';

interface AssetModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

export function AssetModal({ asset, isOpen, onClose }: AssetModalProps) {
  const isPDF = asset.file_url.toLowerCase().endsWith('.pdf');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: asset.title,
          text: `Check out this ${asset.category} from ${asset.company}`,
          url: window.location.href,
        });
      } catch {
        // Fallback to copying URL
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-2 flex-1">
            <DialogTitle className="text-xl font-bold leading-tight">
              {asset.title}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize">
                {asset.category}
              </Badge>
              {asset.made_by_db && (
                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                  Design Buffs
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                by {asset.company}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Asset Preview */}
        <div className="space-y-4">
          {isPDF ? (
            <SimplePDFViewer url={asset.file_url} title={asset.title} />
          ) : (
            <div className="relative max-h-[60vh] overflow-hidden rounded-lg bg-gray-50">
              <Image
                src={asset.file_url}
                alt={asset.title}
                width={800}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {asset.source_url && (
              <Button
                variant="outline"
                onClick={() => window.open(asset.source_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                See it live
              </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(asset.file_url, '_blank')}
            >
              Open original
            </Button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>Added on {new Date(asset.created_at).toLocaleDateString()}</p>
        
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}