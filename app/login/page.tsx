'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, isValidEmail } from '@/store/authStore';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { login, register, resetPassword, isAuthenticated, checkAuth, isLoading } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  // Real-time email validation status
  const activeEmail = tab === 'login' ? loginEmail : tab === 'register' ? regEmail : forgotEmail;
  const isEmailValid = activeEmail.length > 0 && isValidEmail(activeEmail);
  const isEmailInvalid = activeEmail.length > 3 && !isEmailValid;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError('Please enter a valid, original email address (e.g. name@example.com).');
      return;
    }

    const result = await login(loginEmail, loginPassword);
    if (!result.success) {
      setError(result.error || 'Failed to sign in.');
    } else {
      setSuccess('Successfully authenticated! Redirecting to your dashboard...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setError('Please enter a valid, original email address (e.g. name@example.com).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const result = await register(regName, regEmail, regPassword);
    if (!result.success) {
      setError(result.error || 'Registration failed.');
    } else {
      setSuccess('Account created successfully! Welcome to Sarang Living.');
      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    const res = await resetPassword(forgotEmail);
    setForgotLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send reset email.');
    } else {
      setSuccess(res.message || 'Password reset link sent to your email.');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Decorative ambient background glows */}
      <div className="auth-ambient-glow glow-1" />
      <div className="auth-ambient-glow glow-2" />

      <div className="auth-card-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="auth-card"
        >
          {/* Header */}
          <div className="auth-header">
            <div className="auth-badge-pill">
              <ShieldCheck size={13} className="text-teal" />
              <span>SUPABASE SECURE AUTHENTICATION</span>
            </div>

            <h1 className="auth-title">
              {tab === 'login' && 'Welcome Back'}
              {tab === 'register' && 'Join Sarang Living'}
              {tab === 'forgot' && 'Reset Password'}
            </h1>
            
            <p className="auth-subtitle">
              {tab === 'login' && 'Sign in with your email to view your orders, saved addresses, and wishlist.'}
              {tab === 'register' && 'Create your account to enjoy fast checkout and curated member perks.'}
              {tab === 'forgot' && 'Enter your email address and we will send you a password reset link.'}
            </p>

            {/* Navigation Tabs */}
            {tab !== 'forgot' && (
              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'login'}
                  className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'register'}
                  className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('register');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="auth-alert error"
              >
                <AlertCircle size={18} className="alert-icon" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="auth-alert success"
              >
                <CheckCircle2 size={18} className="alert-icon" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="login-email">Email Address</label>
                  {isEmailValid && (
                    <span className="auth-valid-tag">
                      <CheckCircle2 size={12} /> Valid Email Format
                    </span>
                  )}
                </div>
                <div className={`auth-input-wrapper ${isEmailInvalid ? 'input-error' : ''} ${isEmailValid ? 'input-valid' : ''}`}>
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@domain.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {isEmailInvalid && (
                  <span className="auth-field-error">Please enter a complete email address (e.g., user@example.com)</span>
                )}
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="auth-forgot-link"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit-btn"
              >
                {isLoading ? (
                  <span className="auth-spinner">Authenticating...</span>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Eleanor Vance"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="reg-email">Original Email Address</label>
                  {isEmailValid && (
                    <span className="auth-valid-tag">
                      <CheckCircle2 size={12} /> Valid Email Format
                    </span>
                  )}
                </div>
                <div className={`auth-input-wrapper ${isEmailInvalid ? 'input-error' : ''} ${isEmailValid ? 'input-valid' : ''}`}>
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="name@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {isEmailInvalid && (
                  <span className="auth-field-error">Please enter an authentic email address (e.g., user@example.com)</span>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="reg-password">Password (Minimum 6 characters)</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit-btn"
              >
                {isLoading ? (
                  <span className="auth-spinner">Creating Account...</span>
                ) : (
                  <>
                    Create Account <Sparkles size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div className={`auth-input-wrapper ${isEmailInvalid ? 'input-error' : ''} ${isEmailValid ? 'input-valid' : ''}`}>
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="auth-submit-btn"
              >
                {forgotLoading ? (
                  <span className="auth-spinner">Sending Reset Link...</span>
                ) : (
                  <>
                    Send Reset Link <KeyRound size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setSuccess(null);
                }}
                className="auth-back-btn"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          <div className="auth-footer-note">
            Protected by <strong>Supabase Row Level Security</strong>. Your data is encrypted and safe.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="account-loading-container">
        <div className="account-spinner">Loading authentication...</div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
