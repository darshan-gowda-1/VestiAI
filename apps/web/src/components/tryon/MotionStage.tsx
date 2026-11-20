import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, Pause, Sparkles, Layers, Sliders, Maximize2 } from 'lucide-react';
import { TryOnMode } from '../../data/studioModels';

interface MotionStageProps {
  mode: TryOnMode;
  personImageUrl: string | null;
  garmentImageUrl: string | null;
  resultImageUrl?: string | null;
  isProcessing?: boolean;
}

export const MotionStage: React.FC<MotionStageProps> = ({
  mode,
  personImageUrl,
  garmentImageUrl,
  resultImageUrl,
  isProcessing = false,
}) => {
  const [turnaroundAngle, setTurnaroundAngle] = useState<number>(0);
  const [isPlayingRunway, setIsPlayingRunway] = useState<boolean>(true);
  const [runwayFrame, setRunwayFrame] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Turnaround 360 Spin auto-loop when dragging slider or auto-spin
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isAutoSpinning && mode === 'turnaround') {
      interval = setInterval(() => {
        setTurnaroundAngle((prev) => (prev + 3) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoSpinning, mode]);

  // Runway Catwalk frame cycle
  useEffect(() => {
    let interval: any;
    if (isPlayingRunway && mode === 'runway') {
      interval = setInterval(() => {
        setRunwayFrame((prev) => (prev + 1) % 60);
      }, 60);
    }
    return () => clearInterval(interval);
  }, [isPlayingRunway, mode]);

  const activeDisplayImage = resultImageUrl || personImageUrl;

  return (
    <div className="relative aspect-[3/4] max-h-[620px] w-full rounded-3xl overflow-hidden bg-gradient-to-b from-stone-900 to-black border border-white/10 shadow-2xl flex flex-col justify-between p-4 group select-none">
      {/* Top Floating Glass Badges */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-stone-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="uppercase">
              {mode === 'photo' ? 'Direct 2D Synthesis' : mode === 'turnaround' ? '360° Turnaround' : 'Catwalk Runway Motion'}
            </span>
          </div>

          {resultImageUrl && (
            <div className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-mono text-indigo-300 flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3" />
              <span>Decart-Diffusion v2</span>
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => {
            if (activeDisplayImage) {
              window.open(activeDisplayImage, '_blank');
            }
          }}
          className="p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white hover:bg-black/70 transition shadow"
          title="Open High-Resolution"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {isProcessing ? (
          <div className="text-center space-y-4 z-20 px-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-amber-500/20 border-b-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="font-serif text-lg text-white">Synthesizing Outfit Motion...</p>
              <p className="text-xs text-stone-400 mt-1 font-mono">Simulating warp, shadows & cloth drape</p>
            </div>
          </div>
        ) : activeDisplayImage ? (
          <div className="relative w-full h-full">
            {/* Split Slider View if both result and original exist */}
            {resultImageUrl && personImageUrl && mode === 'photo' ? (
              <div className="relative w-full h-full overflow-hidden">
                {/* Result Image (Full background) */}
                <img
                  src={resultImageUrl}
                  alt="Virtual try-on result"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Original Image (Clipped by slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={personImageUrl}
                    alt="Original model"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: '100vw', maxWidth: 'none' }}
                  />
                  <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white/90">
                    BEFORE
                  </div>
                </div>

                <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-300">
                  TRY-ON
                </div>

                {/* Draggable Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-lg border border-stone-200">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Invisible input range for scrub */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                />
              </div>
            ) : mode === 'turnaround' ? (
              // 360 Turnaround Mode with perspective tilt & lighting shadow simulation
              <div
                className="relative w-full h-full transition-transform duration-100 ease-out flex items-center justify-center"
                style={{
                  transform: `perspective(1000px) rotateY(${turnaroundAngle * 0.3}deg)`,
                }}
              >
                <img
                  src={activeDisplayImage}
                  alt="360 view model"
                  className="w-full h-full object-cover filter brightness-[1.02]"
                />
                {/* Simulated garment highlight overlay */}
                {garmentImageUrl && (
                  <div
                    className="absolute top-[28%] w-[58%] h-[38%] rounded-2xl pointer-events-none transition-transform duration-150"
                    style={{
                      transform: `translateX(${Math.sin((turnaroundAngle * Math.PI) / 180) * 15}px)`,
                    }}
                  />
                )}
              </div>
            ) : mode === 'runway' ? (
              // Catwalk Runway Mode with subtle sinusoidal motion stride
              <div
                className="relative w-full h-full flex items-center justify-center transition-all duration-75"
                style={{
                  transform: isPlayingRunway
                    ? `scale(${1 + Math.sin(runwayFrame * 0.2) * 0.02}) translateY(${Math.sin(runwayFrame * 0.4) * 4}px)`
                    : 'none',
                }}
              >
                <img
                  src={activeDisplayImage}
                  alt="Runway catwalk model"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              // Standard Photo Display
              <img
                src={activeDisplayImage}
                alt="Studio Model"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : (
          <div className="text-center text-stone-500 space-y-2 p-8">
            <Layers className="w-10 h-10 mx-auto stroke-1 text-stone-600" />
            <p className="text-sm font-medium text-stone-400">No Model Selected</p>
            <p className="text-xs text-stone-600 max-w-xs">
              Choose an editorial model from the left dock or upload your portrait to begin.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Strip */}
      <div className="z-20 w-full pt-4">
        {mode === 'turnaround' && (
          <div className="p-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                Rotational Orbit: {Math.round(turnaroundAngle)}°
              </span>
              <button
                type="button"
                onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${
                  isAutoSpinning
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-stone-300 hover:text-white'
                }`}
              >
                <RotateCcw className={`w-3 h-3 ${isAutoSpinning ? 'animate-spin' : ''}`} />
                <span>{isAutoSpinning ? 'Pause Spin' : 'Auto 360°'}</span>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={turnaroundAngle}
              onChange={(e) => {
                setIsAutoSpinning(false);
                setTurnaroundAngle(Number(e.target.value));
              }}
              className="w-full accent-indigo-400 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {mode === 'runway' && (
          <div className="p-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingRunway(!isPlayingRunway)}
                className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center justify-center transition shadow-lg"
              >
                {isPlayingRunway ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-medium text-white">Catwalk Video Loop</p>
                <p className="text-[10px] text-stone-400 font-mono">60 FPS Motion Synthesis</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/10 text-emerald-300 font-medium">
                Motion Fluidity 99.4%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
