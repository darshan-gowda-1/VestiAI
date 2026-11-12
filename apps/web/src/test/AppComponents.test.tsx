import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ComparisonSlider } from '../components/ui/comparison-slider';
import { ImageUploader } from '../components/tryon/ImageUploader';
import { JobProgressView } from '../components/tryon/JobProgressView';
import { GuidanceCard } from '../components/tryon/GuidanceCard';
import { Product, TryOnJob } from '../types';

const SAMPLE_PRODUCT: Product = {
  id: 'prod-1',
  title: 'Tailored Oxford Cotton Button-Down',
  brand: 'Loom & Thread',
  category: 'shirt',
  categoryLabel: 'Shirts',
  color: 'Sky Blue',
  price: 85,
  imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
  flatGarmentUrl: 'data:image/png;base64,iVBORw0KGgo=',
  description: 'Classic Oxford shirt.',
  material: '100% Cotton',
  fit: 'Regular Fit',
};

describe('VestiAI UI Components & State Tests', () => {
  it('renders ImageUploader dropzone and rejects invalid file types and >10MB payloads', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(
      <ImageUploader image={null} onImageSelected={onSelect} onImageRemoved={onRemove} />
    );

    expect(screen.getByText('Upload Your Photograph')).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Reject invalid MIME type
    const invalidFile = new File(['hello'], 'bad.gif', { type: 'image/gif' });
    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(
      screen.getByText('Invalid format. Please upload a JPEG, PNG, or WebP photo.')
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    // Reject oversized file (> 10 MB)
    const bigFile = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(
      screen.getByText('Image exceeds the 10 MB limit. Please select a smaller file.')
    ).toBeInTheDocument();
  });

  it('renders preview with Replace and Remove controls when an image is provided', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();

    render(
      <ImageUploader
        image="data:image/png;base64,iVBORw0KGgo="
        onImageSelected={onSelect}
        onImageRemoved={onRemove}
      />
    );

    expect(screen.getByAltText('Uploaded person preview')).toBeInTheDocument();
    expect(screen.getByText('Replace')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders JobProgressView across queued, processing, failed, and completed states without fake percentages', () => {
    const baseJob: TryOnJob = {
      id: 'job-123',
      productId: SAMPLE_PRODUCT.id,
      product: SAMPLE_PRODUCT,
      personImageUrl: '',
      status: 'queued',
      createdAt: new Date().toISOString(),
    };

    const onCancel = vi.fn();
    const onViewResult = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <JobProgressView job={baseJob} onCancel={onCancel} onViewResult={onViewResult} />
      </MemoryRouter>
    );
    expect(screen.getByText('Scheduling Try-On Job...')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <JobProgressView
          job={{ ...baseJob, status: 'processing' }}
          onCancel={onCancel}
          onViewResult={onViewResult}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Synthesizing Upper-Body Drape...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <JobProgressView
          job={{ ...baseJob, status: 'failed', error: 'GPU out of memory' }}
          onCancel={onCancel}
          onViewResult={onViewResult}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Try-On Processing Failed')).toBeInTheDocument();
    expect(screen.getByText('GPU out of memory')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <JobProgressView
          job={{ ...baseJob, status: 'completed', processingTimeMs: 3200 }}
          onCancel={onCancel}
          onViewResult={onViewResult}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Try-On Preview Ready!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('View Before & After Comparison'));
    expect(onViewResult).toHaveBeenCalledTimes(1);
  });

  it('renders ComparisonSlider with Original and AI Try-On labels', () => {
    render(
      <ComparisonSlider
        originalImage="data:image/png;base64,iVBORw0KGgo="
        resultImage="data:image/png;base64,iVBORw0KGgo="
        originalLabel="Your Original Photo"
        resultLabel="VestiAI Synthesized Preview"
      />
    );

    expect(screen.getByText('Your Original Photo')).toBeInTheDocument();
    expect(screen.getByText('VestiAI Synthesized Preview')).toBeInTheDocument();
  });

  it('renders GuidanceCard photo instructions clearly', () => {
    render(<GuidanceCard />);
    expect(screen.getByText('Frontal Pose')).toBeInTheDocument();
    expect(screen.getByText('Clear Upper Torso')).toBeInTheDocument();
    expect(screen.getByText('Balanced Lighting')).toBeInTheDocument();
  });
});

