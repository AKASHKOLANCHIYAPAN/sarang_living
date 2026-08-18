import crypto from 'crypto';

// ============================================================
// OTP Service — Real OTP Generation, Storage, and SMS Delivery
// ============================================================

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_SECONDS = 60; // 1 OTP per 60 seconds per phone

// ── In-memory OTP store (per server instance) ──────────────
// For production at scale, replace with Supabase table or Redis.
interface OtpRecord {
  code: string;
  phone: string;
  expiresAt: number; // Unix ms
  attempts: number;
  createdAt: number;
}

const otpStore = new Map<string, OtpRecord>();

// ── Generate a cryptographically secure 6-digit OTP ────────
export function generateOtp(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % Math.pow(10, OTP_LENGTH);
  return num.toString().padStart(OTP_LENGTH, '0');
}

// ── Format phone to E.164 (+91XXXXXXXXXX) ──────────────────
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return `+91${digits}`;
}

// ── Validate 10-digit Indian mobile number ─────────────────
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digits);
  }
  return false;
}

// ── Store OTP ──────────────────────────────────────────────
export function storeOtp(phone: string, code: string): { success: boolean; error?: string } {
  const formattedPhone = formatPhone(phone);
  const now = Date.now();

  // Rate limiting: check if last OTP was sent within cooldown
  const existing = otpStore.get(formattedPhone);
  if (existing && (now - existing.createdAt) < RATE_LIMIT_SECONDS * 1000) {
    const waitSec = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - existing.createdAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSec} seconds before requesting another OTP.`,
    };
  }

  const record: OtpRecord = {
    code,
    phone: formattedPhone,
    expiresAt: now + OTP_EXPIRY_SECONDS * 1000,
    attempts: 0,
    createdAt: now,
  };

  otpStore.set(formattedPhone, record);

  // Auto-cleanup expired entries
  cleanExpiredOtps();

  return { success: true };
}

// ── Verify OTP ─────────────────────────────────────────────
export function verifyOtp(phone: string, code: string): { valid: boolean; error?: string } {
  const formattedPhone = formatPhone(phone);
  const record = otpStore.get(formattedPhone);

  if (!record) {
    return { valid: false, error: 'No OTP found for this number. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return { valid: false, error: 'OTP has expired. Please request a new code.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(formattedPhone);
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  record.attempts += 1;

  if (record.code !== code.trim()) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }

  // OTP verified — remove from store
  otpStore.delete(formattedPhone);
  return { valid: true };
}

// ── Clean expired OTPs (garbage collection) ────────────────
function cleanExpiredOtps() {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
    }
  }
}

// ── Send OTP via SMS Gateway ───────────────────────────────
// Supports: Fast2SMS (India), Twilio (International)
// Configure via environment variables.
export async function sendOtpSms(phone: string, code: string): Promise<{ sent: boolean; error?: string }> {
  const formattedPhone = formatPhone(phone);
  const digits = formattedPhone.replace('+91', '');

  // ─── Option 1: Fast2SMS (Indian SMS Gateway) ───
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: digits,
          flash: 0,
        }),
      });

      const result = await response.json();
      if (result.return === true || result.status_code === 200) {
        return { sent: true };
      }
      return { sent: false, error: result.message || 'Fast2SMS delivery failed.' };
    } catch (err: any) {
      return { sent: false, error: `Fast2SMS error: ${err.message}` };
    }
  }

  // ─── Option 2: Twilio ───
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const body = new URLSearchParams({
        To: formattedPhone,
        From: twilioFrom,
        Body: `Your Sarang Living verification code is: ${code}. Valid for 5 minutes. Do not share this code.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const result = await response.json();
      if (result.sid) {
        return { sent: true };
      }
      return { sent: false, error: result.message || 'Twilio delivery failed.' };
    } catch (err: any) {
      return { sent: false, error: `Twilio error: ${err.message}` };
    }
  }

  // ─── No SMS provider configured — log OTP to console ───
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  SARANG LIVING — OTP VERIFICATION CODE       ║`);
  console.log(`║  Phone: ${formattedPhone.padEnd(36)}║`);
  console.log(`║  OTP:   ${code.padEnd(36)}║`);
  console.log(`║  Valid for 5 minutes                         ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  return {
    sent: true, // Allow flow to continue in development
    error: undefined,
  };
}
