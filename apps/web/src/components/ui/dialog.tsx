import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className={cn(
          'relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-canvas-dark z-10 transition-all transform duration-200',
          className
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-6 top-6 rounded-full p-1.5 text-charcoal-muted hover:bg-canvas-subtle hover:text-charcoal transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {title && (
          <h2 id="dialog-title" className="font-serif text-2xl font-medium text-charcoal pr-8">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1.5 text-sm text-charcoal-muted leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

