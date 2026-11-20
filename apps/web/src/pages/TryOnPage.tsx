import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { ApiError } from '../services/api';
import { STUDIO_MODELS, StudioModel, TryOnMode, LIGHTING_PRESETS } from '../data/studioModels';
import { ModeSelector } from '../components/tryon/ModeSelector';
import { ModelPresetDock } from '../components/tryon/ModelPresetDock';
import { MotionStage } from '../components/tryon/MotionStage';
import { GarmentSidebar } from '../components/tryon/GarmentSidebar';
import { useCameraStream } from '../hooks/useCameraStream';
import { useToast } from '../components/ui/toast';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Camera,
  Upload,
  AlertCircle,
  Sun,
  Sunrise,
  Moon,
  CloudSun,
} from 'lucide-react';
import { Button } from '../components/ui/button';

export const TryOnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    products,
    selectedGarment,
    setSelectedGarment,
    uploadedPersonImage,
    uploadedPersonFile,
    setUploadedPersonPhoto,
    consentGiven,
    setConsentGiven,
    startTryOnJob,
    currentUser,
    wishlist,
    toggleWishlist,
  } = useApp();

  const { addToCart, isLoading: isCartLoading } = useCart();
  const { showToast } = useToast();
  const camera = useCameraStream();

  // Anywear Studio States
  const [mode, setMode] = useState<TryOnMode>('photo');
  const [modelSource, setModelSource] = useState<'roster' | 'custom'>('roster');
  const [selectedModel, setSelectedModel] = useState<StudioModel>(STUDIO_MODELS[0]);
  const [selectedPoseId, setSelectedPoseId] = useState<string>(STUDIO_MODELS[0].poses[0].id);
  const [activeLighting, setActiveLighting] = useState<string>(LIGHTING_PRESETS[0].id);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<boolean>(false);
  const [activeResultUrl, setActiveResultUrl] = useState<string | null>(null);

  // Sync selected product from URL query param if present
  useEffect(() => {
    const prodId = searchParams.get('productId');
    if (prodId && products.length > 0) {
      const match = products.find((p) => p.id === prodId);
      if (match) setSelectedGarment(match);
    }
  }, [searchParams, products, setSelectedGarment]);

  // Current active garment (defaults to first catalog item if none explicitly chosen)
  const activeGarment = selectedGarment || products[0] || null;

  // Selected Pose Image from Roster
  const currentPose =
    selectedModel.poses.find((p) => p.id === selectedPoseId) || selectedModel.poses[0];

  // Active Person Image to feed into the try-on synthesis
  const activePersonImageUrl =
    modelSource === 'custom' ? uploadedPersonImage : currentPose.imageUrl;

  const handleCaptureFrame = async () => {
    const captured = await camera.captureFrame();
    if (captured) {
      setUploadedPersonPhoto(captured.previewUrl, captured.file);
      setModelSource('custom');
      showToast({
        title: 'Camera Snapshot Ready',
        description: 'Your photo is staged for virtual try-on synthesis.',
        variant: 'success',
      });
    }
  };

  const handleRunTryOn = async () => {
    if (!activeGarment) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (modelSource === 'custom' && !consentGiven) {
      setConsentError(true);
      return;
    }

    setConsentError(false);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // If using model roster, fetch its image as a blob
      let fileToSubmit = uploadedPersonFile;
      if (modelSource === 'roster' || !fileToSubmit) {
        const resp = await fetch(currentPose.imageUrl);
        const blob = await resp.blob();
        fileToSubmit = new File([blob], `${selectedModel.id}-${selectedPoseId}.jpg`, {
          type: 'image/jpeg',
        });
      }

      const job = await startTryOnJob(activeGarment, fileToSubmit, 'upper_body');
      if (job.status === 'completed' && job.resultImageUrl) {
        setActiveResultUrl(job.resultImageUrl);
        showToast({
          title: 'Outfit Synthesized!',
          description: `Generated realistic drape in ${mode} mode.`,
          variant: 'success',
        });
      } else if (job.status === 'failed') {
        setSubmitError(job.error || 'Diffusion synthesis failed. Please retry.');
      }
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Processing error. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLightingIcon = (id: string) => {
    switch (id) {
      case 'light-infinity':
        return <Sun className="w-3.5 h-3.5" />;
      case 'light-golden':
        return <Sunrise className="w-3.5 h-3.5" />;
      case 'light-moody':
        return <Moon className="w-3.5 h-3.5" />;
      default:
        return <CloudSun className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-stone-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Studio Header & Mode Switcher */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono uppercase tracking-wider font-semibold">
              Anywear Engine 2.0
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-xs text-stone-400 font-mono">Neural Cloth Dynamics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide mt-1">
            VestiAI Virtual Fitting Studio
          </h1>
        </div>

        {/* Mode Selector Pill */}
        <ModeSelector mode={mode} onModeChange={setMode} isGenerating={isSubmitting} />
      </div>

      {/* Main Studio 3-Column Workspace */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 items-start">
        {/* ======================================================== */}
        {/* LEFT DOCK: Model & Garment Selection (4 Columns)          */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar Source Switcher */}
          <div className="p-4 rounded-3xl bg-stone-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-medium">
                1. Select Avatar / Person
              </span>
              <div className="flex rounded-xl p-0.5 bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setModelSource('roster')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    modelSource === 'roster'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Model Roster
                </button>
                <button
                  type="button"
                  onClick={() => setModelSource('custom')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    modelSource === 'custom'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  My Photo / Camera
                </button>
              </div>
            </div>

            {modelSource === 'roster' ? (
              <ModelPresetDock
                models={STUDIO_MODELS}
                selectedModelId={selectedModel.id}
                onSelectModel={(m) => {
                  setSelectedModel(m);
                  setSelectedPoseId(m.poses[0].id);
                  setActiveResultUrl(null);
                }}
                activePoseId={selectedPoseId}
                onSelectPose={(pId) => {
                  setSelectedPoseId(pId);
                  setActiveResultUrl(null);
                }}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void camera.startCamera()}
                    className="flex-1 text-xs border-white/20 text-stone-200"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    <span>Live Webcam</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('custom-photo-file');
                      if (input) input.click();
                    }}
                    className="flex-1 text-xs border-white/20 text-stone-200"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>Upload Image</span>
                  </Button>
                </div>

                <input
                  id="custom-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setUploadedPersonPhoto(url, file);
                    }
                  }}
                />

                {camera.cameraState === 'active' && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-[3/4]">
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 inset-x-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureFrame}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow"
                      >
                        Capture Pose
                      </button>
                      <button
                        type="button"
                        onClick={() => camera.stopCamera()}
                        className="px-3 py-2 bg-stone-900/80 text-stone-300 text-xs rounded-xl border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Studio Lighting Presets */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                Lighting Atmosphere
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {LIGHTING_PRESETS.map((lp) => (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => setActiveLighting(lp.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition ${
                      activeLighting === lp.id
                        ? 'border-amber-400/80 bg-amber-400/10 text-white'
                        : 'border-white/5 bg-stone-950/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span className="text-amber-300">{renderLightingIcon(lp.id)}</span>
                    <div className="truncate">
                      <p className="text-[11px] font-medium leading-none">{lp.label}</p>
                      <p className="text-[9px] text-stone-500 mt-0.5">{lp.ambient}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Garment Catalog Dock */}
          <div className="p-4 rounded-3xl bg-stone-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-medium">
                2. Select Garment
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {products.length} catalog items
              </span>
            </div>

            <GarmentSidebar
              products={products}
              selectedGarmentId={activeGarment?.id || null}
              wishlistIds={wishlist}
              onSelectGarment={(p) => {
                setSelectedGarment(p);
                setActiveResultUrl(null);
              }}
              onToggleWishlist={(id) => void toggleWishlist(id)}
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER STAGE: Interactive Decart-Style Motion Canvas (5 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <MotionStage
            mode={mode}
            personImageUrl={activePersonImageUrl}
            garmentImageUrl={activeGarment?.imageUrl || null}
            resultImageUrl={activeResultUrl}
            isProcessing={isSubmitting}
          />

          {submitError && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Processing Consent for custom uploaded photos */}
          {modelSource === 'custom' && (
            <div
              className={`p-3 rounded-2xl border transition-all text-xs ${
                consentError
                  ? 'border-red-400 bg-red-500/10'
                  : 'border-white/10 bg-stone-900/60 text-stone-300'
              }`}
            >
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    if (e.target.checked) setConsentError(false);
                  }}
                  className="mt-0.5 accent-amber-500 rounded"
                />
                <span className="text-[11px] text-stone-400">
                  I consent to private 2D/video diffusion image synthesis on this portrait.
                </span>
              </label>
            </div>
          )}

          {/* Big Neon Try-On Action Bar */}
          <button
            type="button"
            disabled={isSubmitting || !activeGarment}
            onClick={handleRunTryOn}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 disabled:opacity-50 text-stone-950 font-bold uppercase tracking-wider text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 fill-stone-950 group-hover:scale-110 transition-transform" />
            <span>
              {isSubmitting
                ? 'Synthesizing Look...'
                : currentUser
                ? `Synthesize ${mode === 'photo' ? 'Photo' : mode === 'turnaround' ? '360° Turnaround' : 'Catwalk Runway'}`
                : 'Sign In to Synthesize Look'}
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* RIGHT DOCK: Garment Specs, Sizing & Instant Bag (3 Cols)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-5">
          {activeGarment ? (
            <div className="p-5 rounded-3xl bg-stone-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
              <div className="aspect-[4/3] rounded-2xl bg-stone-950 border border-white/5 overflow-hidden p-3 flex items-center justify-center relative">
                <img
                  src={activeGarment.imageUrl}
                  alt={activeGarment.title}
                  className="w-full h-full object-contain filter drop-shadow-lg"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-stone-300">
                  {activeGarment.categoryLabel}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  {activeGarment.brand}
                </p>
                <h3 className="text-base font-medium text-white mt-0.5 line-clamp-1">
                  {activeGarment.title}
                </h3>
                <p className="text-xl font-mono font-bold text-stone-100 mt-1">
                  ${activeGarment.price.toFixed(2)}
                </p>
              </div>

              {/* Fabric & Material Physics */}
              <div className="py-3 border-y border-white/5 space-y-2 text-xs text-stone-300">
                <div className="flex justify-between">
                  <span className="text-stone-500">Fabric</span>
                  <span className="font-medium text-stone-200">{activeGarment.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Silhouette</span>
                  <span className="font-medium text-stone-200">{activeGarment.fit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Color Tone</span>
                  <span className="font-medium text-stone-200">{activeGarment.color}</span>
                </div>
              </div>

              {/* Sizing & Add to Bag */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Available Sizes</span>
                  <span className="text-[10px] text-emerald-400 font-mono">In Stock</span>
                </div>
                <div className="flex gap-1.5">
                  {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="flex-1 py-1.5 text-xs font-mono font-medium rounded-lg border border-white/10 bg-stone-950/60 hover:border-amber-400 hover:text-white transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isCartLoading}
                    onClick={() => addToCart(activeGarment.id, 1, 'M')}
                    className="flex-1 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add To Shopping Bag</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(activeGarment.id)}
                    className={`p-3 rounded-xl border transition ${
                      wishlist.includes(activeGarment.id)
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                        : 'border-white/10 bg-stone-950/60 text-stone-400 hover:text-white'
                    }`}
                    title={wishlist.includes(activeGarment.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlist.includes(activeGarment.id) ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-stone-900/40 border border-white/5 text-center text-stone-500">
              Select a garment from catalog
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
