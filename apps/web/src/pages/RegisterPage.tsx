import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export const RegisterPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!terms) {
      setError('Please agree to the privacy and consent policy.');
      return;
    }
    setError(null);
    login('user');
    navigate('/catalog');
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-canvas-dark shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-charcoal text-canvas font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
            V
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
            Create an Account
          </h1>
          <p className="text-xs text-charcoal-muted font-light">
            Join VestiAI to save looks and preview tops on your portraits.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />

          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@college.edu"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <label className="flex items-start space-x-2 text-xs text-charcoal-muted cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-canvas-dark text-accent focus:ring-accent"
            />
            <span>I accept the 2D Virtual Try-On Terms & Consent Agreement.</span>
          </label>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Register Account
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-muted pt-2 border-t border-canvas-subtle">
          <span>Already registered? </span>
          <Link to="/login" className="font-semibold text-charcoal hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

