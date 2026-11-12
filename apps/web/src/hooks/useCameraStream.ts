import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraUiState } from '../components/camera/CameraPermissionCard';

export interface CapturedFrame {
  file: File;
  previewUrl: string;
}

export interface UseCameraStreamResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraState: CameraUiState;
  errorMessage: string | null;
  facingMode: 'user' | 'environment';
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  startCamera: (overrideDeviceId?: string, overrideFacing?: 'user' | 'environment') => Promise<void>;
  stopCamera: (nextState?: 'stopped' | 'not-started') => void;
  switchCamera: () => Promise<void>;
  selectDevice: (deviceId: string) => Promise<void>;
  captureFrame: () => Promise<CapturedFrame | null>;
}

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // ignore track cleanup errors
    }
  });
}

export function useCameraStream(): UseCameraStreamResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraUiState>('not-started');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const stopCamera = useCallback((nextState: 'stopped' | 'not-started' = 'stopped') => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState(nextState);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === 'videoinput'));
    } catch {
      // ignore enumeration errors
    }
  }, []);

  const startCamera = useCallback(
    async (overrideDeviceId?: string, overrideFacing?: 'user' | 'environment') => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable');
        setErrorMessage('Camera API is not supported in this browser. Please upload a photo instead.');
        return;
      }

      stopMediaStream(streamRef.current);
      streamRef.current = null;
      setCameraState('requesting');
      setErrorMessage(null);

      const targetFacing = overrideFacing ?? facingMode;
      const targetDeviceId = overrideDeviceId ?? selectedDeviceId;

      const videoConstraints: MediaTrackConstraints = targetDeviceId
        ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1080 }, height: { ideal: 1440 } }
        : { facingMode: { ideal: targetFacing }, width: { ideal: 1080 }, height: { ideal: 1440 } };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        const activeDeviceId = videoTrack?.getSettings?.().deviceId;
        if (activeDeviceId) {
          setSelectedDeviceId(activeDeviceId);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // autoplay policies may resolve silently
          }
        }

        setCameraState('active');
        await refreshDevices();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : (err as Error)?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraState('denied');
          setErrorMessage(
            'Camera permission was denied. Allow camera access in your browser settings or upload a photo.'
          );
        } else if (
          name === 'NotFoundError' ||
          name === 'DevicesNotFoundError' ||
          name === 'OverconstrainedError'
        ) {
          setCameraState('unavailable');
          setErrorMessage('No compatible camera was found on this device. Please upload a photo.');
        } else {
          setCameraState('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'Unable to start camera stream. Please retry.'
          );
        }
      }
    },
    [facingMode, selectedDeviceId, refreshDevices]
  );

  const switchCamera = useCallback(async () => {
    const nextFacing: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    if (devices.length > 1 && selectedDeviceId) {
      const currentIdx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextDevice = devices[(currentIdx + 1) % devices.length];
      if (nextDevice) {
        setSelectedDeviceId(nextDevice.deviceId);
        await startCamera(nextDevice.deviceId, nextFacing);
        return;
      }
    }

    setSelectedDeviceId(null);
    await startCamera(undefined, nextFacing);
  }, [devices, facingMode, selectedDeviceId, startCamera]);

  const selectDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      await startCamera(deviceId, facingMode);
    },
    [facingMode, startCamera]
  );

  const captureFrame = useCallback(async (): Promise<CapturedFrame | null> => {
    const video = videoRef.current;
    if (!video || cameraState !== 'active') return null;

    const width = video.videoWidth || 768;
    const height = video.videoHeight || 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);

    const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return null;

    const file = new File([blob], `vestiai-capture-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    return { file, previewUrl };
  }, [cameraState]);

  // Ensure stream stops when navigating away or hiding the tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && streamRef.current) {
        stopCamera('stopped');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraState,
    errorMessage,
    facingMode,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    selectDevice,
    captureFrame,
  };
}
