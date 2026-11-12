import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 space-y-6">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </Link>

      <div className="bg-white rounded-3xl border border-canvas-dark/60 p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-canvas-subtle border border-canvas-dark flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5 text-accent" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-charcoal">Reset Password</h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Enter your account email to request a password reset.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Request Recorded</span>
            </div>
            <p className="leading-relaxed">
              If an account exists for <strong>{email}</strong>, contact your VestiAI administrator to reset credentials when SMTP email delivery is not configured in this academic environment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Account Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

