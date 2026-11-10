import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const GuidanceCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-canvas-subtle p-5 border border-canvas-dark/60 space-y-3">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
          Photo Guidance for Best 2D Try-On
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-charcoal">Frontal Pose</p>
            <p className="text-charcoal-muted text-[11px] leading-tight">Stand facing camera with arms relaxed at your sides.</p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-charcoal">Clear Upper Torso</p>
            <p className="text-charcoal-muted text-[11px] leading-tight">Avoid crossed arms, scarves, or bags blocking chest.</p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-charcoal">Balanced Lighting</p>
            <p className="text-charcoal-muted text-[11px] leading-tight">Even daylight or neutral indoor lighting reduces artifacts.</p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-canvas-dark/40 flex items-center space-x-1.5 text-[11px] text-charcoal-light">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-accent" />
        <span>Accepted formats: JPG, PNG, WebP (Max 10 MB). Minimum recommended size: 512×512 px.</span>
      </div>
    </div>
  );
};
