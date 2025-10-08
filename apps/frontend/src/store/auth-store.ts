import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';
import type { User, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string, rememberMe?: boolean) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.auth.login({ email, password });
          
          // The backend returns: { success: true, data: { user, token }, timestamp }
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Store token with different strategies based on rememberMe
          if (rememberMe) {
            // Store in localStorage for persistent login (long-term)
            localStorage.setItem('auth-token', token);
            localStorage.setItem('auth-remember', 'true');
            // Set expiration for 30 days
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            localStorage.setItem('auth-expiration', expirationDate.toISOString());
          } else {
            // Store in sessionStorage for session-only login
            sessionStorage.setItem('auth-token', token);
            localStorage.removeItem('auth-remember');
            localStorage.removeItem('auth-expiration');
            localStorage.removeItem('auth-token');
          }
        } catch (error: any) {
          set({ isLoading: false });
          // Extracting error message from backend structure
          const errorMessage = error?.response?.data?.error?.message || error?.message || 'Erro no login';
          throw new Error(errorMessage);
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.auth.register(userData);
          const user = response.data.data || response.data;
          
          set({
            user,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          // Extracting error message from backend structure
          const errorMessage = error?.response?.data?.error?.message || error?.message || 'Erro no cadastro';
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-remember');
        localStorage.removeItem('auth-expiration');
        sessionStorage.removeItem('auth-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string, rememberMe = false) => {
        set({ token });
        if (rememberMe) {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-remember', 'true');
        } else {
          sessionStorage.setItem('auth-token', token);
        }
      },

      clearAuth: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-remember');
        localStorage.removeItem('auth-expiration');
        sessionStorage.removeItem('auth-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        // Check both localStorage and sessionStorage for token
        let token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
        const isRemembered = localStorage.getItem('auth-remember') === 'true';
        const expiration = localStorage.getItem('auth-expiration');
        
        // Check if remembered token has expired
        if (isRemembered && expiration) {
          const expirationDate = new Date(expiration);
          if (new Date() > expirationDate) {
            // Token expired, clear everything
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-remember');
            localStorage.removeItem('auth-expiration');
            token = null;
          }
        }
        
        if (!token) {
          // No token found, ensure clean state without loading
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await apiClient.auth.me();
          
          // Check if response has nested data structure
          const user = response.data.data || response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Clear all auth data on error, but don't redirect here
          // Let the axios interceptor handle redirects
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-remember');
          localStorage.removeItem('auth-expiration');
          sessionStorage.removeItem('auth-token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          // Don't throw error to avoid unhandled rejections
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
