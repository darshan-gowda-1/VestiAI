import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Shirt,
  Camera,
  MousePointerClick,
  Heart,
  Globe,
  Chrome,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { ProductCard } from '../components/catalog/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const HomePage: React.FC = () => {
  const { products } = useApp();
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Narrative */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-accent-subtle text-accent text-xs font-semibold tracking-wide border border-accent/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VestiAI 2.0 • Live Camera &amp; 2D AI Virtual Try-On</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-charcoal leading-[1.12]">
                Try Any Look. <br className="hidden sm:inline" />
                <span className="italic font-normal text-accent">Before You Buy.</span>
              </h1>

              <p className="text-base sm:text-lg text-charcoal-muted max-w-xl font-light leading-relaxed mx-auto lg:mx-0">
                Explore fashion, see how it looks on you, and discover your next favorite outfit with AI-powered virtual try-on.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                <Link to="/try-on">
                  <Button variant="primary" size="lg" className="shadow-md">
                    <Camera className="w-4 h-4 mr-1.5" />
                    <span>Start Virtual Try-On</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/store">
                  <Button variant="secondary" size="lg">
                    <Shirt className="w-4 h-4 mr-1.5" />
                    <span>Explore Styles</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-charcoal-muted">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>User-controlled camera</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-canvas-dark" />
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Consent-first processing</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-canvas-dark" />
                <div className="flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-accent shrink-0" />
                  <span>Before &amp; After comparison</span>
                </div>
              </div>
            </div>

            {/* Right Product Demonstration Card */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-canvas-dark/60 relative overflow-hidden space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-canvas-subtle">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                      Live Camera + Drag-and-Drop
                    </span>
                  </div>
                  <Badge variant="accent" className="font-mono text-[10px]">2D AI Studio</Badge>
                </div>

                {/* 3-Panel Demonstration: Person -> Garment -> Generated Result */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-canvas-subtle rounded-2xl p-3 text-center space-y-2 border border-canvas-dark/40">
                    <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden flex flex-col items-center justify-center p-2 gap-2">
                      <Camera className="w-7 h-7 text-charcoal-muted" />
                      <span className="text-[10px] text-charcoal-light">Webcam / Photo</span>
                    </div>
                    <p className="text-xs font-medium text-charcoal">1. Person</p>
                  </div>

                  <div className="bg-canvas-subtle rounded-2xl p-3 text-center space-y-2 border border-canvas-dark/40">
                    <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
                      {products[0]?.imageUrl ? (
                        <img
                          src={products[0].imageUrl}
                          alt={products[0].title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Shirt className="w-8 h-8 text-canvas-dark" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-charcoal truncate">
                      {products[0]?.title || '2. Garment'}
                    </p>
                  </div>

                  <div className="bg-accent-subtle/60 rounded-2xl p-3 text-center space-y-2 border border-accent/30">
                    <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden flex flex-col items-center justify-center p-2 gap-2">
                      <Sparkles className="w-7 h-7 text-accent" />
                      <span className="text-[10px] text-accent font-medium">AI Preview</span>
                    </div>
                    <p className="text-xs font-semibold text-charcoal">3. Result</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-canvas-subtle/80 border border-canvas-dark/50 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-charcoal">
                      Camera Mode + AI Try-On Mode
                    </p>
                    <p className="text-[11px] text-charcoal-light">
                      Drag a top onto your camera frame, capture, and generate a realistic 2D visual preview.
                    </p>
                  </div>
                  <Link to="/try-on" className="shrink-0">
                    <Button variant="accent" size="sm" className="text-xs">
                      Try Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
