import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label,
  size = 'md',
  className,
}) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';

  return (
    <div className={cn('inline-flex items-center gap-2 text-charcoal-muted', className)}>
      <Loader2 className={cn(iconSize, 'animate-spin text-accent')} aria-hidden="true" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
};
