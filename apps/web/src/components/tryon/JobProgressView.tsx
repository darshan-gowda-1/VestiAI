import React, { useEffect, useState } from 'react';
import { TryOnJob } from '../../types';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';

interface JobProgressViewProps {
  job: TryOnJob;
  onCancel: () => void;
  onViewResult: () => void;
}

export const JobProgressView: React.FC<JobProgressViewProps> = ({
  job,
  onCancel,
  onViewResult,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [job.status]);

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-canvas-dark shadow-xl max-w-xl mx-auto text-center space-y-8 animate-fadeIn">
      {/* Visual State Spinner / Graphic */}
      <div className="flex justify-center">
        {job.status === 'queued' && (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              Queued
            </span>
          </div>
        )}

        {job.status === 'processing' && (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
              Diffusion Active
            </span>
          </div>
        )}

        {job.status === 'completed' && (
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        )}

        {job.status === 'failed' && (
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Status Heading & Explanation */}
      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-medium text-charcoal">
          {job.status === 'queued' && 'Scheduling Try-On Job...'}
          {job.status === 'processing' && 'Synthesizing Upper-Body Drape...'}
          {job.status === 'completed' && 'Try-On Preview Ready!'}
          {job.status === 'failed' && 'Try-On Processing Failed'}
        </h3>

        <p className="text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
          {job.status === 'queued' &&
            'Your request is queued for the AI worker. Processing will begin shortly.'}
          {job.status === 'processing' &&
            `The 2D diffusion pipeline is mapping ${job.product.title} to your portrait while preserving pose and lighting.`}
          {job.status === 'completed' &&
            'Your high-resolution virtual try-on preview has been generated successfully.'}
          {job.status === 'failed' &&
            (job.error || 'The model encountered an error during inference. Please verify your photo pose and retry.')}
        </p>

        <div className="pt-2 font-mono text-xs text-charcoal-light">
          {job.status !== 'completed' && `Elapsed: ${elapsedSeconds}s • Job ID: ${job.id}`}
          {job.status === 'completed' && `Generated in ${(job.processingTimeMs ? job.processingTimeMs / 1000 : 3.4).toFixed(1)}s • Job ID: ${job.id}`}
        </div>
      </div>

      {/* Target Garment Mini-Preview */}
      <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-dark/60 flex items-center space-x-4 text-left">
        <div className="w-14 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-canvas-dark/40 p-1">
          <img
            src={job.product.imageUrl}
            alt={job.product.title}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-charcoal-light uppercase font-semibold">{job.product.categoryLabel}</p>
          <p className="text-sm font-medium text-charcoal truncate">{job.product.title}</p>
          <p className="text-xs text-charcoal-muted">{job.product.color}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {job.status === 'completed' ? (
          <Button variant="accent" size="lg" onClick={onViewResult} className="w-full sm:w-auto">
            <span>View Before & After Comparison</span>
            <Sparkles className="w-4 h-4 ml-1.5" />
          </Button>
        ) : job.status === 'failed' ? (
          <Button variant="primary" size="md" onClick={onCancel} className="w-full sm:w-auto">
            Return to Studio & Retry
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs text-charcoal-muted">
            Cancel Request
          </Button>
        )}
      </div>

      {/* Privacy guarantee footnote */}
      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-charcoal-light">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Your photograph is processed in private storage and never used for model training.</span>
      </div>
    </div>
  );
};
