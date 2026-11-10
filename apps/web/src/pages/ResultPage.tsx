import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ComparisonSlider } from '../components/ui/comparison-slider';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Download,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  ArrowLeft,
  Heart,
} from 'lucide-react';

export const ResultPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { jobsHistory, currentJob, deleteJob, wishlist, toggleWishlist } = useApp();
  const navigate = useNavigate();

  // Find job from current or history
  const job =
    (currentJob?.id === jobId ? currentJob : null) ||
    jobsHistory.find((j) => j.id === jobId) ||
    jobsHistory[0];

  if (!job) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-medium text-charcoal">No Result Found</h2>
        <p className="text-sm text-charcoal-muted font-light">
          We couldn't locate this try-on result. It may have expired or been deleted.
        </p>
        <Link to="/tryon">
          <Button variant="primary">Go to Try-On Studio</Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(job.product.id);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = job.resultImageUrl || job.product.imageUrl;
    link.download = `vestiai-tryon-${job.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    deleteJob(job.id);
    navigate('/history');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/tryon"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Fitting Studio</span>
        </Link>
      </div>

      {/* Main Results View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Comparison Slider (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
              Virtual Try-On Comparison
            </h1>
            <Badge variant="accent" className="font-mono text-xs">
              2D AI Preview
            </Badge>
          </div>

          {/* Interactive Split Comparison Slider */}
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

        {/* Right: Actions, Garment Info & Disclaimers (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Garment Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-canvas-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                Garment Worn
              </span>
              <button
                onClick={() => toggleWishlist(job.product.id)}
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
                <p className="text-xs text-charcoal-muted">{job.product.color} • ${job.product.price}</p>
                <p className="text-[11px] text-charcoal-light">{job.product.material}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-charcoal-light font-mono">
              <span>Job ID: {job.id}</span>
              <span className="text-emerald-700 font-sans font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved in History</span>
              </span>
            </div>
          </div>

          {/* Action Buttons Well */}
          <div className="bg-canvas-subtle rounded-2xl p-6 border border-canvas-dark/60 space-y-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleDownload}
              className="w-full shadow-sm flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res Preview</span>
            </Button>

            <Link to="/tryon" className="block w-full">
              <Button variant="secondary" size="md" className="w-full flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Try Another Upper-Body Top</span>
              </Button>
            </Link>

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

          {/* S06 Fit Disclaimer Notice */}
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
