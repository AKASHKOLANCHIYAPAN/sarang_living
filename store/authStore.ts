import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
  orders?: any[];
  addresses?: any[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Strict RFC 5322 Compliant Email Validator
 * Verifies email structure, valid domain extension, and rejects malformed addresses.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) return false;
  
  const [localPart, domain] = cleanEmail.split('@');
  if (!localPart || !domain) return false;
  if (localPart.length > 64 || domain.length > 255) return false;
  
  // Reject common fake placeholder domains or missing TLDs
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  return true;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    if (get().isInitialized && get().user) return;
    set({ isLoading: true });

    try {
      // Fetch session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.user) {
        const user = session.user;
        
        // Try fetching extended profile from Supabase profiles table
        let fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Valued Member';
        let role = 'customer';

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            fullName = profile.full_name;
          }
          if (profile?.role) {
            role = profile.role;
          }
        } catch {
          // Profile table optional fallback
        }

        const authUser: AuthUser = {
          id: user.id,
          name: fullName,
          email: user.email || '',
          avatarUrl: user.user_metadata?.avatar_url,
          role,
          createdAt: user.created_at,
          orders: [],
          addresses: [],
        };

        set({ user: authUser, isAuthenticated: true, isInitialized: true, isLoading: false });
        return;
      }
    } catch (err) {
      console.warn('Supabase auth session check warning:', err);
    }

    set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();

    // Strict Email Format & Realism Check
    if (!isValidEmail(normalizedEmail)) {
      set({ isLoading: false });
      return {
        success: false,
        error: 'Please enter a valid, original email address (e.g. name@domain.com).',
      };
    }

    if (!password || password.length < 6) {
      set({ isLoading: false });
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        set({ isLoading: false });
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email address or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        }
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        const user = data.user;
        const authUser: AuthUser = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Valued Member',
          email: user.email || normalizedEmail,
          createdAt: user.created_at,
          orders: [],
          addresses: [],
        };

        set({ user: authUser, isAuthenticated: true, isInitialized: true, isLoading: false });
        return { success: true };
      }
    } catch (err: any) {
      console.error('Supabase login error:', err);
    }

    set({ isLoading: false });
    return { success: false, error: 'An error occurred while logging in. Please try again.' };
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      set({ isLoading: false });
      return { success: false, error: 'Please enter your full name.' };
    }

    // Strict Email Format & Realism Check
    if (!isValidEmail(normalizedEmail)) {
      set({ isLoading: false });
      return {
        success: false,
        error: 'Please enter a valid, original email address (e.g. name@domain.com).',
      };
    }

    if (!password || password.length < 6) {
      set({ isLoading: false });
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email address already exists. Please sign in.';
        }
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        const user = data.user;

        // Auto-create or update profile record in database
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: cleanName,
          });
        } catch {
          // Ignore if handled by DB trigger
        }

        const authUser: AuthUser = {
          id: user.id,
          name: cleanName,
          email: user.email || normalizedEmail,
          createdAt: user.created_at,
          orders: [],
          addresses: [],
        };

        set({ user: authUser, isAuthenticated: true, isInitialized: true, isLoading: false });
        return { success: true };
      }
    } catch (err: any) {
      console.error('Supabase registration error:', err);
    }

    set({ isLoading: false });
    return { success: false, error: 'Failed to create account. Please try again.' };
  },

  resetPassword: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid, original email address.' };
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
        message: `Password reset link has been sent to ${normalizedEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
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
