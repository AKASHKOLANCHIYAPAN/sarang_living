import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as any;
  const next = searchParams.get('next') ?? '/account';

  // Fallback origin if request.url uses localhost internally behind a proxy
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}?verified=true`);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}?verified=true`);
    }
  }

  // Verification failed or expired link
  return NextResponse.redirect(`${siteUrl}/login?error=invalid_verification_link`);
}
