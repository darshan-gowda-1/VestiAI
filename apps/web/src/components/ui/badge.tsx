import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-charcoal text-canvas',
    secondary: 'bg-canvas-subtle text-charcoal border border-canvas-dark/40',
    accent: 'bg-accent-subtle text-accent border border-accent/20 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    outline: 'border border-charcoal/20 text-charcoal',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
