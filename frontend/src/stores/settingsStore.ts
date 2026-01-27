import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, UserSettingsRequest, settingsService } from '@/services/settingsService';

/**
 * Settings State Store
 * Manages user settings state with persistence and API synchronization
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  setSettings: (settings: UserSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  loadSettings: (token: string) => Promise<void>;
  updateSettings: (token: string, settings: UserSettingsRequest) => Promise<void>;
  resetSettings: () => void;
  applyTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      hasUnsavedChanges: false,

      setSettings: (settings) => set({ 
        settings,
        hasUnsavedChanges: false,
        error: null
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

      loadSettings: async (token: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const settings = await settingsService.getUserSettings(token);
          
          set({ 
            settings, 
            isLoading: false,
            hasUnsavedChanges: false,
            error: null
          });

          // Apply theme immediately
          get().applyTheme(settings.theme);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      updateSettings: async (token: string, settingsRequest: UserSettingsRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const updatedSettings = await settingsService.updateUserSettings(token, settingsRequest);
          
          set({ 
            settings: updatedSettings, 
            isLoading: false,
            hasUnsavedChanges: false,
            error: null
          });

          // Apply theme immediately if it changed
          get().applyTheme(updatedSettings.theme);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          throw error; // Re-throw so UI can handle it
        }
      },

      resetSettings: () => set({
        settings: null,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false
      }),

      applyTheme: (theme: 'light' | 'dark' | 'auto') => {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('light', 'dark');
        
        if (theme === 'auto') {
          // Use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          // Use explicit theme
          root.classList.add(theme);
        }
        
        // Store theme preference for system theme detection
        localStorage.setItem('theme-preference', theme);
      }
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings
        // Don't persist loading states or errors
      })
    }
  )
);

// Initialize theme on store creation
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();
  const savedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark' | 'auto' || 'light';
  store.applyTheme(savedTheme);
  
  // Listen for system theme changes when in auto mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const currentSettings = store.settings;
    if (currentSettings?.theme === 'auto') {
      store.applyTheme('auto');
    }
  });
}