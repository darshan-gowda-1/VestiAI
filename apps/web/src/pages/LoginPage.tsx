import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Shield, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setError(null);
    login('user');
    navigate('/catalog');
  };

  const handleDemoLogin = (role: 'user' | 'admin') => {
    login(role);
    if (role === 'admin') navigate('/admin');
    else navigate('/catalog');
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
            Sign in to access your personal try-on history and saved looks.
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
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Sign In
          </Button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div className="pt-2 border-t border-canvas-subtle space-y-3">
          <p className="text-[11px] text-center text-charcoal-light uppercase font-semibold">
            College Demo Shortcuts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDemoLogin('user')}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
              <span>Demo Shopper</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDemoLogin('admin')}
              className="text-xs"
            >
              <Shield className="w-3.5 h-3.5 mr-1 text-accent" />
              <span>Demo Admin</span>
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-charcoal-muted">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-semibold text-charcoal hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
