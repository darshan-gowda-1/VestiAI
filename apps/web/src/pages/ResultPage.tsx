import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { TryOnJob } from '../types';
import { ComparisonSlider } from '../components/ui/comparison-slider';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Bookmark,
  Download,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  ArrowLeft,
  Heart,
  AlertCircle,
  Camera,
  ExternalLink,
} from 'lucide-react';

export const ResultPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const {
    jobsHistory,
    currentJob,
    savedLookIds,
    toggleSaveLook,
    fetchJobById,
    deleteJob,
    wishlist,
    toggleWishlist,
    setUploadedPersonPhoto,
    setSelectedGarment,
  } = useApp();
  const navigate = useNavigate();

  const cachedJob =
    (currentJob?.id === jobId ? currentJob : null) ||
    jobsHistory.find((j) => j.id === jobId) ||
    null;

  const [job, setJob] = useState<TryOnJob | null>(cachedJob);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedJob);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cachedJob) {
      setJob(cachedJob);
      setIsLoading(false);
      return;
    }
    if (!jobId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchJobById(jobId)
      .then((fetched) => {
        if (active) setJob(fetched);
      })
      .catch((err) => {
        if (active) setActionError(err instanceof ApiError ? err.message : 'Unable to load result.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jobId, cachedJob, fetchJobById]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-medium text-charcoal">No Result Found</h2>
        <p className="text-sm text-charcoal-muted font-light">
          {actionError || "We couldn't locate this try-on result. It may have expired or been deleted."}
        </p>
        <Link to="/tryon">
          <Button variant="primary">Go to Try-On Studio</Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(job.product.id);
  const isSavedLook = savedLookIds.includes(job.id);

  const handleDownload = () => {
    const targetUrl = job.resultImageUrl || job.product.imageUrl;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `vestiai-tryon-${job.id}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSave = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      await toggleSaveLook(job.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to save look.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(job.id);
      navigate('/history');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to delete result.');
    }
  };

  const handleWishlist = async () => {
    try {
      await toggleWishlist(job.product.id);
    } catch {
      navigate('/login');
    }
  };

  const handleRetakePhoto = () => {
    setUploadedPersonPhoto(null, null);
    setSelectedGarment(job.product);
    navigate('/try-on');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <Link
          to="/try-on"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Try-On Studio</span>
        </Link>
      </div>

      {job.status === 'failed' && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-red-900">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">AI Try-On Generation Failed</p>
              <p className="text-xs text-red-700">
                {job.error || 'The AI worker could not process this photo. Please try a clearer front-facing shot.'}
              </p>
            </div>
          </div>
          <Link to={`/try-on?productId=${job.product.id}`} className="shrink-0">
            <Button variant="primary" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry in Studio</span>
            </Button>
          </Link>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Comparison Slider */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
              Virtual Try-On Comparison
            </h1>
            <Badge variant="accent" className="font-mono text-xs">
              {job.isSimulated ? '2D Preview (Simulated)' : '2D AI Preview'}
            </Badge>
          </div>

          <ComparisonSlider
            originalImage={job.personImageUrl}
            resultImage={job.resultImageUrl || job.product.imageUrl}
            originalLabel="Your Original Photo"
            resultLabel="VestiAI Synthesized Preview"
          />

          <p className="text-[11px] text-charcoal-light text-center font-mono">
            Drag the central slider left or right to inspect neckline drape and contour alignment.
          </p>
        </div>

        {/* Right: Actions, Garment Info & Disclaimers */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-canvas-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                Garment Worn
              </span>
              <button
                onClick={handleWishlist}
                className={`p-1.5 rounded-full border transition-all ${
                  isWishlisted ? 'border-accent bg-accent text-white' : 'border-canvas-dark text-charcoal'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-20 bg-canvas-subtle rounded-xl overflow-hidden shrink-0 p-2 flex items-center justify-center">
                <img
                  src={job.product.imageUrl}
                  alt={job.product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base font-medium text-charcoal truncate">
                  {job.product.title}
                </p>
                <p className="text-xs text-charcoal-muted">
                  {job.product.color} • ${job.product.price}
                </p>
                <p className="text-[11px] text-charcoal-light">{job.product.material}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-canvas-subtle space-y-1.5 text-xs text-charcoal-light">
              <div className="flex items-center justify-between font-mono">
                <span className="truncate max-w-[180px]">Model: {job.modelName || '2d-tryon'}</span>
                <span className="text-emerald-700 font-sans font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{job.processingTimeMs ? `${(job.processingTimeMs / 1000).toFixed(2)}s` : 'Completed'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Generated: {new Date(job.createdAt).toLocaleDateString()}</span>
                <Link
                  to={`/product/${job.product.id}`}
                  className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
                >
                  <span>View Product</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-canvas-subtle rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <Button
              variant={isSavedLook ? 'accent' : 'primary'}
              size="md"
              isLoading={isSaving}
              onClick={handleToggleSave}
              className="w-full shadow-sm flex items-center justify-center space-x-2"
            >
              <Bookmark className={`w-4 h-4 ${isSavedLook ? 'fill-current' : ''}`} />
              <span>{isSavedLook ? 'Saved to My Looks' : 'Save Look'}</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleDownload}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Result</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Link to="/try-on" className="block w-full">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center space-x-1.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Another Garment</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetakePhoto}
                className="w-full flex items-center justify-center space-x-1.5 text-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Look & Uploaded Image</span>
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-canvas-dark text-xs text-charcoal-muted space-y-2">
            <div className="flex items-center space-x-1.5 font-medium text-charcoal">
              <Info className="w-4 h-4 text-accent shrink-0" />
              <span>AI Virtual Try-On Disclaimer</span>
            </div>
            <p className="text-[11px] text-charcoal-light leading-relaxed font-light">
              This image is synthesized by an AI generative model to assist visual shopping. It represents color, neckline, and aesthetic drape. It does not guarantee garment fit, exact tailoring measurements, or physical fabric physics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
