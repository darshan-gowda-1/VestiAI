import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Heart, User, Menu, X, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const Navbar: React.FC = () => {
  const { wishlist, currentUser, logout, sessionExpiredMessage, clearSessionExpiredMessage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Try On', href: '/try-on' },
    { label: 'Explore Styles', href: '/store' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Wishlist', href: '/wishlist', badge: wishlist.length > 0 ? wishlist.length : undefined },
    { label: 'History', href: '/history' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <>
      {/* Top Banner Notice */}
      <div className="bg-charcoal text-canvas px-4 py-1.5 text-center text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span>VestiAI College Mini-Project • 2D Virtual Try-On for E-Commerce</span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-canvas-dark/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-charcoal-muted">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`transition-colors relative py-1 ${
                  isActive(link.href) ? 'text-charcoal font-semibold' : 'hover:text-charcoal'
                }`}
              >
                {link.label}
                {link.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-accent text-white text-[10px] font-bold rounded-full">
                    {link.badge}
                  </span>
                )}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            ))}

            {currentUser?.role === 'admin' && (
              <Link
                to="/admin"
                className={`transition-colors flex items-center space-x-1 text-accent font-semibold ${
                  isActive('/admin') ? 'underline' : ''
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="hidden sm:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-1.5 text-xs text-charcoal-muted hover:text-charcoal px-3 py-1.5 rounded-full hover:bg-canvas-subtle transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs text-charcoal-light hover:text-charcoal px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-medium text-charcoal hover:text-charcoal-muted px-3.5 py-1.5 rounded-full border border-canvas-dark"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/tryon"
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-charcoal text-canvas hover:bg-charcoal/90 transition shadow-sm flex items-center space-x-1.5"
            >
              <span>Try In Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              to="/wishlist"
              className="p-2 text-charcoal-muted relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal rounded-lg hover:bg-canvas-subtle"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-canvas border-b border-canvas-dark px-6 py-6 space-y-4 shadow-xl animate-fadeIn">
          <nav className="flex flex-col space-y-3 text-base font-medium text-charcoal">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 border-b border-canvas-subtle"
              >
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 bg-accent text-white text-xs font-bold rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            {currentUser?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-accent font-semibold flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 flex items-center space-x-2 text-charcoal-muted"
            >
              <User className="w-4 h-4" />
              <span>User Profile & Consent</span>
            </Link>
          </nav>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/tryon"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-charcoal text-canvas text-center text-sm font-medium shadow-md"
            >
              Enter Try-On Studio
            </Link>
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-full border border-canvas-dark text-xs text-charcoal text-center"
              >
                Sign Out ({currentUser.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-full border border-canvas-dark text-xs text-charcoal text-center"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Session Expiration Alert Banner */}
      {sessionExpiredMessage && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{sessionExpiredMessage}</span>
              <Link
                to="/login"
                onClick={clearSessionExpiredMessage}
                className="font-semibold underline hover:text-amber-700"
              >
                Sign In
              </Link>
            </div>
            <button
              onClick={clearSessionExpiredMessage}
              className="text-amber-700 hover:text-amber-950"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
