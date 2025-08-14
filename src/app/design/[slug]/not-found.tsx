import Link from 'next/link';
import { DesignBuffsLogo } from '@/components/design-buffs-logo';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';

export default function DesignNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <DesignBuffsLogo size="sm" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Design Not Found
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Sorry, we couldn&apos;t find the design you&apos;re looking for. It might have been removed, 
            or the link might be incorrect.
          </p>

          <div className="space-y-4">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500">
              Or browse our collection of B2B design inspiration
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Design Buffs. Curating the best in B2B design.
          </p>
        </div>
      </footer>
    </div>
  );
}