import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-canvas border-t border-canvas-dark/60 pt-16 pb-12 text-sm text-charcoal-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-canvas-dark/60">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block">
              <BrandLogo size="sm" />
            </Link>
            <p className="text-xs text-charcoal-light leading-relaxed">
              VestiAI — AI-Powered Live Virtual Fashion Try-On Platform. Bridging online clothing discovery and honest 2D self-visualization.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Consent-Based &amp; Private Storage</span>
            </div>
          </div>

          {/* Store & Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              Fashion Store
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/store?category=t-shirt" className="hover:text-charcoal transition-colors">
                  T-Shirts &amp; Boxy Tees
                </Link>
              </li>
              <li>
                <Link to="/store?category=shirt" className="hover:text-charcoal transition-colors">
                  Oxford &amp; Linen Shirts
                </Link>
              </li>
              <li>
                <Link to="/store?category=sweatshirt" className="hover:text-charcoal transition-colors">
                  Fleece Sweaters &amp; Hoodies
                </Link>
              </li>
              <li>
                <Link to="/store?category=blouse" className="hover:text-charcoal transition-colors">
                  Silk &amp; Evening Blouses
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Support Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              Platform &amp; Help
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/try-on" className="hover:text-charcoal transition-colors flex items-center space-x-1">
                  <span>Live Try-On Studio</span>
                  <Sparkles className="w-3 h-3 text-accent" />
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-charcoal transition-colors">
                  How It Works &amp; Help
                </Link>
              </li>
              <li>
                <Link to="/#extension" className="hover:text-charcoal transition-colors">
                  Chrome Extension
                </Link>
              </li>
              <li>
                <Link to="/saved-looks" className="hover:text-charcoal transition-colors">
                  Saved Looks &amp; History
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-charcoal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-charcoal transition-colors">
                  Terms &amp; Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Notice & Scope */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal font-sans">
              About &amp; Scope Notice
            </h4>
            <div className="p-3 rounded-xl bg-canvas-subtle border border-canvas-dark/60 text-xs text-charcoal-muted space-y-1.5">
              <div className="flex items-center space-x-1.5 font-medium text-charcoal">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>2D Visual Preview Only</span>
              </div>
              <p className="text-[11px] leading-relaxed text-charcoal-light">
                Camera mode provides live framing; AI try-on generates 2D previews. No 3D avatars or guaranteed physical sizing claims.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-light">
          <p>© {new Date().getFullYear()} VestiAI. Built for Academic &amp; Research Demonstration.</p>
          <p>React 18 • FastAPI • PyTorch 2D Virtual Try-On</p>
        </div>
      </div>
    </footer>
  );
};
