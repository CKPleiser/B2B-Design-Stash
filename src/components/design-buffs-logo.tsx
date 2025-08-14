'use client';

import Image from 'next/image';

interface DesignBuffsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical';
}

export function DesignBuffsLogo({ 
  className = '', 
  size = 'md', 
  variant = 'horizontal' 
}: DesignBuffsLogoProps) {
  // Brand guideline: clear space = 1x db letter size for horizontal, 2x for vertical
  const sizeClasses = {
    horizontal: {
      sm: 'h-6 w-auto', // ~24px height
      md: 'h-8 w-auto', // ~32px height
      lg: 'h-12 w-auto', // ~48px height
      xl: 'h-16 w-auto', // ~64px height
    },
    vertical: {
      sm: 'h-8 w-auto',
      md: 'h-12 w-auto', 
      lg: 'h-16 w-auto',
      xl: 'h-24 w-auto',
    }
  };

  // Brand guideline: minimum clear space around logo
  const clearSpaceClasses = {
    horizontal: 'p-2', // 1x multiplier
    vertical: 'p-4',   // 2x multiplier
  };

  return (
    <div className={`inline-flex items-center justify-center ${clearSpaceClasses[variant]} ${className}`}>
      <Image
        src="/design-buffs-logo.png"
        alt="Design Buffs"
        width={variant === 'horizontal' ? 200 : 120}
        height={variant === 'horizontal' ? 48 : 80}
        className={`${sizeClasses[variant][size]} object-contain`}
        priority
      />
    </div>
  );
}