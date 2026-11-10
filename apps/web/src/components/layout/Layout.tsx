import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-charcoal">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
