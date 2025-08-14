/**
 * UnlockCTA - Reusable call-to-action for triggering the paywall modal
 */
'use client';

import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlockCTAProps {
  onClick: () => void;
  variant?: 'inline' | 'overlay' | 'banner';
  className?: string;
  disabled?: boolean;
}

export function UnlockCTA({ 
  onClick, 
  variant = 'inline', 
  className, 
  disabled = false 
}: UnlockCTAProps) {
  if (variant === 'overlay') {
    return (
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent",
          "flex items-center justify-center backdrop-blur-[2px]",
          "transition-all duration-300",
          className
        )}
      >
        <Button
          onClick={onClick}
          disabled={disabled}
          className="bg-[var(--orange)] text-black hover:bg-[var(--orange-hover)] shadow-lg"
          size="lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          Unlock Full Stash
        </Button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div 
        className={cn(
          "bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-300 rounded-xl p-8 text-center shadow-lg",
          className
        )}
      >
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-slate-900">
            More designs await
          </span>
        </div>
        <p className="text-slate-700 mb-6 text-lg leading-relaxed max-w-lg mx-auto">
          Sign in free to see all templates and resources in the stash.
        </p>
        <Button
          onClick={onClick}
          disabled={disabled}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Lock className="h-5 w-5 mr-2" />
          Unlock Full Access
        </Button>
      </div>
    );
  }

  // Default inline variant
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-[var(--orange)] text-black hover:bg-[var(--orange-hover)]",
        className
      )}
      variant="nav"
    >
      <Lock className="h-4 w-4 mr-2" />
      Unlock Full Stash
    </Button>
  );
}