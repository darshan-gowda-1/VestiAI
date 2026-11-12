import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HistoryPage } from '../pages/HistoryPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import * as AppContextModule from '../context/AppContext';
import type { TryOnJob } from '../types';

const JOBS: TryOnJob[] = [
  {
    id: 'job-saved',
    productId: 'prod-1',
    product: {
      id: 'prod-1',
      title: 'Saved Navy Tee',
      brand: 'Atelier Vesti',
      category: 't-shirt',
      categoryLabel: 'T-Shirts',
      color: 'Navy Blue',
      price: 29,
      material: 'Organic Cotton',
      fit: 'Regular',
      description: 'Tee',
      imageUrl: '/tee.png',
      flatGarmentUrl: '/tee.png',
    },
    personImageUrl: '/p.jpg',
    resultImageUrl: '/r1.png',
    status: 'completed',
    createdAt: '2026-11-12T10:00:00Z',
  },
  {
    id: 'job-unsaved',
    productId: 'prod-2',
    product: {
      id: 'prod-2',
      title: 'Unsaved Oxford Shirt',
      brand: 'Atelier Vesti',
      category: 'shirt',
      categoryLabel: 'Shirts',
      color: 'White',
      price: 59,
      material: 'Cotton',
      fit: 'Tailored',
      description: 'Shirt',
      imageUrl: '/shirt.png',
      flatGarmentUrl: '/shirt.png',
    },
    personImageUrl: '/p.jpg',
    resultImageUrl: '/r2.png',
    status: 'completed',
    createdAt: '2026-11-12T11:00:00Z',
  },
];

describe('VestiAI 2.0 Saved Looks, History & Account Recovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      jobsHistory: JOBS,
      savedLookIds: ['job-saved'],
      deleteJob: vi.fn(),
      deleteAllJobs: vi.fn(),
      currentUser: { id: 'u-1', name: 'Darshan', email: 'd@example.com', role: 'user', consentGiven: true },
    } as unknown as ReturnType<typeof AppContextModule.useApp>);
  });

  it('opens /saved-looks directly on Saved Looks filter', () => {
    render(
      <MemoryRouter initialEntries={['/saved-looks']}>
        <Routes>
          <Route path="/saved-looks" element={<HistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Saved Navy Tee')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved Oxford Shirt')).not.toBeInTheDocument();
  });

  it('renders ForgotPasswordPage and handles submission', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'student@vestiai.edu' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText(/Request Recorded/i)).toBeInTheDocument();
  });
});
