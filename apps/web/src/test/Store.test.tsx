import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CatalogPage } from '../pages/CatalogPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import * as AppContextModule from '../context/AppContext';
import type { Product } from '../types';

const STORE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Everyday Cotton Tee',
    brand: 'Atelier Vesti',
    category: 't-shirt',
    categoryLabel: 'T-Shirts',
    color: 'Navy Blue',
    price: 25,
    material: 'Organic Cotton',
    fit: 'Regular',
    description: 'Comfortable cotton tee.',
    imageUrl: '/tee.png',
    flatGarmentUrl: '/tee.png',
    isFeatured: true,
    isActive: true,
    source: 'VestiAI Curated',
  },
  {
    id: 'prod-2',
    title: 'Tailored Silk Blouse',
    brand: 'Maison Lumiere',
    category: 'blouse',
    categoryLabel: 'Blouses',
    color: 'Champagne Beige',
    price: 89,
    material: 'Mulberry Silk',
    fit: 'Relaxed',
    description: 'Silk evening blouse.',
    imageUrl: '/blouse.png',
    flatGarmentUrl: '/blouse.png',
    isFeatured: false,
    isActive: true,
    retailerUrl: 'https://example.com/products/tailored-silk-blouse',
    source: 'Maison Lumiere',
  },
];

describe('VestiAI 2.0 Fashion Store (/store & /product/:id)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      products: STORE_PRODUCTS,
      isCatalogLoading: false,
      catalogError: null,
      refreshCatalog: vi.fn(),
      wishlist: [],
      toggleWishlist: vi.fn(),
      setSelectedGarment: vi.fn(),
    } as unknown as ReturnType<typeof AppContextModule.useApp>);
  });

  it('supports search, price range filtering, and sorting in Store', () => {
    render(
      <MemoryRouter initialEntries={['/store']}>
        <Routes>
          <Route path="/store" element={<CatalogPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('VestiAI Fashion Store')).toBeInTheDocument();
    expect(screen.getByText('Everyday Cotton Tee')).toBeInTheDocument();
    expect(screen.getByText('Tailored Silk Blouse')).toBeInTheDocument();

    // Filter under $35
    fireEvent.change(screen.getByLabelText('Filter by price'), { target: { value: 'under-35' } });
    expect(screen.getByText('Everyday Cotton Tee')).toBeInTheDocument();
    expect(screen.queryByText('Tailored Silk Blouse')).not.toBeInTheDocument();

    // Reset and search by brand
    fireEvent.change(screen.getByLabelText('Filter by price'), { target: { value: 'all' } });
    fireEvent.change(screen.getByPlaceholderText('Search tops, colors...'), {
      target: { value: 'Lumiere' },
    });
    expect(screen.queryByText('Everyday Cotton Tee')).not.toBeInTheDocument();
    expect(screen.getByText('Tailored Silk Blouse')).toBeInTheDocument();
  });

  it('displays external retailer link and attribution on Product Detail page', () => {
    render(
      <MemoryRouter initialEntries={['/product/prod-2']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const retailerLink = screen.getByRole('link', { name: /Visit Original Retailer/i });
    expect(retailerLink).toHaveAttribute('href', 'https://example.com/products/tailored-silk-blouse');
    expect(retailerLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/Source: Maison Lumiere/i)).toBeInTheDocument();
  });
});

