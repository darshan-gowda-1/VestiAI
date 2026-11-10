import React, { useState } from 'react';
import { Product, GarmentCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { Dialog } from '../ui/dialog';
import { Search } from 'lucide-react';
import { Badge } from '../ui/badge';

interface GarmentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export const GarmentSelectorModal: React.FC<GarmentSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { products, selectedGarment } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');

  const categories: { label: string; value: GarmentCategory | 'all' }[] = [
    { label: 'All Tops', value: 'all' },
    { label: 'T-Shirts', value: 't-shirt' },
    { label: 'Shirts', value: 'shirt' },
    { label: 'Sweatshirts', value: 'sweatshirt' },
    { label: 'Blouses', value: 'blouse' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.color.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Garment for Try-On"
      description="Select any upper-body top from our catalog to synthesize onto your photo."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by garment title, style, or color..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-canvas-dark text-sm bg-canvas-subtle/50 focus:outline-none focus:border-charcoal focus:bg-white"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-charcoal text-canvas shadow-xs'
                  : 'bg-canvas-subtle text-charcoal-muted hover:text-charcoal border border-canvas-dark/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const isSelected = selectedGarment?.id === product.id;
            return (
              <div
                key={product.id}
                onClick={() => {
                  onSelect(product);
                  onClose();
                }}
                className={`group cursor-pointer rounded-xl border p-3 transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 bg-accent-subtle/20'
                    : 'border-canvas-dark hover:border-charcoal/40 bg-white'
                }`}
              >
                <div className="aspect-[4/5] bg-canvas-subtle rounded-lg overflow-hidden mb-2 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge variant="accent" className="text-[9px] px-1.5 py-0.2">
                        Active
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="font-serif text-xs font-medium text-charcoal line-clamp-1">
                    {product.title}
                  </p>
                  <p className="text-[11px] text-charcoal-light line-clamp-1">
                    {product.color} • ${product.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
};
