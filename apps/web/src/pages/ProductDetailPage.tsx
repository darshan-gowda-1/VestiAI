import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sparkles, Heart, ArrowLeft, ShieldCheck, Info, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ProductCard } from '../components/catalog/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, wishlist, toggleWishlist, setSelectedGarment } = useApp();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id) || products[0];
  const isWishlisted = wishlist.includes(product.id);

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleStartTryOn = () => {
    setSelectedGarment(product);
    navigate(`/tryon?productId=${product.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16">
      {/* Back button */}
      <div>
        <Link
          to="/catalog"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Upper-Body Catalog</span>
        </Link>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Product Image Showcase */}
        <div className="bg-white rounded-3xl border border-canvas-dark/60 p-8 sm:p-12 shadow-sm flex items-center justify-center aspect-[4/5] relative overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-contain max-h-[500px]"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-xs text-xs">
              {product.categoryLabel}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <span className="text-[11px] text-charcoal-light bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-canvas-dark/40 font-mono">
              Flat Studio Scan • Standard 2D Input
            </span>
          </div>
        </div>

        {/* Right: Details & Try-On Action */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                {product.brand}
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-full border transition-all ${
                  isWishlisted
                    ? 'border-accent bg-accent text-white'
                    : 'border-canvas-dark text-charcoal hover:border-charcoal'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
              {product.title}
            </h1>

            <div className="flex items-baseline space-x-2 pt-1">
              <span className="text-2xl font-bold text-charcoal">${product.price}</span>
              <span className="text-xs text-charcoal-light uppercase font-mono">(demo price)</span>
            </div>
          </div>

          <p className="text-sm text-charcoal-muted leading-relaxed font-light">
            {product.description}
          </p>

          {/* Garment Specifications */}
          <div className="grid grid-cols-2 gap-3 py-4 border-y border-canvas-dark/60 text-xs">
            <div>
              <p className="text-charcoal-light uppercase font-semibold text-[10px]">Color</p>
              <p className="font-medium text-charcoal mt-0.5">{product.color}</p>
            </div>
            <div>
              <p className="text-charcoal-light uppercase font-semibold text-[10px]">Material</p>
              <p className="font-medium text-charcoal mt-0.5">{product.material}</p>
            </div>
            <div>
              <p className="text-charcoal-light uppercase font-semibold text-[10px]">Fit Profile</p>
              <p className="font-medium text-charcoal mt-0.5">{product.fit}</p>
            </div>
            <div>
              <p className="text-charcoal-light uppercase font-semibold text-[10px]">Try-On Pipeline</p>
              <p className="font-medium text-emerald-700 mt-0.5 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Compatible 2D Top</span>
              </p>
            </div>
          </div>

          {/* Primary Try-On Action Well */}
          <div className="bg-canvas-subtle rounded-2xl p-6 border border-canvas-dark/60 space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-medium text-charcoal flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Experience on Your Photograph</span>
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-light">
                Visualize how this {product.categoryLabel.toLowerCase()} contours to your torso in realistic lighting before deciding.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleStartTryOn}
              className="w-full shadow-md"
            >
              <span>Try This On in Studio</span>
              <Sparkles className="w-4 h-4 ml-2 text-accent" />
            </Button>

            <div className="flex items-center space-x-2 text-[11px] text-charcoal-light">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Consent required before upload • Your photo remains private</span>
            </div>
          </div>

          {/* Fit Disclaimer */}
          <div className="flex items-start space-x-2 p-3.5 rounded-xl bg-white border border-canvas-dark text-xs text-charcoal-muted">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-charcoal-light">
              <strong>Advisory:</strong> VestiAI provides a 2D aesthetic preview of drape, silhouette, and pattern. It does not provide certified tailoring measurements or size recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-canvas-dark/60 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-medium text-charcoal">
              More in {product.categoryLabel}
            </h3>
            <Link
              to={`/catalog?category=${product.category}`}
              className="text-xs font-medium text-charcoal hover:text-accent"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

