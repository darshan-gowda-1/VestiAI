import React, { useMemo, useState } from 'react';
import { Heart, Search, GripVertical, Check, Shirt } from 'lucide-react';
import type { GarmentCategory, Product } from '../../types';
import { Badge } from '../ui/badge';

const CATEGORY_TABS: { value: 'all' | GarmentCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 't-shirt', label: 'T-Shirts' },
  { value: 'shirt', label: 'Shirts' },
  { value: 'sweatshirt', label: 'Sweatshirts' },
  { value: 'blouse', label: 'Blouses' },
];

interface GarmentSidebarProps {
  products: Product[];
  selectedGarmentId: string | null;
  wishlistIds: string[];
  onSelectGarment: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onDragStateChange?: (isDragging: boolean, product?: Product) => void;
}

export const GarmentSidebar: React.FC<GarmentSidebarProps> = ({
  products,
  selectedGarmentId,
  wishlistIds,
  onSelectGarment,
  onToggleWishlist,
  onDragStateChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | GarmentCategory>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch = activeCategory === 'all' || p.category === activeCategory;
      const queryMatch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <aside className="bg-white rounded-2xl border border-canvas-dark/60 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-medium text-charcoal">Garments</h2>
          <p className="text-[11px] text-charcoal-muted">
            Drag onto camera or tap to select
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {filteredProducts.length} items
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-charcoal-light absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tops..."
          aria-label="Search garments"
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-canvas-dark bg-canvas-subtle/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveCategory(tab.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
              activeCategory === tab.value
                ? 'bg-charcoal text-canvas'
                : 'bg-canvas-subtle text-charcoal-muted hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Garment List: Horizontal carousel on mobile, vertical list on desktop */}
      {filteredProducts.length === 0 ? (
        <div className="py-8 text-center text-xs text-charcoal-muted space-y-2">
          <Shirt className="w-6 h-6 mx-auto text-canvas-dark" />
          <p>No matching tops found.</p>
        </div>
      ) : (
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[560px] pb-2 lg:pb-0 lg:pr-1">
          {filteredProducts.map((product) => {
            const isSelected = product.id === selectedGarmentId;
            const isWishlisted = wishlistIds.includes(product.id);
            const isDragging = draggingId === product.id;

            return (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-vestiai-garment', product.id);
                  e.dataTransfer.setData('text/plain', product.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  setDraggingId(product.id);
                  onDragStateChange?.(true, product);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  onDragStateChange?.(false);
                }}
                onClick={() => onSelectGarment(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectGarment(product);
                  }
                }}
                aria-label={`Select ${product.title}`}
                className={`group shrink-0 w-44 lg:w-full rounded-xl border p-2.5 cursor-grab active:cursor-grabbing transition-all flex flex-col lg:flex-row items-center gap-2.5 ${
                  isSelected
                    ? 'border-accent bg-accent-subtle/40 ring-1 ring-accent/40'
                    : 'border-canvas-dark/60 bg-canvas-subtle/30 hover:border-charcoal/40 hover:bg-white'
                } ${isDragging ? 'opacity-50 scale-[0.98]' : ''}`}
              >
                <div className="w-full lg:w-14 h-24 lg:h-16 rounded-lg bg-white border border-canvas-dark/40 overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-charcoal truncate">{product.title}</p>
                    <GripVertical className="w-3.5 h-3.5 text-charcoal-light shrink-0 hidden lg:block" />
                  </div>
                  <p className="text-[11px] text-charcoal-muted truncate">
                    {product.categoryLabel}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-charcoal">${product.price}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      aria-label={isWishlisted ? `Remove ${product.title} from favorites` : `Favorite ${product.title}`}
                      className="p-1 rounded-full hover:bg-canvas-subtle transition-colors"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isWishlisted ? 'fill-accent text-accent' : 'text-charcoal-light'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
