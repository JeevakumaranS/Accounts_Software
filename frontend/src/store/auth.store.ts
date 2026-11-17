import { create } from 'zustand';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CEO' | 'ACCOUNTANT';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  isLoading: true,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', payload.access_token);
        localStorage.setItem('user', JSON.stringify(payload.user));
      }
      set({ user: payload.user, token: payload.access_token, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password';
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isLoading: false });
    } catch {
      // If network or session error, check localStorage cache
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('user');
        if (cached) {
          try {
            set({ user: JSON.parse(cached), isLoading: false });
            return;
          } catch {}
        }
      }
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
