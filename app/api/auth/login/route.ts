import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserRepository, toSafeUser } from '@/lib/auth/userRepository';
import { verifyPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const safeUser = toSafeUser(user);
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
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
      message: 'Logged in successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred during login.' },
      { status: 500 }
    );
  }
}
