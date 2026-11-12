import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = false,
}) => {
  const iconBox =
    size === 'sm' ? 'w-7 h-7 rounded-md' : size === 'lg' ? 'w-11 h-11 rounded-xl' : 'w-9 h-9 rounded-lg';
  const textSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const bgClass = variant === 'light' ? 'bg-canvas text-charcoal' : 'bg-charcoal text-canvas';
  const wordClass = variant === 'light' ? 'text-canvas' : 'text-charcoal';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${iconBox} ${bgClass} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4a2 2 0 1 1 2 2c0 .7-.4 1.3-1 1.7L12 8.5" />
          <path d="M12 8.5 4.5 14.2a1.4 1.4 0 0 0 .8 2.5h13.4a1.4 1.4 0 0 0 .8-2.5L12 8.5Z" />
        </svg>
      </div>
      <div className="leading-none">
        <span className={`font-serif ${textSize} font-bold tracking-tight ${wordClass}`}>
          Vesti<span className="text-accent">AI</span>
        </span>
        {showTagline && (
          <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal-light mt-0.5">
            Live Virtual Try-On
          </p>
        )}
      </div>
    </div>
  );
};

