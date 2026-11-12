import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GarmentSidebar } from '../components/tryon/GarmentSidebar';
import { DropTargetStage } from '../components/tryon/DropTargetStage';
import type { Product } from '../types';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Classic Navy Crewneck',
    brand: 'Atelier Vesti',
    category: 't-shirt',
    categoryLabel: 'T-Shirts',
    color: 'Navy Blue',
    price: 29,
    material: 'Organic Cotton',
    fit: 'Regular',
    description: 'Soft navy t-shirt.',
    imageUrl: '/navy.png',
    flatGarmentUrl: '/navy.png',
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'prod-2',
    title: 'Crisp Oxford Shirt',
    brand: 'Atelier Vesti',
    category: 'shirt',
    categoryLabel: 'Shirts',
    color: 'Crisp White',
    price: 59,
    material: 'Oxford Cotton',
    fit: 'Tailored',
    description: 'White button-down shirt.',
    imageUrl: '/white.png',
    flatGarmentUrl: '/white.png',
    isFeatured: false,
    isActive: true,
  },
];

describe('VestiAI 2.0 Drag-and-Drop Garment Experience', () => {
  it('filters garments by category tab and search query, and supports click-to-select', () => {
    const onSelect = vi.fn();
    const onWishlist = vi.fn();

    render(
      <GarmentSidebar
        products={SAMPLE_PRODUCTS}
        selectedGarmentId="prod-1"
        wishlistIds={['prod-1']}
        onSelectGarment={onSelect}
        onToggleWishlist={onWishlist}
      />
    );

    expect(screen.getByText('Classic Navy Crewneck')).toBeInTheDocument();
    expect(screen.getByText('Crisp Oxford Shirt')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Shirts' }));
    expect(screen.queryByText('Classic Navy Crewneck')).not.toBeInTheDocument();
    expect(screen.getByText('Crisp Oxford Shirt')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(screen.getByLabelText('Search garments'), { target: { value: 'Navy' } });
    expect(screen.getByText('Classic Navy Crewneck')).toBeInTheDocument();
    expect(screen.queryByText('Crisp Oxford Shirt')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Select Classic Navy Crewneck/i }));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_PRODUCTS[0]);
  });

  it('selects dropped garment on valid drop and displays feedback on invalid drop', () => {
    const onDropped = vi.fn();

    render(
      <DropTargetStage products={SAMPLE_PRODUCTS} onGarmentDropped={onDropped}>
        <div>Camera Drop Stage</div>
      </DropTargetStage>
    );

    const dropTarget = screen.getByTestId('garment-drop-target');

    fireEvent.dragOver(dropTarget);
    expect(screen.getByText(/Drop Garment to Select/i)).toBeInTheDocument();

    fireEvent.drop(dropTarget, {
      dataTransfer: {
        getData: (type: string) => (type === 'application/x-vestiai-garment' ? 'prod-2' : ''),
      },
    });
    expect(onDropped).toHaveBeenCalledWith(SAMPLE_PRODUCTS[1]);

    // Invalid drop payload
    fireEvent.drop(dropTarget, {
      dataTransfer: {
        getData: () => 'unknown-item',
      },
    });
    expect(
      screen.getByText(/Drop a garment card from the catalog panel to select it/i)
    ).toBeInTheDocument();
  });
});
