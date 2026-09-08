'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  User,
  ArrowLeft,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

type AuthMethod = 'email' | 'phone';
type EmailMode = 'signin' | 'register' | 'forgot';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const {
    login,
    register,
    resetPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    isAuthenticated,
    checkAuth,
    isLoading,
  } = useAuthStore();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');

  // Form states - Email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');

  // Form states - Phone
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [phoneName, setPhoneName] = useState('');

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    checkAuth();

    const verified = searchParams.get('verified');
    const errParam = searchParams.get('error');

    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now access your account.');
    } else if (errParam) {
      if (errParam === 'invalid_verification_link') {
        setError('Verification link is invalid or has expired. Please request a new link.');
      } else {
        setError(errParam);
      }
    }
  }, [checkAuth, searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  // Timer for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (authMethod === 'phone' && phoneStep === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authMethod, phoneStep, timer]);

  // Focus OTP box
  useEffect(() => {
    if (authMethod === 'phone' && phoneStep === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [authMethod, phoneStep]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // ─── Email Handlers ───

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Failed to sign in.');
    } else {
      setSuccess('Signed in successfully! Redirecting...');
      setTimeout(() => router.push(redirectPath), 400);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const res = await register(fullName, email, password);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    } else if (res.requiresEmailConfirmation) {
      setSuccess('Registration successful! Please check your email to verify your account.');
    } else {
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => router.push(redirectPath), 400);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const res = await resetPassword(email);
    if (!res.success) {
      setError(res.error || 'Failed to send password reset email.');
    } else {
      setSuccess(res.message || 'Password reset link sent to your email.');
    }
  };

  // ─── Phone OTP Handlers ───

  const formatPhoneDisplay = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(raw);
    clearMessages();
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (!digit && !value) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      if (index > 0) otpRefs.current[index - 1]?.focus();
      return;
    }
    if (!digit) return;

    const newDigits = [...otpDigits];
    newDigits[index] = digit.charAt(0);
    setOtpDigits(newDigits);
    clearMessages();

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const otpString = otpDigits.join('');

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = await sendPhoneOtp(phone);
    if (!res.success) {
      setError(res.error || 'Failed to send verification code.');
    } else {
      setPhoneStep('otp');
      setTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccess(res.message || 'Verification code sent!');
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    const res = await verifyPhoneOtp(phone, otpString, phoneName);
    if (!res.success) {
      setError(res.error || 'Invalid code. Please try again.');
    } else {
      setSuccess('Verified! Signing you in...');
      setTimeout(() => router.push(redirectPath), 400);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (!canResend) return;
    clearMessages();
    const res = await sendPhoneOtp(phone);
    if (res.success) {
      setTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccess('New verification code sent.');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
        <div className="login-bg-circle login-bg-circle-3" />
      </div>

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-brand-panel">
          <Link href="/" className="login-brand-logo">
            <Sparkles size={24} />
            <span>Sarang Living</span>
          </Link>
          <div className="login-brand-content">
            <h2 className="login-brand-heading">
              Welcome to
              <br />
              Sarang Living
            </h2>
            <p className="login-brand-text">
              Premium Korean-inspired hair accessories crafted with love.
              Sign in to manage your orders, save delivery addresses, and enjoy
              exclusive member privileges.
            </p>
            <div className="login-brand-features">
              <div className="login-feature-item">
                <ShieldCheck size={18} />
                <span>Supabase Secure Authentication</span>
              </div>
              <div className="login-feature-item">
                <Lock size={18} />
                <span>Encrypted credentials &amp; session security</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={18} />
                <span>Instant profile &amp; order access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="login-form-card"
          >
            {/* Method switch tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F3F4F6',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '24px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  clearMessages();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: authMethod === 'email' ? 600 : 500,
                  color: authMethod === 'email' ? '#111827' : '#6B7280',
                  background: authMethod === 'email' ? '#FFFFFF' : 'transparent',
                  boxShadow: authMethod === 'email' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Mail size={16} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  clearMessages();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: authMethod === 'phone' ? 600 : 500,
                  color: authMethod === 'phone' ? '#111827' : '#6B7280',
                  background: authMethod === 'phone' ? '#FFFFFF' : 'transparent',
                  boxShadow: authMethod === 'phone' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Phone size={16} />
                <span>Mobile OTP</span>
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="login-alert login-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="login-alert login-alert-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  EMAIL AUTHENTICATION MODE
                 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {authMethod === 'email' && (
                <motion.div
                  key={`email-${emailMode}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {emailMode === 'signin' && (
                    <>
                      <h1 className="login-heading">Sign In with Email</h1>
                      <p className="login-description">
                        Enter your email and password to access your account.
                      </p>

                      <form onSubmit={handleEmailSignIn} className="login-form">
                        <div className="login-field">
                          <label htmlFor="login-email">Email Address</label>
                          <div className="login-input-wrap">
                            <Mail size={18} className="login-input-icon" />
                            <input
                              id="login-email"
                              type="email"
                              placeholder="name@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              autoComplete="email"
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="login-field">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <label htmlFor="login-password">Password</label>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailMode('forgot');
                                clearMessages();
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '12px',
                                color: '#7B8FA1',
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 500,
                              }}
                            >
                              Forgot Password?
                            </button>
                          </div>
                          <div className="login-input-wrap">
                            <Lock size={18} className="login-input-icon" />
                            <input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="current-password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '14px',
                                background: 'none',
                                border: 'none',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                              }}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="login-submit-btn"
                        >
                          {isLoading ? (
                            <span className="login-spinner" />
                          ) : (
                            <>
                              Sign In
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </form>

                      <div
                        style={{
                          marginTop: '20px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#6B7280',
                        }}
                      >
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('register');
                            clearMessages();
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#7B8FA1',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Register here
                        </button>
                      </div>
                    </>
                  )}

                  {emailMode === 'register' && (
                    <>
                      <h1 className="login-heading">Create Account</h1>
                      <p className="login-description">
                        Join Sarang Living to track orders and save your delivery details.
                      </p>

                      <form onSubmit={handleEmailRegister} className="login-form">
                        <div className="login-field">
                          <label htmlFor="reg-name">Full Name</label>
                          <div className="login-input-wrap">
                            <User size={18} className="login-input-icon" />
                            <input
                              id="reg-name"
                              type="text"
                              placeholder="Your full name"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="login-field">
                          <label htmlFor="reg-email">Email Address</label>
                          <div className="login-input-wrap">
                            <Mail size={18} className="login-input-icon" />
                            <input
                              id="reg-email"
                              type="email"
                              placeholder="name@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              autoComplete="email"
                              required
                            />
                          </div>
                        </div>

                        <div className="login-field">
                          <label htmlFor="reg-password">Password</label>
                          <div className="login-input-wrap">
                            <Lock size={18} className="login-input-icon" />
                            <input
                              id="reg-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="At least 6 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="new-password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '14px',
                                background: 'none',
                                border: 'none',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                              }}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="login-submit-btn"
                        >
                          {isLoading ? (
                            <span className="login-spinner" />
                          ) : (
                            <>
                              Create Account
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </form>

                      <div
                        style={{
                          marginTop: '20px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#6B7280',
                        }}
                      >
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('signin');
                            clearMessages();
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#7B8FA1',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Sign in
                        </button>
                      </div>
                    </>
                  )}

                  {emailMode === 'forgot' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMode('signin');
                          clearMessages();
                        }}
                        className="login-back-btn"
                        style={{ marginBottom: '16px' }}
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Sign In</span>
                      </button>

                      <h1 className="login-heading">Reset Password</h1>
                      <p className="login-description">
                        Enter your account email. We&apos;ll send you a password reset link.
                      </p>

                      <form onSubmit={handleForgotPassword} className="login-form">
                        <div className="login-field">
                          <label htmlFor="forgot-email">Email Address</label>
                          <div className="login-input-wrap">
                            <Mail size={18} className="login-input-icon" />
                            <input
                              id="forgot-email"
                              type="email"
                              placeholder="name@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="login-submit-btn"
                        >
                          {isLoading ? (
                            <span className="login-spinner" />
                          ) : (
                            <>
                              Send Reset Link
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </motion.div>
              )}

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  PHONE OTP AUTHENTICATION MODE
                 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {authMethod === 'phone' && (
                <motion.div
                  key={`phone-${phoneStep}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {phoneStep === 'phone' && (
                    <>
                      <h1 className="login-heading">Sign in with Mobile</h1>
                      <p className="login-description">
                        Enter your 10-digit mobile number for one-time code verification.
                      </p>

                      <form onSubmit={handleSendPhoneOtp} className="login-form">
                        <div className="login-field">
                          <label htmlFor="login-phone">Mobile Number</label>
                          <div className="login-phone-input">
                            <div className="login-country-code">
                              <span className="login-flag">🇮🇳</span>
                              <span>+91</span>
                            </div>
                            <input
                              id="login-phone"
                              type="tel"
                              inputMode="numeric"
                              placeholder="98765 43210"
                              value={formatPhoneDisplay(phone)}
                              onChange={handlePhoneChange}
                              autoComplete="tel"
                              maxLength={11}
                              autoFocus
                            />
                          </div>
                          <span className="login-field-hint">
                            {phone.length}/10 digits
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || phone.length < 10}
                          className="login-submit-btn"
                        >
                          {isLoading ? (
                            <span className="login-spinner" />
                          ) : (
                            <>
                              Get Verification Code
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}

                  {phoneStep === 'otp' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStep('phone');
                          clearMessages();
                        }}
                        className="login-back-btn"
                      >
                        <ArrowLeft size={16} />
                        <span>Change Number</span>
                      </button>

                      <h1 className="login-heading">Verify Your Number</h1>
                      <p className="login-description">
                        Enter the 6-digit code sent to{' '}
                        <strong className="login-phone-highlight">
                          +91 {formatPhoneDisplay(phone)}
                        </strong>
                      </p>

                      <form onSubmit={handleVerifyPhoneOtp} className="login-form">
                        <div className="login-field">
                          <label>Verification Code</label>
                          <div className="login-otp-boxes" onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => {
                                  otpRefs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                className={`login-otp-box ${digit ? 'filled' : ''}`}
                                autoComplete="one-time-code"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="login-resend-row">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleResendPhoneOtp}
                              className="login-resend-btn"
                              disabled={isLoading}
                            >
                              <RotateCcw size={14} />
                              Resend Code
                            </button>
                          ) : (
                            <span className="login-timer">
                              Resend in <strong>{timer}s</strong>
                            </span>
                          )}
                        </div>

                        <div className="login-field">
                          <label htmlFor="login-phone-name">
                            Your Name <span className="login-optional">(first time only)</span>
                          </label>
                          <div className="login-input-wrap">
                            <User size={18} className="login-input-icon" />
                            <input
                              id="login-phone-name"
                              type="text"
                              placeholder="Your full name"
                              value={phoneName}
                              onChange={(e) => setPhoneName(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || otpString.length < 6}
                          className="login-submit-btn"
                        >
                          {isLoading ? (
                            <span className="login-spinner" />
                          ) : (
                            <>
                              Verify &amp; Sign In
                              <CheckCircle2 size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="login-footer">
              <ShieldCheck size={14} />
              <span>Protected by Supabase Auth Security</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <div className="login-loading">
            <div className="login-spinner" />
            <span>Loading authentication...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
