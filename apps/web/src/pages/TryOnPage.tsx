import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ImageUploader } from '../components/tryon/ImageUploader';
import { GuidanceCard } from '../components/tryon/GuidanceCard';
import { GarmentSelectorModal } from '../components/tryon/GarmentSelectorModal';
import { JobProgressView } from '../components/tryon/JobProgressView';
import { Sparkles, RefreshCw, ShieldCheck, Shirt, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const TryOnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    products,
    selectedGarment,
    setSelectedGarment,
    uploadedPersonImage,
    setUploadedPersonImage,
    consentGiven,
    setConsentGiven,
    currentJob,
    startTryOnJob,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // Set selected garment from URL parameter if provided
  useEffect(() => {
    const prodId = searchParams.get('productId');
    if (prodId) {
      const match = products.find((p) => p.id === prodId);
      if (match) setSelectedGarment(match);
    }
  }, [searchParams, products, setSelectedGarment]);

  const activeGarment = selectedGarment || products[0];

  const handleSubmitTryOn = async () => {
    if (!uploadedPersonImage) return;

    if (!consentGiven) {
      setConsentError(true);
      return;
    }
    setConsentError(false);

    const completedJob = await startTryOnJob(activeGarment, uploadedPersonImage);
    if (completedJob) {
      navigate(`/result/${completedJob.id}`);
    }
  };

  // If a job is currently queued or processing, show the progress view
  if (currentJob && (currentJob.status === 'queued' || currentJob.status === 'processing')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <JobProgressView
          job={currentJob}
          onCancel={() => navigate('/catalog')}
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

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photo Upload & Guidance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-medium text-charcoal flex items-center justify-between">
              <span>Step 1: Your Photograph</span>
              {uploadedPersonImage && (
                <span className="text-xs text-emerald-700 font-sans font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Photo Ready</span>
                </span>
              )}
            </h2>
            <ImageUploader
              image={uploadedPersonImage}
              onImageSelected={(url) => setUploadedPersonImage(url)}
              onImageRemoved={() => setUploadedPersonImage(null)}
            />
          </div>

          {/* Guidance Card */}
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
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                <span>Change Garment</span>
              </Button>
            </div>

            {/* Active Garment Card */}
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
              disabled={!uploadedPersonImage}
              onClick={handleSubmitTryOn}
              className="w-full shadow-md"
            >
              <span>Generate Virtual Try-On</span>
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>

            {!uploadedPersonImage && (
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
