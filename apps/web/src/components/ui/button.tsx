import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';
    
    const variants = {
      primary: 'bg-charcoal text-canvas hover:bg-charcoal/90 focus:ring-charcoal shadow-sm active:scale-[0.98]',
      secondary: 'bg-canvas-subtle text-charcoal hover:bg-canvas-dark border border-canvas-dark/60 focus:ring-charcoal active:scale-[0.98]',
      accent: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent shadow-sm active:scale-[0.98]',
      outline: 'bg-transparent text-charcoal border border-charcoal/30 hover:border-charcoal hover:bg-charcoal/5 focus:ring-charcoal active:scale-[0.98]',
      ghost: 'bg-transparent text-charcoal hover:bg-canvas-subtle focus:ring-charcoal',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
