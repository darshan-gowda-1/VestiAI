import { Sparkles, ArrowRight, ShieldCheck, Shirt } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-charcoal">
      {/* Top Announcement Bar */}
      <div className="bg-charcoal text-canvas px-4 py-2 text-center text-xs tracking-wider uppercase font-medium">
        College Mini-Project Baseline • 2D Virtual Try-On for E-Commerce
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur border-b border-canvas-dark/60">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-charcoal flex items-center justify-center text-canvas font-serif font-bold text-lg shadow-sm">
              V
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal">
                Vesti<span className="text-accent">AI</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-charcoal-muted">
            <a href="#catalog" className="hover:text-charcoal transition-colors">Catalog</a>
            <a href="#try-on" className="hover:text-charcoal transition-colors">Try-On Studio</a>
            <a href="#how-it-works" className="hover:text-charcoal transition-colors">How It Works</a>
            <a href="#privacy" className="hover:text-charcoal transition-colors">Privacy & Scope</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm font-medium rounded-full bg-charcoal text-canvas hover:bg-charcoal/90 transition shadow-sm flex items-center space-x-2">
              <span>Try In Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent-subtle text-accent text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Upper Body Try-On</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-charcoal leading-[1.15]">
            See the fit before <br />
            <span className="italic font-normal text-accent">you commit.</span>
          </h1>

          <p className="text-base sm:text-lg text-charcoal-muted max-w-xl font-light leading-relaxed">
            VestiAI empowers fashion shoppers to upload a front-facing photo and preview catalog shirts, t-shirts, and tops rendered with photorealistic 2D diffusion technology.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button className="px-6 py-3.5 rounded-full bg-charcoal text-canvas text-sm font-medium hover:bg-charcoal/90 transition shadow-md flex items-center space-x-2">
              <Shirt className="w-4 h-4" />
              <span>Browse Upper-Body Tops</span>
            </button>
            <div className="flex items-center space-x-2 text-xs text-charcoal-muted bg-canvas-subtle px-3.5 py-2 rounded-full border border-canvas-dark/40">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Private media storage • Consent-based processing</span>
            </div>
          </div>

          {/* Quick Technical Architecture Badges */}
          <div className="pt-6 border-t border-canvas-dark/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-charcoal-muted">
            <div>
              <p className="font-semibold text-charcoal">Frontend</p>
              <p>React + TypeScript + Vite</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal">Backend</p>
              <p>FastAPI + PostgreSQL</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal">AI Core</p>
              <p>IDM-VTON / 2D Diffusion</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal">Hardware</p>
              <p>RTX 4050 / Google Colab</p>
            </div>
          </div>
        </div>

        {/* Hero Card Preview */}
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-canvas-dark/40 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-subtle">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Phase 1 Environment Ready</span>
              </div>
              <span className="text-xs bg-canvas-subtle px-2.5 py-1 rounded text-charcoal-muted font-mono">v1.0.0</span>
            </div>

            <div className="py-8 space-y-4">
              <div className="p-4 rounded-2xl bg-canvas-subtle/80 border border-canvas-dark/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-charcoal font-semibold">FastAPI Backend Status</span>
                  <span className="text-emerald-700 font-mono">200 OK /health</span>
                </div>
                <div className="w-full bg-canvas-dark/40 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-full"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-canvas-subtle/80 border border-canvas-dark/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-charcoal font-semibold">Vite TypeScript Frontend</span>
                  <span className="text-emerald-700 font-mono">Compiled Cleanly</span>
                </div>
                <div className="w-full bg-canvas-dark/40 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-full"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-accent-subtle/50 border border-accent/20 space-y-1">
                <p className="text-xs font-semibold text-accent">Strict Scope Enforcement</p>
                <p className="text-xs text-charcoal-muted">
                  Strictly 2D image-to-image virtual try-on. 3D avatars, 3D clothing meshes, Blender workflows, and WebGL/Three.js are excluded by specification.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-charcoal-light">
              Phase 1 acceptance criteria met • Ready for Phase 2 AI feasibility spike
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-canvas-dark/60 bg-canvas py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-muted">
          <p>© 2026 VestiAI Project. Academic College Mini-Project.</p>
          <div className="flex space-x-6">
            <span>2D Diffusion Pipeline</span>
            <span>FastAPI REST API</span>
            <span>PostgreSQL & Redis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

