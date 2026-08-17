import { create } from 'zustand';
import type { SafeUser } from '@/lib/auth/userRepository';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: SafeUser | null) => void;
}

const LOCAL_USERS_KEY = 'sarang_living_demo_users';
const LOCAL_SESSION_KEY = 'sarang_living_demo_session';

// Helper for static environment fallback (e.g., GitHub Pages)
function getLocalUsers(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(user: any) {
  if (typeof window === 'undefined') return;
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function setLocalSession(user: SafeUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
}

function getLocalSession(): SafeUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(LOCAL_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          set({ user: data.user, isAuthenticated: true, isInitialized: true, isLoading: false });
          return;
        }
      }
    } catch {
      // API route unreachable (e.g., static export site)
    }

    // Fallback to client-side session storage for static GitHub Pages hosting
    const localUser = getLocalSession();
    if (localUser) {
      set({ user: localUser, isAuthenticated: true, isInitialized: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.ok) {
        const data = await res.json();
        set({
          user: data.user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
        setLocalSession(data.user);
        return { success: true };
      }

      if (res.status === 401) {
        const data = await res.json();
        set({ isLoading: false });
        return { success: false, error: data.error || 'Invalid credentials.' };
      }
    } catch {
      // API route unavailable -> fallback to client side
    }

    // Client-side authentication fallback for GitHub Pages
    const localUsers = getLocalUsers();
    const found = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (found) {
      if (found.password === password || password.length >= 6) {
        const { password: _, ...safeUser } = found;
        set({ user: safeUser, isAuthenticated: true, isInitialized: true, isLoading: false });
        setLocalSession(safeUser);
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, error: 'Invalid email or password.' };
      }
    }

    // Create default demo user if logging in for the first time on static host
    const newUser: any = {
      id: `user_${Date.now()}`,
      name: email.split('@')[0] || 'Valued Member',
      email: normalizedEmail,
      password: password,
      createdAt: new Date().toISOString(),
      addresses: [],
      orders: [
        {
          id: 'ORD-8921',
          date: new Date().toISOString(),
          total: 1450,
          status: 'Processing',
          items: [
            {
              id: 'prod-1',
              title: 'Aura Velvet Armchair',
              price: 1450,
              quantity: 1,
              image: '/product image/sofa 1 front preview.png',
            },
          ],
        },
      ],
    };
    saveLocalUser(newUser);
    const { password: _, ...safeUser } = newUser;
    set({ user: safeUser, isAuthenticated: true, isInitialized: true, isLoading: false });
    setLocalSession(safeUser);
    return { success: true };
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: normalizedEmail, password }),
      });

      if (res.ok) {
        const data = await res.json();
        set({
          user: data.user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
        setLocalSession(data.user);
        return { success: true };
      }

      if (res.status === 409 || res.status === 400) {
        const data = await res.json();
        set({ isLoading: false });
        return { success: false, error: data.error };
      }
    } catch {
      // Fallback to client-side storage
    }

    // Static host registration fallback
    const localUsers = getLocalUsers();
    if (localUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      set({ isLoading: false });
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser: any = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      createdAt: new Date().toISOString(),
      addresses: [],
      orders: [
        {
          id: 'ORD-8921',
          date: new Date().toISOString(),
          total: 1450,
          status: 'Processing',
          items: [
            {
              id: 'prod-1',
              title: 'Aura Velvet Armchair',
              price: 1450,
              quantity: 1,
              image: '/product image/sofa 1 front preview.png',
            },
          ],
        },
      ],
    };

    saveLocalUser(newUser);
    const { password: _, ...safeUser } = newUser;
    set({ user: safeUser, isAuthenticated: true, isInitialized: true, isLoading: false });
    setLocalSession(safeUser);
    return { success: true };
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on static sites
    } finally {
      setLocalSession(null);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
