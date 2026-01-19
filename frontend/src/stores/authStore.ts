import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '@/lib/config';

/**
 * Authentication State Store
 * Manages user authentication state and session with automatic expiration
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
  salt?: string; // Base64 encoded salt for PBKDF2
  iterations?: number; // PBKDF2 iterations
}

export interface Session {
  token: string;
  expiresAt: number;
  isLocked: boolean;
  lastActivity: number;
}

export interface DerivedKeys {
  encryptionKey: CryptoKey;
  authKey: CryptoKey;
  salt: Uint8Array;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  encryptionKey: CryptoKey | null;
  authKey: CryptoKey | null;
  salt: Uint8Array | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionTimeoutId: NodeJS.Timeout | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setEncryptionKeys: (keys: DerivedKeys | null) => void;
  setLoading: (loading: boolean) => void;
  lockSession: () => void;
  unlockSession: (masterPassword?: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  updateActivity: () => void;
  checkSessionExpiry: () => boolean;
  startSessionTimer: () => void;
  clearSessionTimer: () => void;
  initializeSession: (token: string, expiresAt: number, userId: string, keys?: DerivedKeys) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      encryptionKey: null,
      authKey: null,
      salt: null,
      isAuthenticated: false,
      isLoading: false,
      sessionTimeoutId: null,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setSession: (session) => {
        // Ensure lastActivity is set if not provided
        if (session && !session.lastActivity) {
          session = { ...session, lastActivity: Date.now() };
        }
        
        set({ session });
        
        // Start session timer when session is set
        if (session && !session.isLocked) {
          get().startSessionTimer();
        } else {
          get().clearSessionTimer();
        }
      },

      setEncryptionKeys: (keys) => {
        if (keys) {
          set({
            encryptionKey: keys.encryptionKey,
            authKey: keys.authKey,
            salt: keys.salt
          });
        } else {
          set({
            encryptionKey: null,
            authKey: null,
            salt: null
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      lockSession: () => {
        set((state) => ({
          session: state.session ? { ...state.session, isLocked: true } : null
        }));
        
        // Clear session timer when locked
        get().clearSessionTimer();
      },

      unlockSession: async (masterPassword?: string) => {
        const state = get();
        
        if (!state.session) {
          return false;
        }

        // Check if session has expired
        if (Date.now() >= state.session.expiresAt) {
          // Session expired, need to re-authenticate
          await get().logout();
          return false;
        }

        // In a real implementation, you might want to verify the master password
        // For now, we'll just unlock the session
        set((state) => ({
          session: state.session ? { 
            ...state.session, 
            isLocked: false,
            lastActivity: Date.now()
          } : null
        }));

        // Restart session timer
        get().startSessionTimer();
        
        return true;
      },

      logout: async () => {
        const state = get();
        
        // Clear session timer
        get().clearSessionTimer();
        
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
        
        // Clear local state including encryption keys
        set({
          user: null,
          session: null,
          encryptionKey: null,
          authKey: null,
          salt: null,
          isAuthenticated: false,
          sessionTimeoutId: null
        });
      },

      refreshSession: async () => {
        const state = get();
        
        if (!state.session?.token) {
          return false;
        }

        try {
          const { authService } = await import('@/services/authService');
          const response = await authService.refreshToken(state.session.token);
          
          // Update session with new token and expiration
          const newSession: Session = {
            token: response.token,
            expiresAt: response.expiresAt,
            isLocked: false,
            lastActivity: Date.now()
          };
          
          get().setSession(newSession);
          return true;
        } catch (error) {
          console.error('Failed to refresh session:', error);
          // If refresh fails, logout the user
          await get().logout();
          return false;
        }
      },

      updateActivity: () => {
        const state = get();
        
        if (state.session && !state.session.isLocked) {
          set((state) => ({
            session: state.session ? {
              ...state.session,
              lastActivity: Date.now()
            } : null
          }));
          
          // Restart session timer with updated activity
          get().startSessionTimer();
        }
      },

      checkSessionExpiry: () => {
        const state = get();
        
        if (!state.session) {
          return false;
        }

        const now = Date.now();
        const sessionExpired = now >= state.session.expiresAt;
        const inactivityExpired = now - state.session.lastActivity >= config.security.sessionTimeout;

        if (sessionExpired || inactivityExpired) {
          // Session expired, lock it
          get().lockSession();
          return true;
        }

        return false;
      },

      startSessionTimer: () => {
        const state = get();
        
        // Clear existing timer
        get().clearSessionTimer();
        
        if (!state.session || state.session.isLocked) {
          return;
        }

        // Calculate time until session should expire due to inactivity
        const timeUntilExpiry = config.security.sessionTimeout;
        
        const timeoutId = setTimeout(() => {
          const currentState = get();
          
          // Double-check session state before locking
          if (currentState.session && !currentState.session.isLocked) {
            const timeSinceActivity = Date.now() - currentState.session.lastActivity;
            
            if (timeSinceActivity >= config.security.sessionTimeout) {
              get().lockSession();
            } else {
              // Activity occurred, restart timer
              get().startSessionTimer();
            }
          }
        }, timeUntilExpiry);

        set({ sessionTimeoutId: timeoutId });
      },

      clearSessionTimer: () => {
        const state = get();
        
        if (state.sessionTimeoutId) {
          clearTimeout(state.sessionTimeoutId);
          set({ sessionTimeoutId: null });
        }
      },

      initializeSession: (token: string, expiresAt: number, userId: string, keys?: DerivedKeys) => {
        const session: Session = {
          token,
          expiresAt,
          isLocked: false,
          lastActivity: Date.now()
        };
        
        get().setSession(session);
        
        // Set encryption keys if provided
        if (keys) {
          get().setEncryptionKeys(keys);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
        // Note: We don't persist encryption keys for security reasons
        // They must be re-derived from master password on each session
      })
    }
  )
);
