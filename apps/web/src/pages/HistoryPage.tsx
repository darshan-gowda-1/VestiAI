import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { History, Trash2, Sparkles, Clock, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const HistoryPage: React.FC = () => {
  const { jobsHistory, deleteJob, deleteAllJobs } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-canvas-dark/60 pb-6">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs uppercase tracking-wider mb-1">
            Personal Gallery
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
            Try-On History & Saved Looks
          </h1>
          <p className="text-sm text-charcoal-muted font-light">
            Review past virtual try-on previews, compare original photographs, or remove records from storage.
          </p>
        </div>

        {jobsHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={deleteAllJobs}
            className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Clear All History</span>
          </Button>
        )}
      </div>

      {/* History Grid or Empty State */}
      {jobsHistory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobsHistory.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-canvas-dark/60 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Image Preview */}
              <div className="relative aspect-[3/4] bg-canvas-subtle overflow-hidden">
                <img
                  src={job.resultImageUrl || job.product.imageUrl}
                  alt={job.product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="accent" className="text-[10px] bg-white/90 backdrop-blur shadow-xs">
                    2D Preview
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => deleteJob(job.id)}
                    aria-label="Delete look"
                    className="p-1.5 rounded-full bg-white/80 hover:bg-red-50 text-charcoal hover:text-red-600 backdrop-blur shadow-xs transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta & CTA */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-charcoal-light font-medium uppercase">
                    {job.product.brand}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-charcoal line-clamp-1">
                    {job.product.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-charcoal-muted pt-1">
                    <Clock className="w-3.5 h-3.5 text-charcoal-light" />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{job.product.color}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-canvas-subtle flex items-center justify-between">
                  <Link to={`/result/${job.id}`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-accent" />
                      <span>Compare Before & After</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-canvas-dark bg-white/70 py-20 px-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-canvas-subtle border border-canvas-dark flex items-center justify-center text-charcoal-light mx-auto">
            <History className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-charcoal">No Previous Try-On Looks</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              You haven't generated any virtual try-on previews yet. Select a top and upload your photo to preview your first look.
            </p>
          </div>
          <Link to="/tryon">
            <Button variant="primary" size="sm" className="text-xs mt-2">
              <span>Enter Try-On Studio</span>
              <Sparkles className="w-3.5 h-3.5 ml-1.5 text-accent" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
