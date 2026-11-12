import React from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Aperture,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { CameraPermissionCard, CameraUiState } from './CameraPermissionCard';

interface LiveCameraStageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraState: CameraUiState;
  errorMessage: string | null;
  facingMode: 'user' | 'environment';
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  capturedPreviewUrl: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onSelectDevice: (deviceId: string) => void;
  onCaptureFrame: () => void;
  onRetake: () => void;
  onSwitchToUpload: () => void;
}

export const LiveCameraStage: React.FC<LiveCameraStageProps> = ({
  videoRef,
  cameraState,
  errorMessage,
  facingMode,
  devices,
  selectedDeviceId,
  capturedPreviewUrl,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onSelectDevice,
  onCaptureFrame,
  onRetake,
  onSwitchToUpload,
}) => {
  const showCaptured = Boolean(capturedPreviewUrl);
  const isLive = cameraState === 'active' && !showCaptured;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] max-h-[560px] w-full rounded-2xl overflow-hidden bg-charcoal/5 border border-canvas-dark">
        {/* Video element kept mounted so ref attaches cleanly when stream starts */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Live camera preview"
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? '-scale-x-100' : ''
          } ${isLive ? 'block' : 'hidden'}`}
        />

        {showCaptured && capturedPreviewUrl ? (
          <img
            src={capturedPreviewUrl}
            alt="Captured frame for AI try-on"
            className="w-full h-full object-cover"
          />
        ) : null}

        {!showCaptured && cameraState !== 'active' && (
          <div className="w-full h-full">
            <CameraPermissionCard
              state={cameraState}
              errorMessage={errorMessage}
              onStartCamera={onStartCamera}
              onUploadFallback={onSwitchToUpload}
            />
          </div>
        )}

        {/* Top Live Indicator */}
        {isLive && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal/80 text-canvas text-xs font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Camera Active</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-charcoal/70 text-canvas/90 text-[11px] backdrop-blur-sm">
              Framing Preview • Capture for AI Try-On
            </div>
          </div>
        )}
      </div>

      {/* Camera Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {showCaptured ? (
            <Button variant="secondary" size="sm" onClick={onRetake} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Retake Photo</span>
            </Button>
          ) : cameraState === 'active' ? (
            <>
              <Button variant="primary" size="sm" onClick={onCaptureFrame} className="gap-1.5">
                <Aperture className="w-4 h-4" />
                <span>Capture Frame</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onSwitchCamera} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Camera</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onStopCamera} className="gap-1.5 text-red-700 hover:bg-red-50">
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onStartCamera} className="gap-1.5">
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {devices.length > 1 && cameraState === 'active' && !showCaptured && (
            <select
              aria-label="Select camera device"
              value={selectedDeviceId || ''}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="text-xs rounded-lg border border-canvas-dark bg-white px-2.5 py-1.5 text-charcoal"
            >
              {devices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={onSwitchToUpload} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

