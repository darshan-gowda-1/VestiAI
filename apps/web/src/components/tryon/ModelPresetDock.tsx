import React from 'react';
import { StudioModel } from '../../data/studioModels';
import { Check, Sparkles } from 'lucide-react';

interface ModelPresetDockProps {
  models: StudioModel[];
  selectedModelId: string | null;
  onSelectModel: (model: StudioModel) => void;
  activePoseId: string | null;
  onSelectPose: (poseId: string) => void;
}

export const ModelPresetDock: React.FC<ModelPresetDockProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  activePoseId,
  onSelectPose,
}) => {
  const currentModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <div className="space-y-4">
      {/* Model Avatars Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
            Editorial Roster
          </span>
          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Studio Calibrated
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {models.map((model) => {
            const isSelected = model.id === currentModel?.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`group relative rounded-xl overflow-hidden border p-1 transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/50'
                    : 'border-white/10 bg-stone-900/40 hover:border-white/30'
                }`}
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-800 relative">
                  <img
                    src={model.avatarUrl}
                    alt={model.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-stone-950 rounded-full flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-1 text-center">
                  <p className="text-[11px] font-medium text-stone-200 truncate">{model.name}</p>
                  <p className="text-[9px] text-stone-500">{model.fitType}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Poses (if current model has multiple) */}
      {currentModel && currentModel.poses.length > 1 && (
        <div className="pt-2 border-t border-white/5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
            Stance & Angle
          </span>
          <div className="flex gap-2">
            {currentModel.poses.map((pose) => {
              const isPoseActive = (activePoseId || currentModel.poses[0].id) === pose.id;
              return (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => onSelectPose(pose.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all text-center ${
                    isPoseActive
                      ? 'border-indigo-400 bg-indigo-500/20 text-white shadow'
                      : 'border-white/10 bg-stone-900/40 text-stone-400 hover:text-white'
                  }`}
                >
                  {pose.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
