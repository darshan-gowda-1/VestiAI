import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../components/ui/toast';
import { HomePage } from '../pages/HomePage';
import { Footer } from '../components/layout/Footer';

describe('VestiAI 2.0 Landing Page & Footer', () => {
  it('renders Hero headline, primary CTAs, 3-step How It Works, and Chrome Extension promo', () => {
    render(
      <ToastProvider>
        <AppProvider>
          <MemoryRouter>
            <HomePage />
            <Footer />
          </MemoryRouter>
        </AppProvider>
      </ToastProvider>
    );

    expect(screen.getByText(/Try Any Look\./i)).toBeInTheDocument();
    expect(screen.getByText(/Before You Buy\./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start Virtual Try-On/i })).toHaveAttribute('href', '/try-on');
    expect(screen.getByRole('link', { name: /Explore Styles/i })).toHaveAttribute('href', '/store');

    expect(screen.getByText(/Turn on your camera or upload a photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose or drag a garment/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate and view your AI try-on/i)).toBeInTheDocument();

    expect(screen.getByText(/Try Clothes From Supported Shopping Websites/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms & Contact/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', '/privacy');
  });
});

