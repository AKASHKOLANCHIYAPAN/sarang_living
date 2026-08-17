import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserRepository, toSafeUser } from '@/lib/auth/userRepository';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: toSafeUser(user),
      authenticated: true,
    });
  } catch (error) {
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 500 }
    );
  }
}
