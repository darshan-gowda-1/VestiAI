import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandLogo } from '../components/common/BrandLogo';
import { ToastProvider, useToast } from '../components/ui/toast';
import { LoadingSpinner } from '../components/ui/spinner';
import { CameraPermissionCard } from '../components/camera/CameraPermissionCard';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({
          title: 'Garment Selected',
          description: 'Classic Navy Crewneck added to try-on.',
          variant: 'success',
        })
      }
    >
      Trigger Toast
    </button>
  );
}

describe('VestiAI 2.0 Design System Components', () => {
  it('renders BrandLogo with wordmark and optional tagline', () => {
    render(<BrandLogo size="lg" showTagline />);
    expect(screen.getByText(/Vesti/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Virtual Try-On/i)).toBeInTheDocument();
  });

  it('displays and dismisses Toast notifications via useToast', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Trigger Toast/i }));
    expect(screen.getByText('Garment Selected')).toBeInTheDocument();
    expect(screen.getByText(/Classic Navy Crewneck/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dismiss notification/i }));
    expect(screen.queryByText('Garment Selected')).not.toBeInTheDocument();
  });

  it('renders LoadingSpinner with accessible label', () => {
    render(<LoadingSpinner label="Initializing camera..." />);
    expect(screen.getByText('Initializing camera...')).toBeInTheDocument();
  });

  it('renders CameraPermissionCard across not-started and denied states', () => {
    const onStart = vi.fn();
    const onUpload = vi.fn();
    const { rerender } = render(
      <CameraPermissionCard
        state="not-started"
        onStartCamera={onStart}
        onUploadFallback={onUpload}
      />
    );

    expect(screen.getByText(/Enable Live Camera Try-On/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start Camera/i }));
    expect(onStart).toHaveBeenCalledTimes(1);

    rerender(
      <CameraPermissionCard
        state="denied"
        onStartCamera={onStart}
        onUploadFallback={onUpload}
      />
    );
    expect(screen.getByText(/Camera Permission Denied/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Upload Photo/i }));
    expect(onUpload).toHaveBeenCalledTimes(1);
  });
});
