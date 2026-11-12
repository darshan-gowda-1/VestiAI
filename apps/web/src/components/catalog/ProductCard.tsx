import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { wishlist, toggleWishlist, setSelectedGarment } = useApp();
  const navigate = useNavigate();
  const isWishlisted = wishlist.includes(product.id);

  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGarment(product);
    navigate(`/try-on?productId=${product.id}`);
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product.id);
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-canvas-dark/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Garment Image Well */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] bg-canvas-subtle overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-xs text-[11px]">
            {product.categoryLabel}
          </Badge>
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur transition-all ${
            isWishlisted
              ? 'bg-accent text-white shadow-sm'
              : 'bg-white/80 text-charcoal hover:bg-white hover:text-accent shadow-xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Product Information */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-charcoal-light font-medium tracking-wide uppercase">
            {product.brand}
          </p>
          <Link
            to={`/product/${product.id}`}
            className="font-serif text-base font-medium text-charcoal group-hover:text-accent transition-colors line-clamp-1"
          >
            {product.title}
          </Link>
          <p className="text-xs text-charcoal-muted line-clamp-1">{product.color} • {product.fit}</p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-canvas-subtle">
          <div>
            <span className="font-semibold text-charcoal text-base">${product.price}</span>
            <span className="ml-1 text-[10px] text-charcoal-light uppercase font-mono">(demo)</span>
          </div>

          <button
            onClick={handleTryOn}
            className="px-3.5 py-1.5 rounded-full bg-charcoal text-canvas text-xs font-medium hover:bg-charcoal/90 transition shadow-xs flex items-center space-x-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Try On</span>
          </button>
        </div>
      </div>
    </div>
  );
};

