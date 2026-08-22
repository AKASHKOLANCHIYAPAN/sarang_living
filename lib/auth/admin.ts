import { createClient } from '@/lib/supabase/server';

export interface AdminUser {
  id: string;
  email?: string;
  fullName?: string;
  role: 'admin';
}

/**
 * Server-side Admin Authorization Guard
 * Verifies that the user has a valid Supabase session AND role = 'admin' in public.profiles.
 * Returns the authenticated AdminUser or null if not authorized.
 */
export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name || undefined,
      role: 'admin',
    };
  } catch (err) {
    console.error('Error verifying admin authorization:', err);
    return null;
  }
}
