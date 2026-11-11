import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-canvas border-t border-canvas-dark/60 pt-16 pb-12 text-sm text-charcoal-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-canvas-dark/60">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center text-canvas font-serif font-bold text-base shadow-sm">
                V
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-charcoal">
                Vesti<span className="text-accent">AI</span>
              </span>
            </div>
            <p className="text-xs text-charcoal-light leading-relaxed">
              AI-Powered 2D Virtual Clothing Try-On for Fashion E-Commerce. Bridging product photography and authentic human self-visualization.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Consent-Based & Private Storage</span>
            </div>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              Upper-Body Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/catalog?category=t-shirt" className="hover:text-charcoal transition-colors">
                  T-Shirts & Boxy Tees
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=shirt" className="hover:text-charcoal transition-colors">
                  Oxford & Linen Shirts
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=sweatshirt" className="hover:text-charcoal transition-colors">
                  Fleece Sweaters & Hoodies
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=blouse" className="hover:text-charcoal transition-colors">
                  Silk & Evening Blouses
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              Experience
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/tryon" className="hover:text-charcoal transition-colors flex items-center space-x-1">
                  <span>Try-On Studio</span>
                  <Sparkles className="w-3 h-3 text-accent" />
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-charcoal transition-colors">
                  My Try-On History
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-charcoal transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-charcoal transition-colors">
                  Data Controls & Erasure
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-charcoal transition-colors">
                  Privacy & Responsible AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Notice & Scope */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              Academic & Scope Notice
            </h4>
            <div className="p-3 rounded-xl bg-canvas-subtle border border-canvas-dark/60 text-xs text-charcoal-muted space-y-1.5">
              <div className="flex items-center space-x-1.5 font-medium text-charcoal">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>Strict 2D Scope Boundary</span>
              </div>
              <p className="text-[11px] leading-relaxed text-charcoal-light">
                This project focuses strictly on 2D image-to-image conditional diffusion. 3D avatars, 3D clothing meshes, and sizing guarantees are excluded by specification.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-light">
          <p>© 2026 VestiAI Project. Academic College Mini-Project. Released under MIT License.</p>
          <div className="flex items-center space-x-6">
            <span>FastAPI Backend</span>
            <span>React & Vite</span>
            <span>2D Diffusion Pipeline</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

