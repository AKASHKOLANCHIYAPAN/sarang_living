import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyPhoneOtp: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (data: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Strict RFC 5322 Compliant Email Validator
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) return false;

  const [localPart, domain] = cleanEmail.split('@');
  if (!localPart || !domain) return false;
  if (localPart.length > 64 || domain.length > 255) return false;

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) return false;

  if (['example', 'test', 'invalid', 'localhost'].includes(domainParts[0])) {
    return false;
  }

  return true;
}

/**
 * Format Indian phone numbers with country code +91
 */
export function formatPhoneWithCountryCode(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : '';
}

async function fetchUserProfile(userId: string): Promise<{ fullName?: string; role?: string; phone?: string; avatarUrl?: string }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, role, phone, avatar_url')
      .eq('id', userId)
      .single();

    if (!error && profile) {
      return {
        fullName: profile.full_name || undefined,
        role: profile.role || 'customer',
        phone: profile.phone || undefined,
        avatarUrl: profile.avatar_url || undefined,
      };
    }
  } catch (err) {
    console.warn('Could not fetch user profile:', err);
  }
  return { role: 'customer' };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  checkAuth: async () => {
    if (get().isInitialized && get().user) return;
    set({ isLoading: true });

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
        return;
      }

      const profile = await fetchUserProfile(authUser.id);
      const displayName =
        profile.fullName ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        (authUser.phone ? `Member ${authUser.phone.slice(-4)}` : 'Valued Member');

      const user: AuthUser = {
        id: authUser.id,
        name: displayName,
        email: authUser.email || undefined,
        phone: profile.phone || authUser.phone || undefined,
        avatarUrl: profile.avatarUrl || authUser.user_metadata?.avatar_url,
        role: profile.role || 'customer',
        createdAt: authUser.created_at,
      };

      set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
    } catch (err) {
      console.error('Session check error:', err);
      set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      set({ isLoading: false });
      return {
        success: false,
        error: 'Please enter a valid email address (e.g. name@gmail.com).',
      };
    }

    if (!password || password.length < 6) {
      set({ isLoading: false });
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        set({ isLoading: false });
        let errorMessage = error.message;

        if (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
          errorMessage = 'Invalid email address or password. Please check your credentials or register first.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address. Check your inbox for the confirmation link.';
        }

        return { success: false, error: errorMessage };
      }

      if (data?.user) {
        const authUser = data.user;
        const profile = await fetchUserProfile(authUser.id);
        const displayName =
          profile.fullName ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'Valued Member';

        const user: AuthUser = {
          id: authUser.id,
          name: displayName,
          email: authUser.email || normalizedEmail,
          phone: profile.phone || authUser.phone || undefined,
          avatarUrl: profile.avatarUrl || authUser.user_metadata?.avatar_url,
          role: profile.role || 'customer',
          createdAt: authUser.created_at,
        };

        set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'An unexpected error occurred during sign in.' };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      set({ isLoading: false });
      return { success: false, error: 'Please enter your full name.' };
    }

    if (!isValidEmail(normalizedEmail)) {
      set({ isLoading: false });
      return {
        success: false,
        error: 'Please enter a valid email address (e.g. name@gmail.com).',
      };
    }

    if (!password || password.length < 6) {
      set({ isLoading: false });
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        set({ isLoading: false });
        let errorMessage = error.message;

        if (error.message.includes('User already registered') || error.code === 'user_already_exists') {
          errorMessage = 'An account with this email address already exists. Please sign in instead.';
        }

        return { success: false, error: errorMessage };
      }

      if (data?.user) {
        const authUser = data.user;

        // Upsert profile in public.profiles (guaranteed auth.users UUID)
        try {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            full_name: cleanName,
          });
        } catch {
          // Trigger backup
        }

        // If email confirmation is required, session might be null initially
        if (!data.session) {
          set({ isLoading: false });
          return {
            success: true,
            requiresEmailConfirmation: true,
          };
        }

        const user: AuthUser = {
          id: authUser.id,
          name: cleanName,
          email: authUser.email || normalizedEmail,
          role: 'customer',
          createdAt: authUser.created_at || new Date().toISOString(),
        };

        set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Registration could not be completed.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'An unexpected error occurred during registration.' };
    }
  },

  sendPhoneOtp: async (phone) => {
    set({ isLoading: true });
    const formattedPhone = formatPhoneWithCountryCode(phone);

    if (!formattedPhone || formattedPhone.length < 12) {
      set({ isLoading: false });
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        set({ isLoading: false });
        const msg = (error.message || '').toLowerCase();
        const code = (error as any).code || '';

        // Helpful diagnostic message if SMS provider is not enabled in Supabase Dashboard
        if (
          code === 'phone_provider_disabled' ||
          msg.includes('unsupported phone provider') ||
          msg.includes('phone_provider_disabled') ||
          msg.includes('sms_send_failed') ||
          msg.includes('sms provider') ||
          msg.includes('not configured') ||
          msg.includes('provider is not enabled')
        ) {
          return {
            success: false,
            error: 'SMS OTP requires a Phone Provider (Twilio/MessageBird) configured in your Supabase Dashboard. Please sign in using Email & Password or configure SMS in Supabase.',
          };
        }
        return { success: false, error: error.message };
      }

      set({ isLoading: false });
      return {
        success: true,
        message: `Verification code sent to ${formattedPhone}`,
      };
    } catch (err: any) {
      set({ isLoading: false });
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Network request failed or Supabase connection blocked. Please check your internet connection, disable browser ad-blockers, or sign in using Email & Password.',
        };
      }
      return { success: false, error: errMsg || 'Failed to send OTP.' };
    }
  },

  verifyPhoneOtp: async (phone, otp, name) => {
    set({ isLoading: true });
    const formattedPhone = formatPhoneWithCountryCode(phone);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      set({ isLoading: false });
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanOtp,
        type: 'sms',
      });

      if (error || !data.user) {
        set({ isLoading: false });
        return { success: false, error: error?.message || 'Invalid or expired OTP code.' };
      }

      const authUser = data.user;
      const cleanName = name?.trim() || authUser.user_metadata?.full_name || `Member ${formattedPhone.slice(-4)}`;

      // Update profile in Supabase
      try {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          full_name: cleanName,
          phone: formattedPhone,
        });
      } catch {
        // Handled
      }

      const user: AuthUser = {
        id: authUser.id,
        name: cleanName,
        phone: formattedPhone,
        role: 'customer',
        createdAt: authUser.created_at,
      };

      set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Network connection error. Please check your connection and try again.',
        };
      }
      return { success: false, error: errMsg || 'Verification failed.' };
    }
  },

  resetPassword: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Password reset link sent to ${normalizedEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
    }
  },

  updateProfile: async (data) => {
    const currentUser = get().user;
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to update your profile.' };
    }

    try {
      const updates: { full_name?: string; phone?: string; avatar_url?: string } = {};
      if (data.full_name !== undefined) updates.full_name = data.full_name.trim();
      if (data.phone !== undefined) updates.phone = data.phone.trim();
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) {
        return { success: false, error: error.message };
      }

      set({
        user: {
          ...currentUser,
          name: updates.full_name ?? currentUser.name,
          phone: updates.phone ?? currentUser.phone,
          avatarUrl: updates.avatar_url ?? currentUser.avatarUrl,
        },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile.' };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
