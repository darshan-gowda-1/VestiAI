import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : '/catalog');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-canvas-dark shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-charcoal text-canvas font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
            V
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
            Welcome to VestiAI
          </h1>
          <p className="text-xs text-charcoal-muted font-light">
            Sign in to access your personal try-on history, wishlist, and saved looks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="shopper@college.edu"
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-muted pt-2 border-t border-canvas-subtle">
          <span>Don&apos;t have an account yet? </span>
          <Link to="/register" className="font-semibold text-charcoal hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
