import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserRepository } from '@/lib/auth/userRepository';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'Auth Register API endpoint' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const safeUser = await UserRepository.create({
      name,
      email,
      passwordHash,
    });

    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email || '',
      name: safeUser.name,
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
      user: safeUser,
      message: 'Account registered successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
