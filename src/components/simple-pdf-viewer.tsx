'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, FileText } from 'lucide-react';

interface SimplePDFViewerProps {
  url: string;
  title?: string;
}

export function SimplePDFViewer({ url, title }: SimplePDFViewerProps) {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">PDF Document</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = title || 'document.pdf';
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Embedded PDF iframe or fallback */}
      <div className="relative bg-gray-50 rounded-lg overflow-hidden">
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <FileText className="h-16 w-16 text-gray-400" />
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                PDF preview not available
              </p>
              <p className="text-sm text-gray-500">
                Click &ldquo;Open PDF&rdquo; to view the document
              </p>
            </div>
          </div>
        ) : (
          <iframe
            src={url}
            className="w-full h-96 border-0"
            title={title || 'PDF Document'}
            loading="lazy"
            onError={() => {
              console.error('Failed to load PDF in iframe:', url);
              setIframeError(true);
            }}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {iframeError 
          ? "PDF preview failed to load. Use the buttons above to view or download the document."
          : "If the PDF doesn't display correctly, try opening it in a new tab or downloading it."
        }
      </p>
    </div>
  );
}