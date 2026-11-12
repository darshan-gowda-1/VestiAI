import React, { useState } from 'react';
import { Shirt, AlertTriangle } from 'lucide-react';
import type { Product } from '../../types';

interface DropTargetStageProps {
  products: Product[];
  onGarmentDropped: (product: Product) => void;
  children: React.ReactNode;
}

export const DropTargetStage: React.FC<DropTargetStageProps> = ({
  products,
  onGarmentDropped,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [invalidDropMessage, setInvalidDropMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const garmentId =
      e.dataTransfer.getData('application/x-vestiai-garment') ||
      e.dataTransfer.getData('text/plain');

    const matched = products.find((p) => p.id === garmentId);
    if (!matched) {
      setInvalidDropMessage('Drop a garment card from the catalog panel to select it.');
      window.setTimeout(() => setInvalidDropMessage(null), 3000);
      return;
    }

    setInvalidDropMessage(null);
    onGarmentDropped(matched);
  };

  return (
    <div
      data-testid="garment-drop-target"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl transition-all ${
        isDragOver ? 'ring-2 ring-accent ring-offset-2 bg-accent-subtle/20' : ''
      }`}
    >
      {children}

      {isDragOver && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-charcoal/55 backdrop-blur-[2px] border-2 border-dashed border-accent flex flex-col items-center justify-center text-center p-6 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center mb-3 shadow-lg">
            <Shirt className="w-6 h-6" />
          </div>
          <p className="font-serif text-lg font-medium text-white">
            Drop Garment to Select
          </p>
          <p className="text-xs text-white/80 mt-1 max-w-xs">
            Selects this top for 2D AI try-on synthesis once you capture or upload your photo.
          </p>
        </div>
      )}

      {invalidDropMessage && (
        <div
          role="alert"
          className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{invalidDropMessage}</span>
        </div>
      )}
    </div>
  );
};
