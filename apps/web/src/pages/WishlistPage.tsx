import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/catalog/ProductCard';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const WishlistPage: React.FC = () => {
  const { products, wishlist } = useApp();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-1 border-b border-canvas-dark/60 pb-6">
        <Badge variant="secondary" className="text-xs uppercase tracking-wider mb-1">
          Saved Favorites
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          Your Curated Wishlist ({wishlistedProducts.length})
        </h1>
        <p className="text-sm text-charcoal-muted font-light">
          Upper-body garments you have earmarked for upcoming try-on sessions.
        </p>
      </div>

      {/* Grid or Empty */}
      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-canvas-dark bg-white/70 py-20 px-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-canvas-subtle border border-canvas-dark flex items-center justify-center text-charcoal-light mx-auto">
            <Heart className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-charcoal">Your Wishlist is Empty</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Explore the catalog and tap the heart icon on any shirt, t-shirt, or top to save it here.
            </p>
          </div>
          <Link to="/catalog">
            <Button variant="primary" size="sm" className="text-xs mt-2">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

