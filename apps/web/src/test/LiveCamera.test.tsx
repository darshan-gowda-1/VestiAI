import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useCameraStream } from '../hooks/useCameraStream';
import { LiveCameraStage } from '../components/camera/LiveCameraStage';

function CameraTestHarness({ onCaptured }: { onCaptured?: (file: File) => void }) {
  const camera = useCameraStream();
  return (
    <LiveCameraStage
      videoRef={camera.videoRef}
      cameraState={camera.cameraState}
      errorMessage={camera.errorMessage}
      facingMode={camera.facingMode}
      devices={camera.devices}
      selectedDeviceId={camera.selectedDeviceId}
      capturedPreviewUrl={null}
      onStartCamera={() => void camera.startCamera()}
      onStopCamera={() => camera.stopCamera('stopped')}
      onSwitchCamera={() => void camera.switchCamera()}
      onSelectDevice={(id) => void camera.selectDevice(id)}
      onCaptureFrame={async () => {
        const res = await camera.captureFrame();
        if (res && onCaptured) onCaptured(res.file);
      }}
      onRetake={() => {}}
      onSwitchToUpload={() => {}}
    />
  );
}

describe('VestiAI 2.0 Live Camera Stream & Stage', () => {
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('does not request camera permission on initial mount and starts only on user click', async () => {
    const stopTrack = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'cam-1' }), stop: stopTrack }],
    } as unknown as MediaStream;

    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    const enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'cam-1', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'cam-2', label: 'Back Camera' },
    ]);

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia, enumerateDevices },
    });

    const { unmount } = render(<CameraTestHarness />);
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByText(/Enable Live Camera Try-On/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Start Camera/i })[0]);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Camera Active/i)).toBeInTheDocument();
    });

    // Switch camera toggles to next device
    fireEvent.click(screen.getByRole('button', { name: /Switch Camera/i }));
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    // Stop camera stops tracks
    fireEvent.click(screen.getByRole('button', { name: /Stop Camera/i }));
    expect(stopTrack).toHaveBeenCalled();
    expect(screen.getByText(/Camera Paused/i)).toBeInTheDocument();

    // Unmount also cleans up cleanly
    unmount();
  });

  it('handles permission denied (NotAllowedError) and unavailable (NotFoundError) states', async () => {
    const getUserMediaDenied = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: getUserMediaDenied },
    });

    const { rerender } = render(<CameraTestHarness />);
    fireEvent.click(screen.getAllByRole('button', { name: /Start Camera/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Camera Permission Denied/i)).toBeInTheDocument();
    });

    const getUserMediaNotFound = vi
      .fn()
      .mockRejectedValue(new DOMException('No device', 'NotFoundError'));
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: getUserMediaNotFound },
    });

    rerender(<CameraTestHarness />);
    fireEvent.click(screen.getAllByRole('button', { name: /Start Camera/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
    });
  });

  it('captures a JPEG File from an active video frame via canvas', async () => {
    const stopTrack = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'cam-1' }), stop: stopTrack }],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,abc');
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
      cb(new Blob(['fake-jpeg'], { type: 'image/jpeg' }));
    });

    const onCaptured = vi.fn();
    render(<CameraTestHarness onCaptured={onCaptured} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Start Camera/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/Camera Active/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Capture Frame/i }));
    await waitFor(() => {
      expect(onCaptured).toHaveBeenCalledTimes(1);
    });
    const capturedFile = onCaptured.mock.calls[0][0] as File;
    expect(capturedFile).toBeInstanceOf(File);
    expect(capturedFile.type).toBe('image/jpeg');
  });
});

