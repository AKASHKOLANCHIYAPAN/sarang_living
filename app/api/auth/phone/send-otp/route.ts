import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ message: 'Phone Send OTP API Endpoint' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile phone number.' },
        { status: 400 }
      );
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    // Dispatch real SMS OTP via Supabase Auth SMS Provider
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to dispatch SMS OTP. Please check SMS gateway configuration.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Real SMS OTP dispatched to ${formattedPhone}. Please check your phone text messages.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error dispatching SMS OTP.' },
      { status: 500 }
    );
  }
}
