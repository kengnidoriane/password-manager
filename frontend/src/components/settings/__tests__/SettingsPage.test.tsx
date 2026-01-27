/**
 * Settings Page Tests
 * 
 * Tests for the settings page and its tabbed interface functionality.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock window.matchMedia before any imports
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import SettingsPage from '@/app/(app)/settings/page';

// Mock the stores
jest.mock('@/stores/authStore');
jest.mock('@/stores/settingsStore');

// Mock the settings service
jest.mock('@/services/settingsService', () => ({
  settingsService: {
    getDefaultSettings: () => ({
      sessionTimeoutMinutes: 15,
      clipboardTimeoutSeconds: 60,
      biometricEnabled: false,
      strictSecurityMode: false,
      theme: 'light',
      language: 'en',
    }),
    getThemeOptions: () => [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto (System)' },
    ],
    getLanguageOptions: () => [
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
    ],
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

describe('SettingsPage', () => {
  const mockLoadSettings = jest.fn();
  const mockUpdateSettings = jest.fn();
  const mockSetHasUnsavedChanges = jest.fn();

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      session: { token: 'test-token', userId: 'test-user', expiresAt: Date.now() + 3600000 },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    mockUseSettingsStore.mockReturnValue({
      settings: {
        id: 'test-settings',
        sessionTimeoutMinutes: 15,
        clipboardTimeoutSeconds: 60,
        biometricEnabled: false,
        strictSecurityMode: false,
        theme: 'light',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      error: null,
      hasUnsavedChanges: false,
      setSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasUnsavedChanges: mockSetHasUnsavedChanges,
      loadSettings: mockLoadSettings,
      updateSettings: mockUpdateSettings,
      resetSettings: jest.fn(),
      applyTheme: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings page with tabbed interface', () => {
    render(<SettingsPage />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your account and preferences')).toBeInTheDocument();
    
    // Check all tabs are present
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });

  it('loads settings on mount', () => {
    render(<SettingsPage />);
    
    expect(mockLoadSettings).toHaveBeenCalledWith('test-token');
  });

  it('switches between tabs correctly', () => {
    render(<SettingsPage />);
    
    // Security tab should be active by default
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    
    // Click on Account tab
    fireEvent.click(screen.getByText('Account'));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    
    // Click on Appearance tab
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
    
    // Click on Data Management tab
    fireEvent.click(screen.getByText('Data Management'));
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: null,
      isLoading: true,
      error: null,
      hasUnsavedChanges: false,
      setSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      loadSettings: jest.fn(),
      updateSettings: jest.fn(),
      resetSettings: jest.fn(),
      applyTheme: jest.fn(),
    });

    render(<SettingsPage />);
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: null,
      isLoading: false,
      error: 'Failed to load settings',
      hasUnsavedChanges: false,
      setSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      loadSettings: jest.fn(),
      updateSettings: jest.fn(),
      resetSettings: jest.fn(),
      applyTheme: jest.fn(),
    });

    render(<SettingsPage />);
    
    expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
  });

  it('shows unsaved changes warning', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: {
        id: 'test-settings',
        sessionTimeoutMinutes: 15,
        clipboardTimeoutSeconds: 60,
        biometricEnabled: false,
        strictSecurityMode: false,
        theme: 'light',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      error: null,
      hasUnsavedChanges: true,
      setSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasUnsavedChanges: mockSetHasUnsavedChanges,
      loadSettings: mockLoadSettings,
      updateSettings: mockUpdateSettings,
      resetSettings: jest.fn(),
      applyTheme: jest.fn(),
    });

    render(<SettingsPage />);
    
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('handles save changes correctly', async () => {
    mockUseSettingsStore.mockReturnValue({
      settings: {
        id: 'test-settings',
        sessionTimeoutMinutes: 15,
        clipboardTimeoutSeconds: 60,
        biometricEnabled: false,
        strictSecurityMode: false,
        theme: 'light',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      error: null,
      hasUnsavedChanges: true,
      setSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasUnsavedChanges: mockSetHasUnsavedChanges,
      loadSettings: mockLoadSettings,
      updateSettings: mockUpdateSettings,
      resetSettings: jest.fn(),
      applyTheme: jest.fn(),
    });

    render(<SettingsPage />);
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith('test-token', expect.any(Object));
    });
  });

  it('validates session timeout bounds', () => {
    render(<SettingsPage />);
    
    // Switch to security tab
    fireEvent.click(screen.getByText('Security'));
    
    // Find session timeout slider
    const sessionSlider = screen.getByDisplayValue('15');
    expect(sessionSlider).toHaveAttribute('min', '1');
    expect(sessionSlider).toHaveAttribute('max', '60');
  });

  it('validates clipboard timeout bounds', () => {
    render(<SettingsPage />);
    
    // Switch to security tab
    fireEvent.click(screen.getByText('Security'));
    
    // Find clipboard timeout slider
    const clipboardSlider = screen.getByDisplayValue('60');
    expect(clipboardSlider).toHaveAttribute('min', '30');
    expect(clipboardSlider).toHaveAttribute('max', '300');
  });
});