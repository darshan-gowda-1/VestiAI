import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { ImageUploader } from '../components/tryon/ImageUploader';
import { GuidanceCard } from '../components/tryon/GuidanceCard';
import { GarmentSelectorModal } from '../components/tryon/GarmentSelectorModal';
import { JobProgressView } from '../components/tryon/JobProgressView';
import { GarmentSidebar } from '../components/tryon/GarmentSidebar';
import { DropTargetStage } from '../components/tryon/DropTargetStage';
import { LiveCameraStage } from '../components/camera/LiveCameraStage';
import { useCameraStream } from '../hooks/useCameraStream';
import { useToast } from '../components/ui/toast';
import { Sparkles, RefreshCw, ShieldCheck, Shirt, AlertCircle, Lock, Camera, Upload, X } from 'lucide-react';
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
    wishlist,
    toggleWishlist,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [hasClearedGarment, setHasClearedGarment] = useState(false);

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

  const activeGarment = selectedGarment ?? (hasClearedGarment ? null : products[0] || null);

  const handleSelectOrDropGarment = (product: typeof products[number], viaDrop = false) => {
    setHasClearedGarment(false);
    setSelectedGarment(product);
    if (viaDrop) {
      showToast({
        title: 'Garment Selected',
        description: `${product.title} is ready for 2D AI try-on.`,
        variant: 'info',
      });
    }
  };

  const handleRemoveGarment = () => {
    setHasClearedGarment(true);
    setSelectedGarment(null);
  };

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

      {/* Main 3-Column Desktop / Stacked Mobile Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Garment Selection Sidebar (3 cols on desktop, carousel below camera on mobile) */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <GarmentSidebar
            products={products}
            selectedGarmentId={activeGarment?.id || null}
            wishlistIds={wishlist}
            onSelectGarment={(p) => handleSelectOrDropGarment(p, false)}
            onToggleWishlist={(id) => void toggleWishlist(id)}
          />
        </div>

        {/* Center Column: Camera / Upload + Drop Target (5 cols on desktop, top on mobile) */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-medium text-charcoal flex items-center gap-2">
                <span>Camera or Photo</span>
                {uploadedPersonImage && (
                  <span className="text-xs text-emerald-700 font-sans font-medium flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ready</span>
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

            <DropTargetStage
              products={products}
              onGarmentDropped={(p) => handleSelectOrDropGarment(p, true)}
            >
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
            </DropTargetStage>
          </div>

          <GuidanceCard />
        </div>

        {/* Right Column: Selected Garment, Consent & Try This Look (4 cols on desktop) */}
        <div className="lg:col-span-4 order-3 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-medium text-charcoal">
                Selected Garment
              </h2>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  disabled={products.length === 0}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>Replace</span>
                </Button>
                {activeGarment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveGarment}
                    aria-label="Remove garment"
                    className="text-xs text-charcoal-muted hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {isCatalogLoading ? (
              <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            ) : activeGarment ? (
              <div className="bg-white rounded-3xl p-5 border border-canvas-dark/60 shadow-sm space-y-4">
                <div className="aspect-[4/4] bg-canvas-subtle rounded-2xl overflow-hidden p-4 flex items-center justify-center relative">
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
              <div className="bg-white rounded-3xl p-8 border border-dashed border-canvas-dark text-center space-y-2 text-xs text-charcoal-muted">
                <Shirt className="w-7 h-7 mx-auto text-canvas-dark" />
                <p>No garment selected. Drag a top onto the camera stage or click one from the panel.</p>
              </div>
            )}
          </div>

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
                  I confirm that I own this photograph or have explicit authorization to process it. I consent to private 2D diffusion image synthesis for virtual clothing preview.
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

          {/* Submit Action Well */}
          <div className="bg-canvas-subtle rounded-2xl p-5 border border-canvas-dark/60 space-y-3">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-medium text-charcoal">
                Try This Look
              </h4>
              <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                Runs asynchronous 2D AI try-on on your captured or uploaded image.
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
              <span>{currentUser ? 'Try This Look' : 'Sign In to Try This Look'}</span>
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>

            {!uploadedPersonFile && (
              <p className="text-[11px] text-center text-charcoal-light">
                Capture a camera frame or upload a photo to enable AI generation.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Garment Selector Modal */}
      <GarmentSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(garment) => handleSelectOrDropGarment(garment, false)}
      />
    </div>
  );
};
