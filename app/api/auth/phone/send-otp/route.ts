import { NextResponse } from 'next/server';
import { generateOtp, storeOtp, sendOtpSms, isValidIndianPhone, formatPhone } from '@/lib/otp';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'send-otp' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    // Validate Indian mobile number format
    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otpCode = generateOtp();

    // Store OTP with rate limiting
    const storeResult = storeOtp(phone, otpCode);
    if (!storeResult.success) {
      return NextResponse.json(
        { success: false, error: storeResult.error },
        { status: 429 }
      );
    }

    // Send OTP via SMS
    const smsResult = await sendOtpSms(phone, otpCode);

    const formattedPhone = formatPhone(phone);
    const maskedPhone = formattedPhone.slice(0, 6) + '****' + formattedPhone.slice(-2);

    if (!smsResult.sent) {
      return NextResponse.json(
        { success: false, error: smsResult.error || 'Failed to send SMS. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}`,
      expiresIn: 300, // 5 minutes
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
