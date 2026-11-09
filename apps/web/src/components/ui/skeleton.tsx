import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-canvas-dark/50', className)}
      {...props}
    />
  );
};
