import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Trash2, Clock, Info, EyeOff } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2 border-b border-canvas-dark/60 pb-6">
        <Badge variant="secondary" className="text-xs uppercase tracking-wider">
          Privacy & Responsible AI
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          How VestiAI Protects Your Photographs
        </h1>
        <p className="text-sm text-charcoal-muted font-light leading-relaxed">
          Your portraits belong solely to you. Below is our transparent commitment covering consent, private storage, metadata removal, retention limits, and responsible AI scope.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-charcoal font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif text-lg">Explicit Consent Required</h2>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            Photos are never processed without your active confirmation. Every try-on request logs a timestamped consent record tied strictly to 2D virtual preview generation.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-charcoal font-medium">
            <Lock className="w-5 h-5 text-accent" />
            <h2 className="font-serif text-lg">Private Storage & Signed URLs</h2>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            Uploaded portraits and generated outputs are isolated in private storage and accessible only to your authenticated session via short-lived cryptographic signed URLs.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-charcoal font-medium">
            <EyeOff className="w-5 h-5 text-accent" />
            <h2 className="font-serif text-lg">EXIF & GPS Stripping</h2>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            On upload, our image validator re-encodes clean pixel buffers, automatically stripping all camera EXIF, GPS location, and device metadata before storage.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-canvas-dark/60 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-charcoal font-medium">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif text-lg">7-Day Retention & Instant Purge</h2>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            Temporary uploads and results expire automatically after 7 days, or immediately when you delete individual looks or purge all data from your profile.
          </p>
        </div>
      </div>

      {/* Responsible Use & Limitations */}
      <div className="bg-canvas-subtle rounded-3xl p-6 sm:p-8 border border-canvas-dark/60 space-y-3">
        <div className="flex items-center space-x-2 text-charcoal font-medium">
          <Info className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-xl">Responsible AI & 2D Scope Notice</h2>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-muted leading-relaxed font-light">
          <li>VestiAI generates 2D image-to-image visual previews and does not guarantee exact physical fit, tailoring measurements, or garment sizing.</li>
          <li>User photos are never used to train, fine-tune, or evaluate external machine learning models.</li>
          <li>Admin job monitoring excludes personal photographs, emails, and private storage keys.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-canvas-dark">
        <div className="space-y-0.5">
          <p className="font-serif text-base font-medium text-charcoal">Manage Your Data</p>
          <p className="text-xs text-charcoal-muted">Review consent preferences or permanently delete all your stored photos.</p>
        </div>
        <Link to="/profile">
          <Button variant="primary" size="sm" className="text-xs">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Open Profile & Data Controls</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

