'use client';

import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'nav'; // 'nav' for navigation bar (white text), 'default' for regular use
}

export default function Logo({ className = '', showText = true, size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Text colors based on variant
  const textColors = variant === 'nav' 
    ? 'text-gray-900' // Dark text for nav bar (white background)
    : 'text-farm-green-800'; // Dark green for regular use

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center flex-shrink-0`}>
        <Image
          src="/Agrisight-logo.jpg"
          alt="AgriSight Logo"
          width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} tracking-tight ${textColors}`}>
          Agri<span className="text-emerald-600">Sight</span>
        </span>
      )}
    </div>
  );
}
