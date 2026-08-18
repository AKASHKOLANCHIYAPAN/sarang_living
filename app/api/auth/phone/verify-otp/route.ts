import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ message: 'Phone Verify OTP API Endpoint' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp, name } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit code.' },
        { status: 400 }
      );
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    // Verify real SMS OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: cleanOtp,
      type: 'sms',
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid or expired OTP code. Please request a new SMS OTP.' },
        { status: 400 }
      );
    }

    const user = data.user;
    const userName = name?.trim() || user.user_metadata?.full_name || `Member ${cleanPhone.slice(-4)}`;

    const authUser = {
      id: user.id,
      name: userName,
      phone: formattedPhone,
      createdAt: user.created_at,
    };

    const token = signToken({
      userId: user.id,
      email: user.email || '',
      name: userName,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: authUser,
      message: 'Mobile number verified successfully via SMS.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error verifying SMS OTP.' },
      { status: 500 }
    );
  }
}
