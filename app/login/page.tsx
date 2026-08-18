'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  User,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

function PhoneOtpLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { sendPhoneOtp, verifyPhoneOtp, isAuthenticated, checkAuth, isLoading } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [step, timer]);

  // Focus first OTP input when entering step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const formatPhoneDisplay = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(raw);
    setError(null);
  };

  // OTP individual digit handlers
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (!digit && !value) {
      // Backspace on empty — move to previous
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
    setError(null);

    // Auto-advance to next input
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = await sendPhoneOtp(phone);
    if (!res.success) {
      setError(res.error || 'Failed to send verification code.');
    } else {
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccess(res.message || 'Verification code sent!');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    const res = await verifyPhoneOtp(phone, otpString, name);
    if (!res.success) {
      setError(res.error || 'Invalid code. Please try again.');
    } else {
      setSuccess('Verified! Signing you in...');
      setTimeout(() => router.push(redirectPath), 600);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setSuccess(null);
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
              Welcome to<br />Sarang Living
            </h2>
            <p className="login-brand-text">
              Premium hair accessories crafted with love.
              Sign in with your phone number to access your account,
              track orders, and enjoy exclusive member benefits.
            </p>
            <div className="login-brand-features">
              <div className="login-feature-item">
                <ShieldCheck size={18} />
                <span>Secure OTP verification</span>
              </div>
              <div className="login-feature-item">
                <Lock size={18} />
                <span>No passwords to remember</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={18} />
                <span>Instant account access</span>
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
            {/* Step indicator */}
            <div className="login-steps">
              <div className={`login-step-dot ${step === 'phone' ? 'active' : 'done'}`}>
                {step === 'otp' ? <CheckCircle2 size={14} /> : '1'}
              </div>
              <div className="login-step-line" />
              <div className={`login-step-dot ${step === 'otp' ? 'active' : ''}`}>2</div>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── STEP 1: Phone Number ─── */}
              {step === 'phone' && (
                <motion.div
                  key="step-phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="login-heading">Sign in with Mobile</h1>
                  <p className="login-description">
                    Enter your 10-digit mobile number. We&apos;ll send a one-time verification code via SMS.
                  </p>

                  {/* Alerts */}
                  {error && (
                    <div className="login-alert login-alert-error">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendOtp} className="login-form">
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

                  <p className="login-terms">
                    By continuing, you agree to our{' '}
                    <a href="/terms">Terms of Service</a> and{' '}
                    <a href="/privacy">Privacy Policy</a>.
                  </p>
                </motion.div>
              )}

              {/* ─── STEP 2: OTP Verification ─── */}
              {step === 'otp' && (
                <motion.div
                  key="step-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="login-back-btn"
                  >
                    <ArrowLeft size={16} />
                    <span>Change Number</span>
                  </button>

                  <h1 className="login-heading">Verify Your Number</h1>
                  <p className="login-description">
                    Enter the 6-digit code sent to{' '}
                    <strong className="login-phone-highlight">+91 {formatPhoneDisplay(phone)}</strong>
                  </p>

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

                  <form onSubmit={handleVerifyOtp} className="login-form">
                    {/* OTP boxes */}
                    <div className="login-field">
                      <label>Verification Code</label>
                      <div className="login-otp-boxes" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
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

                    {/* Resend row */}
                    <div className="login-resend-row">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
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

                    {/* Name field */}
                    <div className="login-field">
                      <label htmlFor="login-name">Your Name <span className="login-optional">(first time only)</span></label>
                      <div className="login-input-wrap">
                        <User size={18} className="login-input-icon" />
                        <input
                          id="login-name"
                          type="text"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="login-footer">
              <ShieldCheck size={14} />
              <span>End-to-end encrypted verification</span>
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
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <PhoneOtpLoginContent />
    </Suspense>
  );
}
