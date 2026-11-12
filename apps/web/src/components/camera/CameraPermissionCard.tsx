import React from 'react';
import { Camera, CameraOff, ShieldAlert, Upload, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/spinner';

export type CameraUiState =
  | 'not-started'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'stopped'
  | 'error';

interface CameraPermissionCardProps {
  state: Exclude<CameraUiState, 'active'>;
  errorMessage?: string | null;
  onStartCamera: () => void;
  onUploadFallback?: () => void;
}

export const CameraPermissionCard: React.FC<CameraPermissionCardProps> = ({
  state,
  errorMessage,
  onStartCamera,
  onUploadFallback,
}) => {
  const isDenied = state === 'denied';
  const isUnavailable = state === 'unavailable' || state === 'error';
  const isRequesting = state === 'requesting';

  const title = isRequesting
    ? 'Requesting Camera Access...'
    : isDenied
      ? 'Camera Permission Denied'
      : isUnavailable
        ? 'Camera Unavailable'
        : state === 'stopped'
          ? 'Camera Paused'
          : 'Enable Live Camera Try-On';

  const description =
    errorMessage ||
    (isDenied
      ? 'Allow camera access in your browser address bar to preview garments live, or upload a front-facing photo instead.'
      : isUnavailable
        ? 'No compatible camera device was detected. You can still upload a front-facing upper-body photo.'
        : 'Your camera feed stays private in your browser until you capture a frame for AI try-on.');

  return (
    <div className="w-full h-full min-h-[340px] rounded-2xl border border-dashed border-canvas-dark bg-canvas-subtle/70 flex flex-col items-center justify-center text-center p-6 sm:p-8">
      <div className="w-14 h-14 rounded-2xl bg-canvas border border-canvas-dark flex items-center justify-center mb-4 shadow-sm">
        {isRequesting ? (
          <LoadingSpinner size="lg" />
        ) : isDenied ? (
          <ShieldAlert className="w-7 h-7 text-amber-700" />
        ) : isUnavailable ? (
          <CameraOff className="w-7 h-7 text-charcoal-muted" />
        ) : (
          <Camera className="w-7 h-7 text-accent" />
        )}
      </div>

      <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-charcoal-muted max-w-md mb-6 leading-relaxed">{description}</p>

      {!isRequesting && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onStartCamera} size="lg" className="gap-2">
            {state === 'stopped' || isDenied ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{state === 'stopped' ? 'Resume Camera' : 'Start Camera'}</span>
          </Button>
          {onUploadFallback && (
            <Button variant="outline" size="lg" onClick={onUploadFallback} className="gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

