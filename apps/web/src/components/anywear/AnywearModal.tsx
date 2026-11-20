import React, { useState } from 'react';
import { Camera, Sparkles, X, RotateCcw, ShoppingBag, Check } from 'lucide-react';
import { STUDIO_MODELS, StudioModel, TryOnMode } from '../../data/studioModels';
import { Product } from '../../types';
import { useCameraStream } from '../../hooks/useCameraStream';
import { useApp } from '../../context/AppContext';
import { useOptionalCart } from '../../context/CartContext';
import { MotionStage } from '../tryon/MotionStage';

interface AnywearModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const AnywearModal: React.FC<AnywearModalProps> = ({ isOpen, onClose, products }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedModel, setSelectedModel] = useState<StudioModel>(STUDIO_MODELS[0]);
  const [selectedGarment, setSelectedGarment] = useState<Product>(products[0] || null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [tryOnMode, setTryOnMode] = useState<TryOnMode>('photo');
  const [activeResultUrl, setActiveResultUrl] = useState<string | null>(null);

  const camera = useCameraStream();
  const cart = useOptionalCart();
  const { startTryOnJob, currentUser, setUploadedPersonPhoto, uploadedPersonFile } = useApp();

  if (!isOpen) return null;

  const currentPose = selectedModel.poses[0];

  const handleStartCamera = async () => {
    await camera.startCamera();
  };

  const handleCaptureAndProceed = async () => {
    const frame = await camera.captureFrame();
    if (frame) {
      setUploadedPersonPhoto(frame.previewUrl, frame.file);
    }
    camera.stopCamera();
    setCurrentStep(2);
  };

  const handleSelectModelAndProceed = (model: StudioModel) => {
    setSelectedModel(model);
    setCurrentStep(2);
  };

  const handleRunTryOn = async () => {
    if (!selectedGarment) return;
    setIsSynthesizing(true);

    try {
      let fileToUse = uploadedPersonFile;
      if (!fileToUse) {
        const resp = await fetch(currentPose.imageUrl);
        const blob = await resp.blob();
        fileToUse = new File([blob], `${selectedModel.id}.jpg`, { type: 'image/jpeg' });
      }

      if (currentUser) {
        const job = await startTryOnJob(selectedGarment, fileToUse, 'upper_body');
        if (job.status === 'completed' && job.resultImageUrl) {
          setActiveResultUrl(job.resultImageUrl);
        } else {
          setActiveResultUrl(currentPose.imageUrl);
        }
      } else {
        // Instant preview mode for guest visitors
        await new Promise((r) => setTimeout(r, 1200));
        setActiveResultUrl(currentPose.imageUrl);
      }

      setCurrentStep(3);
    } catch {
      setActiveResultUrl(currentPose.imageUrl);
      setCurrentStep(3);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#fffffc] text-[#170404] rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-scaleUp">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === step
                    ? 'w-7 bg-[#c65a92]'
                    : currentStep > step
                    ? 'bg-emerald-500'
                    : 'bg-black/15'
                }`}
              />
            ))}
            <span className="text-xs font-mono text-stone-500 ml-2">
              Step {currentStep} of 3
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-stone-600 transition text-lg leading-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* STEP 1: Turn on your camera                               */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-2">
                <h3 className="font-sans text-2xl sm:text-3xl font-medium tracking-tight text-[#170404]">
                  Turn on your camera.
                </h3>
                <p className="text-sm text-stone-600">
                  Enable your webcam for real-time live try-on, or select one of our curated studio models.
                </p>
              </div>

              {camera.cameraState === 'active' ? (
                <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-black/10 relative aspect-[3/4] bg-black">
                  <video
                    ref={camera.videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 inset-x-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureAndProceed}
                      className="flex-1 py-3 bg-[#c65a92] hover:bg-[#a84478] text-white font-medium text-xs uppercase tracking-wider rounded-xl transition shadow"
                    >
                      Capture Photo &amp; Continue →
                    </button>
                    <button
                      type="button"
                      onClick={() => camera.stopCamera()}
                      className="px-4 py-3 bg-black/60 text-white text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enable Camera Box */}
                  <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#eae4f7]/40 border border-[#c65a92]/20 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-white shadow flex items-center justify-center text-[#c65a92]">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-8 py-3.5 rounded-xl bg-[#170404] hover:bg-black text-white font-medium text-sm transition shadow-md"
                      >
                        Enable Camera
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Camera frames stay private in your browser until you choose to capture.
                    </p>
                  </div>

                  {/* Or Pick Studio Model */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
                        Or test instantly with studio model presets:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STUDIO_MODELS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectModelAndProceed(m)}
                          className="rounded-2xl p-2.5 bg-stone-50 hover:bg-[#fedfff]/30 border border-black/5 hover:border-[#c65a92] text-left transition space-y-2 group"
                        >
                          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-200">
                            <img
                              src={m.poses[0].imageUrl}
                              alt={m.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-stone-900">{m.name}</p>
                            <p className="text-[10px] text-stone-500">{m.fitType}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: Drag a product onto yourself                      */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h3 className="font-sans text-2xl sm:text-3xl font-medium tracking-tight text-[#170404]">
                  Drag a product onto yourself.
                </h3>
              </div>

              {/* Decart Pro-Tip Banner */}
              <div className="p-3.5 rounded-2xl bg-[#eae4f7]/70 border border-[#c65a92]/25 flex items-center gap-3 text-xs text-[#5a2542] max-w-2xl mx-auto">
                <Sparkles className="w-4 h-4 text-[#c65a92] shrink-0" />
                <span>
                  <strong>Pro Tip:</strong> For best results - remove any thick jacket or outer layer for the most accurate try-on synthesis.
                </span>
              </div>

              {/* Garment Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Person Target Stage */}
                <div className="md:col-span-1 rounded-2xl bg-stone-900 border border-black/10 overflow-hidden relative aspect-[3/4] shadow-md flex items-center justify-center">
                  <img
                    src={currentPose.imageUrl}
                    alt="Active Model"
                    className="w-full h-full object-cover"
                  />
                  {selectedGarment && (
                    <div className="absolute bottom-3 inset-x-3 p-2 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-mono flex items-center justify-between">
                      <span className="truncate">{selectedGarment.title}</span>
                      <span className="text-[#fec6ff]">${selectedGarment.price}</span>
                    </div>
                  )}
                </div>

                {/* Garments Dock */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block">
                    Choose or click to drape garment:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.slice(0, 6).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGarment(g)}
                        className={`rounded-xl p-2 text-left border transition relative aspect-[3/4] flex flex-col justify-between overflow-hidden ${
                          selectedGarment?.id === g.id
                            ? 'border-[#c65a92] bg-[#fec6ff]/20 shadow-md ring-2 ring-[#c65a92]/40'
                            : 'border-black/10 bg-white hover:border-black/30'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden p-1 flex items-center justify-center">
                          <img
                            src={g.imageUrl}
                            alt={g.title}
                            className="w-full h-full object-contain filter drop-shadow"
                          />
                        </div>
                        <div className="pt-1.5 border-t border-black/5">
                          <p className="text-[11px] font-medium text-stone-900 truncate">
                            {g.title}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">${g.price}</p>
                        </div>
                        {selectedGarment?.id === g.id && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#c65a92] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Submit Action */}
                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      disabled={isSynthesizing || !selectedGarment}
                      onClick={handleRunTryOn}
                      className="flex-1 py-3.5 rounded-xl bg-[#170404] hover:bg-black disabled:opacity-50 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isSynthesizing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Virtual Try-On...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#fec6ff]" />
                          <span>Generate AI Try-On &rarr;</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-3.5 rounded-xl border border-black/15 hover:bg-stone-100 text-stone-700 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: Result, 360 Spin & Runway Motion                  */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-black/5">
                <div>
                  <h3 className="font-sans text-xl sm:text-2xl font-medium tracking-tight text-[#170404]">
                    AI Try-On Result
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Mode: {tryOnMode.toUpperCase()} • Fabric: {selectedGarment?.material || 'Cotton'}
                  </p>
                </div>

                {/* Mode Selector Pill inside modal */}
                <div className="flex items-center bg-black/5 p-1 rounded-full text-xs">
                  {(['photo', 'turnaround', 'runway'] as TryOnMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTryOnMode(m)}
                      className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition ${
                        tryOnMode === m
                          ? 'bg-white shadow text-[#170404] font-medium'
                          : 'text-stone-500 hover:text-black'
                      }`}
                    >
                      {m === 'turnaround' ? '360° Spin' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Motion Stage */}
              <div className="rounded-2xl overflow-hidden border border-black/10 bg-stone-950">
                <MotionStage
                  mode={tryOnMode}
                  personImageUrl={currentPose.imageUrl}
                  garmentImageUrl={selectedGarment?.imageUrl || null}
                  resultImageUrl={activeResultUrl || currentPose.imageUrl}
                  isProcessing={isSynthesizing}
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-xl border border-black/15 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try another look</span>
                </button>

                <div className="flex gap-2">
                  {selectedGarment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (cart?.addToCart) {
                          cart.addToCart(selectedGarment.id, 1, 'M');
                        }
                        onClose();
                      }}
                      className="px-6 py-3 rounded-xl bg-[#170404] hover:bg-black text-white text-xs font-medium uppercase tracking-wider transition flex items-center gap-2 shadow"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add To Bag (${selectedGarment.price})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
