'use client';

import { Suspense, useState, useEffect } from 'react';
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
  Edit2,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function PhoneOtpLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { sendPhoneOtp, verifyPhoneOtp, isAuthenticated, checkAuth, isLoading } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resend OTP countdown timer
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const cleanPhoneInput = (val: string) => {
    return val.replace(/[^0-9]/g, '').slice(0, 10);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanNum = cleanPhoneInput(phone);
    if (cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const res = await sendPhoneOtp(cleanNum);
    if (!res.success) {
      setError(res.error || 'Failed to dispatch SMS OTP.');
    } else {
      setStep('otp');
      setTimer(30);
      setCanResend(false);
      setSuccess(res.message || 'Real SMS OTP sent to your phone number!');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length < 6) {
      setError('Please enter the 6-digit SMS OTP code.');
      return;
    }

    const res = await verifyPhoneOtp(phone, otp, name);
    if (!res.success) {
      setError(res.error || 'Invalid SMS OTP code. Please try again.');
    } else {
      setSuccess('Phone number verified! Redirecting...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 600);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setSuccess(null);
    const res = await sendPhoneOtp(phone);
    if (res.success) {
      setTimer(30);
      setCanResend(false);
      setSuccess('A new SMS OTP code has been dispatched to your mobile number.');
    } else {
      setError(res.error || 'Failed to resend SMS OTP.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="auth-card"
        >
          {/* Header */}
          <div className="auth-header">
            <div className="auth-badge-pill">
              <ShieldCheck size={13} className="text-teal" />
              <span>REAL SMS OTP AUTHENTICATION</span>
            </div>

            <h1 className="auth-title">
              {step === 'phone' ? 'Mobile Sign In' : 'Enter SMS OTP Code'}
            </h1>

            <p className="auth-subtitle">
              {step === 'phone'
                ? 'Enter your 10-digit mobile phone number to receive a real 6-digit SMS verification code.'
                : `We sent a 6-digit SMS code to +91 ${phone}. Please enter the code below.`}
            </p>
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

          {/* Step 1: Phone Input */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="phone-input">Mobile Phone Number</label>
                <div className="auth-input-wrapper">
                  <div className="auth-country-prefix">+91</div>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                    autoComplete="tel"
                    required
                  />
                  <Phone size={18} className="auth-input-icon" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length < 10}
                className="auth-submit-btn"
              >
                {isLoading ? (
                  <span className="auth-spinner">Sending SMS OTP...</span>
                ) : (
                  <>
                    Send Real SMS OTP <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: 6-Digit OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="auth-phone-summary">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-teal-400" />
                  <span className="font-mono text-sm font-semibold">+91 {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="auth-edit-phone-btn"
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              <div className="auth-input-group">
                <label htmlFor="otp-input">6-Digit SMS Verification Code</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="auth-otp-field"
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="name-input">Your Full Name (Optional)</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="name-input"
                    type="text"
                    placeholder="Eleanor Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="auth-submit-btn"
              >
                {isLoading ? (
                  <span className="auth-spinner">Verifying SMS OTP...</span>
                ) : (
                  <>
                    Verify OTP & Continue <CheckCircle2 size={18} />
                  </>
                )}
              </button>

              <div className="auth-resend-row">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="auth-resend-btn"
                  >
                    <RotateCcw size={14} /> Resend Real SMS OTP
                  </button>
                ) : (
                  <span className="auth-timer-text">Resend SMS OTP in <strong>{timer}s</strong></span>
                )}
              </div>
            </form>
          )}

          <div className="auth-footer-note">
            Real 256-bit SSL encrypted SMS verification. No passwords stored.
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
      <PhoneOtpLoginContent />
    </Suspense>
  );
}
