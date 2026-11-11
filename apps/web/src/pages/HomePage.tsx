import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, ShieldCheck, Shirt, Eye, CheckCircle2 } from 'lucide-react';
import { ProductCard } from '../components/catalog/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const HomePage: React.FC = () => {
  const { products } = useApp();
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Narrative */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-accent-subtle text-accent text-xs font-semibold tracking-wide border border-accent/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen 2D Virtual Try-On for Tops</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-charcoal leading-[1.12]">
                See the drape before <br className="hidden sm:inline" />
                <span className="italic font-normal text-accent">you commit.</span>
              </h1>

              <p className="text-base sm:text-lg text-charcoal-muted max-w-xl font-light leading-relaxed mx-auto lg:mx-0">
                Stop guessing how flat e-commerce clothing photos translate onto your body. Upload a front-facing photo and visualize our upper-body tops rendered with photorealistic 2D diffusion technology.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                <Link to="/tryon">
                  <Button variant="primary" size="lg" className="shadow-md">
                    <span>Open Try-On Studio</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button variant="secondary" size="lg">
                    <Shirt className="w-4 h-4 mr-1.5" />
                    <span>Browse Upper-Body Tops</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-charcoal-muted">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Private encrypted storage</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-canvas-dark" />
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Consent-first processing</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-canvas-dark" />
                <div className="flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-accent shrink-0" />
                  <span>Instant Before/After preview</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-canvas-dark/60 relative overflow-hidden space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-canvas-subtle">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                      Virtual Studio Active
                    </span>
                  </div>
                  <Badge variant="accent" className="font-mono text-[10px]">2D Diffusion</Badge>
                </div>

                {/* Hero Showcase Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-canvas-subtle rounded-2xl p-4 text-center space-y-2 border border-canvas-dark/40">
                    <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
                      <div className="w-12 h-16 rounded-full bg-canvas-dark/60 border border-canvas-dark/80" />
                    </div>
                    <p className="text-xs font-medium text-charcoal">1. Your Portrait</p>
                    <p className="text-[10px] text-charcoal-light">Upper-body front view</p>
                  </div>

                  <div className="bg-canvas-subtle rounded-2xl p-4 text-center space-y-2 border border-canvas-dark/40">
                    <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
                      {products[0]?.imageUrl ? (
                        <img
                          src={products[0].imageUrl}
                          alt={products[0].title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Shirt className="w-10 h-10 text-canvas-dark" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-charcoal">2. Target Top</p>
                    <p className="text-[10px] text-charcoal-light truncate">
                      {products[0]?.title || 'Catalog Upper-Body Top'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-canvas-subtle/80 border border-canvas-dark/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-charcoal">AI Synthesis Engine</p>
                    <p className="text-[11px] text-charcoal-light">Dual UNet • Garment preservation</p>
                  </div>
                  <Link to="/tryon">
                    <Button variant="accent" size="sm" className="text-xs">
                      Try This Look
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
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="uppercase tracking-wider">Simple 3-Step Process</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
            How VestiAI Works
          </h2>
          <p className="text-sm text-charcoal-muted leading-relaxed font-light">
            Designed for frictionless e-commerce integration. No complex 3D measurement gear or body scanners required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              01
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">Choose a Top</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Explore our curated upper-body catalog spanning everyday organic t-shirts, formal Oxford shirts, fleece sweatshirts, and silk evening blouses.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              02
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">Upload Your Photo</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Upload a front-facing selfie or portrait with relaxed arms. Review the instant preflight guidance checklist and confirm your processing consent.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-canvas-dark/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center font-serif text-xl font-bold text-accent">
              03
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal">Compare & Save</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              Inspect the AI-generated preview using our interactive before-and-after slider. Save the outfit to your personal history or test another garment.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Tops Shelf */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-canvas-dark/60">
          <div>
            <Badge variant="accent" className="mb-2">Curated Collection</Badge>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
              Featured Upper-Body Tops
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-medium text-charcoal hover:text-accent flex items-center space-x-1"
          >
            <span>Explore All 12 Tops in Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Academic Integrity & Scope Notice Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-charcoal text-canvas p-8 sm:p-12 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-canvas/10 text-canvas text-xs font-semibold uppercase tracking-wider">
                Engineering & Scope Transparency
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium">
                Engineered for Academic Rigor & Transparency
              </h3>
              <p className="text-xs sm:text-sm text-canvas/70 font-light leading-relaxed">
                VestiAI is intentionally constructed as a 2D image-to-image virtual try-on system. 3D avatars, 3D clothing simulation, and tailoring sizing claims are explicitly excluded in accordance with the project specification.
              </p>
            </div>

            <Link to="/tryon">
              <Button variant="accent" size="lg" className="whitespace-nowrap">
                <span>Start Virtual Try-On</span>
                <Sparkles className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
