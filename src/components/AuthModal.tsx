import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { X, Lock, Mail, User, Shield, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle, loginAsDemoUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('creator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await signUp(name, email, password, role);
      }
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'admin' | 'creator' | 'user') => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoUser(demoRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Devpost-style Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#003E54] text-white shrink-0">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">
              {mode === 'signin' ? 'Log in to AI FAQ Assistant' : 'Create an Account'}
            </h3>
            <p className="text-xs text-teal-200/90 mt-0.5">
              Firebase Authentication · JWT Stateless Tokens
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded hover:bg-[#002C3D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Quick Demo Switcher */}
          <div className="p-3.5 sm:p-4 bg-[#F4F6F8] border-b border-zinc-200">
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#008272]" />
              Quick Demo Logins (Role-Based Access):
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="text-center py-2 px-2 rounded bg-white border border-zinc-300 hover:border-[#003E54] hover:bg-zinc-50 transition cursor-pointer shadow-2xs"
              >
                <div className="text-xs font-bold text-zinc-900">Admin</div>
                <div className="text-[10px] text-zinc-500">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('creator')}
                disabled={loading}
                className="text-center py-2 px-2 rounded bg-white border border-zinc-300 hover:border-[#003E54] hover:bg-zinc-50 transition cursor-pointer shadow-2xs"
              >
                <div className="text-xs font-bold text-zinc-900">Creator</div>
                <div className="text-[10px] text-zinc-500">Create & Edit</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                disabled={loading}
                className="text-center py-2 px-2 rounded bg-white border border-zinc-300 hover:border-[#003E54] hover:bg-zinc-50 transition cursor-pointer shadow-2xs"
              >
                <div className="text-xs font-bold text-zinc-900">User</div>
                <div className="text-[10px] text-zinc-500">Read & Upvote</div>
              </button>
            </div>
          </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 text-center transition cursor-pointer border-b-2 ${
              mode === 'signin'
                ? 'border-[#003E54] text-[#003E54] bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 bg-[#F4F6F8]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-center transition cursor-pointer border-b-2 ${
              mode === 'signup'
                ? 'border-[#003E54] text-[#003E54] bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 bg-[#F4F6F8]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-semibold rounded border border-zinc-300 shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase tracking-wider my-2">
            <span className="flex-1 h-px bg-zinc-200"></span>
            <span>or sign in with email</span>
            <span className="flex-1 h-px bg-zinc-200"></span>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
                >
                  <option value="creator">Content Creator (Create & Generate AI FAQs)</option>
                  <option value="user">Authenticated User (Browse, Search, Vote Helpful)</option>
                  <option value="admin">System Admin (Full CRUD permissions)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@writeflow.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#00EAA6] hover:bg-[#00c78d] disabled:opacity-60 text-[#003E54] font-bold text-sm rounded shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-[#003E54] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Log In' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};
