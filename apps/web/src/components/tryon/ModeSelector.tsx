import React from 'react';
import { Camera, Play, RotateCcw, Sparkles } from 'lucide-react';
import { TryOnMode } from '../../data/studioModels';

interface ModeSelectorProps {
  mode: TryOnMode;
  onModeChange: (mode: TryOnMode) => void;
  isGenerating?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange, isGenerating = false }) => {
  return (
    <div className="inline-flex p-1 rounded-2xl bg-stone-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        type="button"
        disabled={isGenerating}
        onClick={() => onModeChange('photo')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          mode === 'photo'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-semibold shadow-lg shadow-amber-500/20'
            : 'text-stone-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Camera className="w-3.5 h-3.5" />
        <span>Photo Try-On</span>
      </button>

      <button
        type="button"
        disabled={isGenerating}
        onClick={() => onModeChange('turnaround')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          mode === 'turnaround'
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20'
            : 'text-stone-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>360° Spin Turnaround</span>
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold tracking-wider">
          3D
        </span>
      </button>

      <button
        type="button"
        disabled={isGenerating}
        onClick={() => onModeChange('runway')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          mode === 'runway'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20'
            : 'text-stone-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Catwalk Runway Video</span>
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold tracking-wider flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" /> Motion
        </span>
      </button>
    </div>
  );
};
