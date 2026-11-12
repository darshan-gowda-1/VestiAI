import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <Link to="/" className="inline-flex items-center text-xs text-charcoal-muted hover:text-charcoal gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          Terms of Use &amp; Contact
        </h1>
        <p className="text-sm text-charcoal-muted">
          Guidelines for using VestiAI Live Camera, 2D AI Virtual Try-On, Fashion Store, and Browser Extension.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-canvas-dark/60 p-6 sm:p-8 space-y-6 text-sm text-charcoal-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-charcoal flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <span>1. Visual Preview Disclaimer</span>
          </h2>
          <p>
            VestiAI generates 2D image-to-image virtual try-on previews for visual inspiration. Generated images do not represent certified tailoring measurements, fabric stretch, or guaranteed physical sizing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-charcoal flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>2. Camera &amp; Image Ownership</span>
          </h2>
          <p>
            Webcam feeds stay strictly in your browser until you explicitly capture a frame and submit a try-on job with consent. You retain ownership of uploaded photographs and may delete your jobs and data at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-charcoal flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            <span>3. Contact &amp; Academic Support</span>
          </h2>
          <p>
            For questions regarding this project, data removal, or extension support, review our{' '}
            <Link to="/privacy" className="text-accent underline">
              Privacy &amp; Responsible AI Policy
            </Link>{' '}
            or manage your account in{' '}
            <Link to="/profile" className="text-accent underline">
              Profile Settings
            </Link>
            .
          </p>
        </section>
      </div>

      <Link to="/try-on">
        <Button size="lg">Return to Try-On Studio</Button>
      </Link>
    </div>
  );
};
