import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  Shirt,
  MousePointerClick,
  Heart,
  Globe,
  Chrome,
} from 'lucide-react';
import { ProductCard } from '../components/catalog/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AnywearHero } from '../components/anywear/AnywearHero';
import { AnywearModal } from '../components/anywear/AnywearModal';

export const HomePage: React.FC = () => {
  const { products } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Auto-open modal if ?try=1 is in URL (matching anywear.decart.ai)
  useEffect(() => {
    if (searchParams.get('try') === '1') {
      setIsDemoModalOpen(true);
      searchParams.delete('try');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-20 pb-24">
      {/* Decart Anywear Signature Split Stage Hero */}
      <AnywearHero
        products={products}
        onOpenDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Decart 3-Step Try-On Demo Modal */}
      <AnywearModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        products={products}
      />

      {/* 3-Step "How It Works" Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="uppercase tracking-wider">Simple 3-Step Flow</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
            How VestiAI Works
          </h2>
          <p className="text-sm text-charcoal-muted leading-relaxed font-light">
            Designed around your live camera and drag-and-drop selection—no 3D body scanners or physical sizing guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              01
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">
              Turn on your camera or upload a photo
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Enable your webcam directly in the browser or upload a front-facing upper-body photograph with explicit consent.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              02
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">
              Choose or drag a garment
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Browse T-shirts, shirts, sweatshirts, and blouses beside your camera and drag any garment onto the try-on stage.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              03
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">
              Generate and view your AI try-on
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Capture your frame, run our 2D diffusion try-on pipeline, compare before and after, and save your favorite looks.
            </p>
          </div>
        </div>
      </section>

      {/* VestiAI 2.0 Core Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-charcoal">AI Virtual Try-On</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Live camera framing paired with real asynchronous 2D diffusion generation.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-charcoal">Explore Fashion</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Searchable store with category filters, price sorting, and retailer links.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-charcoal">Save Favorite Looks</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Keep private saved looks, wishlist items, and full try-on history.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-charcoal">Supported Websites</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Select clothing images on supported shopping sites via the VestiAI Chrome Extension.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Tops Shelf */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-canvas-dark/60">
          <div>
            <Badge variant="accent" className="mb-2">VestiAI Fashion Store</Badge>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
              Featured Upper-Body Styles
            </h2>
          </div>
          <Link
            to="/store"
            className="text-xs font-medium text-charcoal hover:text-accent flex items-center space-x-1"
          >
            <span>Explore Full Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Chrome Extension Promotion Section */}
      <section id="extension" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-charcoal text-canvas p-8 sm:p-12 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/10 text-canvas text-xs font-semibold uppercase tracking-wider">
                <Chrome className="w-3.5 h-3.5 text-accent" />
                <span>VestiAI Chrome Extension (Manifest V3)</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium">
                Try Clothes From Supported Shopping Websites
              </h3>
              <p className="text-xs sm:text-sm text-canvas/75 font-light leading-relaxed">
                Pick a garment image directly from supported external product pages, send it to your VestiAI workspace, and preview it on yourself without leaving your shopping flow. Built with strict minimal permissions and honest 2D visual previews.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/try-on">
                <Button variant="accent" size="lg">
                  <span>Open Live Try-On</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/privacy">
                <Button variant="secondary" size="lg">
                  <span>Extension Privacy</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
