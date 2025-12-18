import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authentication State Store
 * Manages user authentication state and session
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  token: string;
  expiresAt: number;
  isLocked: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  lockSession: () => void;
  unlockSession: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setSession: (session) => set({ session }),

      setLoading: (loading) => set({ isLoading: loading }),

      lockSession: () => set((state) => ({
        session: state.session ? { ...state.session, isLocked: true } : null
      })),

      unlockSession: () => set((state) => ({
        session: state.session ? { ...state.session, isLocked: false } : null
      })),

      logout: async () => {
        const state = useAuthStore.getState();
        
        // Call logout API if we have a token
        if (state.session?.token) {
          try {
            const { authService } = await import('@/services/authService');
            await authService.logout(state.session.token);
          } catch (error) {
            // Don't throw on logout errors - user should be logged out locally anyway
            console.warn('Logout API call failed:', error);
          }
        }
        
        // Clear local state
        set({
          user: null,
          session: null,
          isAuthenticated: false
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
