import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { ImageUploader } from '../components/tryon/ImageUploader';
import { GuidanceCard } from '../components/tryon/GuidanceCard';
import { GarmentSelectorModal } from '../components/tryon/GarmentSelectorModal';
import { JobProgressView } from '../components/tryon/JobProgressView';
import { LiveCameraStage } from '../components/camera/LiveCameraStage';
import { useCameraStream } from '../hooks/useCameraStream';
import { useToast } from '../components/ui/toast';
import { Sparkles, RefreshCw, ShieldCheck, Shirt, AlertCircle, Lock, Camera, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export const TryOnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    products,
    isCatalogLoading,
    selectedGarment,
    setSelectedGarment,
    uploadedPersonImage,
    uploadedPersonFile,
    setUploadedPersonPhoto,
    consentGiven,
    setConsentGiven,
    currentJob,
    clearCurrentJob,
    startTryOnJob,
    cancelTryOnJob,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');

  const { showToast } = useToast();
  const camera = useCameraStream();

  const handleCaptureFrame = async () => {
    const captured = await camera.captureFrame();
    if (captured) {
      setUploadedPersonPhoto(captured.previewUrl, captured.file);
      showToast({
        title: 'Frame Captured',
        description: 'Your camera snapshot is ready for 2D AI try-on.',
        variant: 'success',
      });
    }
  };

  const handleRetake = () => {
    setUploadedPersonPhoto(null, null);
    if (camera.cameraState !== 'active') {
      void camera.startCamera();
    }
  };

  const handleSwitchMode = (mode: 'camera' | 'upload') => {
    setInputMode(mode);
    if (mode === 'upload' && camera.cameraState === 'active') {
      camera.stopCamera('stopped');
    }
  };

  useEffect(() => {
    const prodId = searchParams.get('productId');
    if (prodId && products.length > 0) {
      const match = products.find((p) => p.id === prodId);
      if (match) setSelectedGarment(match);
    }
  }, [searchParams, products, setSelectedGarment]);

  const activeGarment = selectedGarment || products[0] || null;

  const handleSubmitTryOn = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!uploadedPersonFile || !activeGarment) return;

    if (!consentGiven) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const finishedJob = await startTryOnJob(activeGarment, uploadedPersonFile, 'upper_body');
      if (finishedJob.status === 'completed') {
        navigate(`/result/${finishedJob.id}`);
      } else if (finishedJob.status === 'failed') {
        setSubmitError(finishedJob.error || 'AI try-on worker failed. Please try another photo.');
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Unable to submit try-on request. Please retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async () => {
    if (!currentJob) {
      clearCurrentJob();
      return;
    }
    try {
      await cancelTryOnJob(currentJob.id);
    } catch {
      clearCurrentJob();
    }
  };

  if (currentJob && (currentJob.status === 'queued' || currentJob.status === 'processing')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <JobProgressView
          job={currentJob}
          onCancel={handleCancelJob}
          onViewResult={() => navigate(`/result/${currentJob.id}`)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-canvas-dark/60 pb-6">
        <div className="flex items-center space-x-2">
          <Badge variant="accent" className="text-xs">
            2D Try-On Studio
          </Badge>
          <span className="text-xs text-charcoal-light">•</span>
          <span className="text-xs text-charcoal-muted">Upper-Body Tops</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          Virtual Fitting Studio
        </h1>
        <p className="text-sm text-charcoal-muted font-light max-w-2xl">
          Pair your front-facing portrait with any upper-body garment from our catalog. Our diffusion model synthesizes realistic drape and contours.
        </p>
      </div>

      {/* Authentication Notice if unauthenticated */}
      {!currentUser && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Sign in required:</strong> Photographs are stored privately under your account so only you can access generated results.
            </span>
          </div>
          <Link to="/login">
            <Button variant="primary" size="sm" className="text-xs whitespace-nowrap">
              Sign In / Register
            </Button>
          </Link>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photo Upload & Guidance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-medium text-charcoal flex items-center gap-2">
                <span>Step 1: Camera or Photograph</span>
                {uploadedPersonImage && (
                  <span className="text-xs text-emerald-700 font-sans font-medium flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Photo Ready</span>
                  </span>
                )}
              </h2>

              <div className="inline-flex rounded-xl border border-canvas-dark bg-canvas-subtle p-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('camera')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    inputMode === 'camera'
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('upload')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    inputMode === 'upload'
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {inputMode === 'camera' ? (
              <LiveCameraStage
                videoRef={camera.videoRef}
                cameraState={camera.cameraState}
                errorMessage={camera.errorMessage}
                facingMode={camera.facingMode}
                devices={camera.devices}
                selectedDeviceId={camera.selectedDeviceId}
                capturedPreviewUrl={uploadedPersonImage}
                onStartCamera={() => void camera.startCamera()}
                onStopCamera={() => camera.stopCamera('stopped')}
                onSwitchCamera={() => void camera.switchCamera()}
                onSelectDevice={(id) => void camera.selectDevice(id)}
                onCaptureFrame={() => void handleCaptureFrame()}
                onRetake={handleRetake}
                onSwitchToUpload={() => handleSwitchMode('upload')}
              />
            ) : (
              <ImageUploader
                image={uploadedPersonImage}
                onImageSelected={(url, file) => setUploadedPersonPhoto(url, file)}
                onImageRemoved={() => setUploadedPersonPhoto(null, null)}
              />
            )}
          </div>

          <GuidanceCard />

          {/* Mandatory Consent Checkbox */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              consentError
                ? 'border-red-400 bg-red-50/70'
                : 'border-canvas-dark bg-white shadow-xs'
            }`}
          >
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => {
                  setConsentGiven(e.target.checked);
                  if (e.target.checked) setConsentError(false);
                }}
                className="mt-1 h-4 w-4 rounded border-canvas-dark text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-charcoal block">
                  Mandatory Processing Consent
                </span>
                <span className="text-charcoal-muted leading-relaxed block font-light">
                  I confirm that I own this photograph or have explicit authorization to process it. I consent to temporary, private 2D diffusion image synthesis for the purpose of virtual clothing preview. I understand I may delete my photo at any time.
                </span>
              </div>
            </label>
            {consentError && (
              <div className="mt-2 text-xs text-red-600 font-medium flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>You must accept the consent agreement before submitting a try-on request.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Garment & Try-On Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium text-charcoal">
                Step 2: Selected Top
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={products.length === 0}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                <span>Change Garment</span>
              </Button>
            </div>

            {isCatalogLoading ? (
              <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            ) : activeGarment ? (
              <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-4">
                <div className="aspect-[4/5] bg-canvas-subtle rounded-2xl overflow-hidden p-6 flex items-center justify-center relative">
                  <img
                    src={activeGarment.imageUrl}
                    alt={activeGarment.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-xs text-[11px]">
                      {activeGarment.categoryLabel}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-charcoal-light uppercase font-semibold">
                    {activeGarment.brand}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-charcoal">
                    {activeGarment.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted">
                    Color: {activeGarment.color} • Material: {activeGarment.material}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-canvas-subtle text-xs">
                  <span className="font-semibold text-charcoal text-base">${activeGarment.price}</span>
                  <span className="text-emerald-700 font-medium flex items-center space-x-1">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>2D Model Compatible</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-canvas-dark text-center text-xs text-charcoal-muted">
                No catalog garments available. Please verify backend API connection.
              </div>
            )}
          </div>

          {/* Submit Action Well */}
          <div className="bg-canvas-subtle rounded-2xl p-6 border border-canvas-dark/60 space-y-4">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-medium text-charcoal">
                Ready to Synthesize
              </h4>
              <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                Click below to start the asynchronous AI diffusion pipeline.
              </p>
            </div>

            <Button
              variant="accent"
              size="lg"
              disabled={!uploadedPersonFile || !activeGarment || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmitTryOn}
              className="w-full shadow-md"
            >
              <span>{currentUser ? 'Generate Virtual Try-On' : 'Sign In to Generate'}</span>
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>

            {!uploadedPersonFile && (
              <p className="text-[11px] text-center text-charcoal-light">
                Please upload your photograph in Step 1 to enable generation.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Garment Selector Modal */}
      <GarmentSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(garment) => setSelectedGarment(garment)}
      />
    </div>
  );
};
