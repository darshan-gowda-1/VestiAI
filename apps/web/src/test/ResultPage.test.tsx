import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ResultPage } from '../pages/ResultPage';
import * as AppContextModule from '../context/AppContext';
import type { TryOnJob } from '../types';

const MOCK_JOB: TryOnJob = {
  id: 'job-123',
  productId: 'prod-1',
  product: {
    id: 'prod-1',
    title: 'Classic Navy Crewneck',
    brand: 'Atelier Vesti',
    category: 't-shirt',
    categoryLabel: 'T-Shirts',
    color: 'Navy Blue',
    price: 29,
    material: 'Organic Cotton',
    fit: 'Regular',
    description: 'Classic tee',
    imageUrl: '/garment.png',
    flatGarmentUrl: '/garment.png',
    isFeatured: true,
    isActive: true,
  },
  personImageUrl: '/person.jpg',
  resultImageUrl: '/result.png',
  status: 'completed',
  createdAt: '2026-11-12T10:00:00Z',
  completedAt: '2026-11-12T10:00:05Z',
  modelName: 'idm-vton-v1',
  processingTimeMs: 4200,
  isSimulated: false,
};

describe('VestiAI 2.0 Result Experience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays comparison slider, model metadata, and result actions', () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      jobsHistory: [MOCK_JOB],
      currentJob: MOCK_JOB,
      savedLookIds: [],
      toggleSaveLook: vi.fn(),
      fetchJobById: vi.fn(),
      deleteJob: vi.fn(),
      wishlist: [],
      toggleWishlist: vi.fn(),
      setUploadedPersonPhoto: vi.fn(),
      setSelectedGarment: vi.fn(),
    } as unknown as ReturnType<typeof AppContextModule.useApp>);

    render(
      <MemoryRouter initialEntries={['/try-on/result/job-123']}>
        <Routes>
          <Route path="/try-on/result/:jobId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Virtual Try-On Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Classic Navy Crewneck/i)).toBeInTheDocument();
    expect(screen.getByText(/Model: idm-vton-v1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Look/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Result/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Another Garment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retake Photo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Product/i })).toHaveAttribute('href', '/product/prod-1');
  });

  it('displays retry banner when job status is failed', () => {
    const failedJob: TryOnJob = {
      ...MOCK_JOB,
      status: 'failed',
      error: 'GPU timeout while processing frame.',
      resultImageUrl: undefined,
    };

    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      jobsHistory: [failedJob],
      currentJob: failedJob,
      savedLookIds: [],
      toggleSaveLook: vi.fn(),
      fetchJobById: vi.fn(),
      deleteJob: vi.fn(),
      wishlist: [],
      toggleWishlist: vi.fn(),
      setUploadedPersonPhoto: vi.fn(),
      setSelectedGarment: vi.fn(),
    } as unknown as ReturnType<typeof AppContextModule.useApp>);

    render(
      <MemoryRouter initialEntries={['/try-on/result/job-123']}>
        <Routes>
          <Route path="/try-on/result/:jobId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/AI Try-On Generation Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/GPU timeout while processing frame\./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retry in Studio/i })).toHaveAttribute(
      'href',
      '/try-on?productId=prod-1'
    );
  });
});
