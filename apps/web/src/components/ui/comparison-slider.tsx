import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronsLeftRight } from 'lucide-react';

export interface ComparisonSliderProps {
  originalImage: string;
  resultImage: string;
  originalLabel?: string;
  resultLabel?: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalImage,
  resultImage,
  originalLabel = 'Original Photo',
  resultLabel = 'AI Try-On Result',
  className,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);
  const onTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-2xl select-none shadow-lg border border-canvas-dark bg-canvas-subtle aspect-[3/4] cursor-ew-resize',
        className
      )}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* Result / After Image (Underneath) */}
      <img
        src={resultImage}
        alt={resultLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-charcoal/80 backdrop-blur text-canvas text-xs font-medium tracking-wide">
        {resultLabel}
      </div>

      {/* Original / Before Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalImage}
          alt={originalLabel}
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          draggable={false}
        />
        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-charcoal/80 backdrop-blur text-canvas text-xs font-medium tracking-wide">
          {originalLabel}
        </div>
      </div>

      {/* Divider Bar */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center text-charcoal border border-canvas-dark/60 cursor-grab active:cursor-grabbing">
          <ChevronsLeftRight className="w-4 h-4 text-charcoal" />
        </div>
      </div>
    </div>
  );
};

