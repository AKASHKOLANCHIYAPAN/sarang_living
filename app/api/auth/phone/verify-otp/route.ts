import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyOtp, isValidIndianPhone, formatPhone } from '@/lib/otp';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'verify-otp' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp, name } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required.' },
        { status: 400 }
      );
    }

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.toString().trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'OTP must be a 6-digit number.' },
        { status: 400 }
      );
    }

    // Verify OTP against stored code
    const result = verifyOtp(phone, cleanOtp);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // OTP verified — create or fetch user
    const formattedPhone = formatPhone(phone);
    const digits = formattedPhone.replace('+', '');
    const userName = name?.trim() || `Member ${digits.slice(-4)}`;
    const userId = `phone_${digits}`;

    // Try to upsert profile in Supabase
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: userName,
        phone: formattedPhone,
      }, { onConflict: 'id' });
    } catch {
      // Database might not be available — continue with local auth
    }

    // Sign JWT token
    const token = signToken({
      userId,
      email: '',
      name: userName,
    });

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userName,
        phone: formattedPhone,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error during verification. Please try again.' },
      { status: 500 }
    );
  }
}
