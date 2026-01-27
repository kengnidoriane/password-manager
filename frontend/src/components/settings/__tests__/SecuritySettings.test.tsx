/**
 * SecuritySettings Component Tests
 * 
 * Tests for the security settings component functionality.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecuritySettings } from '../SecuritySettings';
import { UserSettingsRequest } from '@/services/settingsService';

describe('SecuritySettings', () => {
  const defaultSettings: UserSettingsRequest = {
    sessionTimeoutMinutes: 15,
    clipboardTimeoutSeconds: 60,
    biometricEnabled: false,
    strictSecurityMode: false,
    theme: 'light',
    language: 'en',
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders security settings correctly', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.getByText('Session Timeout')).toBeInTheDocument();
    expect(screen.getByText('Clipboard Auto-Clear')).toBeInTheDocument();
    expect(screen.getByText('Biometric Authentication')).toBeInTheDocument();
    expect(screen.getByText('Strict Security Mode')).toBeInTheDocument();
  });

  it('displays current session timeout correctly', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText('Current: 15 minutes')).toBeInTheDocument();
  });

  it('displays current clipboard timeout correctly', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText('Current: 1 minute')).toBeInTheDocument();
  });

  it('validates session timeout bounds', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const sessionSlider = screen.getByDisplayValue('15');
    expect(sessionSlider).toHaveAttribute('min', '1');
    expect(sessionSlider).toHaveAttribute('max', '60');
  });

  it('validates clipboard timeout bounds', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const clipboardSlider = screen.getByDisplayValue('60');
    expect(clipboardSlider).toHaveAttribute('min', '30');
    expect(clipboardSlider).toHaveAttribute('max', '300');
    expect(clipboardSlider).toHaveAttribute('step', '30');
  });

  it('calls onChange when session timeout changes', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const sessionSlider = screen.getByDisplayValue('15');
    fireEvent.change(sessionSlider, { target: { value: '30' } });

    expect(mockOnChange).toHaveBeenCalledWith({ sessionTimeoutMinutes: 30 });
  });

  it('calls onChange when clipboard timeout changes', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const clipboardSlider = screen.getByDisplayValue('60');
    fireEvent.change(clipboardSlider, { target: { value: '120' } });

    expect(mockOnChange).toHaveBeenCalledWith({ clipboardTimeoutSeconds: 120 });
  });

  it('calls onChange when biometric setting toggles', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const biometricToggle = screen.getByLabelText('Toggle biometric authentication');
    fireEvent.click(biometricToggle);

    expect(mockOnChange).toHaveBeenCalledWith({ biometricEnabled: true });
  });

  it('calls onChange when strict security mode toggles', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const strictModeToggle = screen.getByLabelText('Toggle strict security mode');
    fireEvent.click(strictModeToggle);

    expect(mockOnChange).toHaveBeenCalledWith({ strictSecurityMode: true });
  });

  it('shows warning when strict security mode is enabled', () => {
    const strictModeSettings = { ...defaultSettings, strictSecurityMode: true };
    
    render(
      <SecuritySettings
        settings={strictModeSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Warning:/)).toBeInTheDocument();
    expect(screen.getByText(/Strict security mode will make the application less convenient/)).toBeInTheDocument();
  });

  it('shows info when biometric is disabled', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Enable biometric authentication for faster and more secure access/)).toBeInTheDocument();
  });

  it('disables controls when loading', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={true}
      />
    );

    const sessionSlider = screen.getByDisplayValue('15');
    const clipboardSlider = screen.getByDisplayValue('60');
    const biometricToggle = screen.getByLabelText('Toggle biometric authentication');
    const strictModeToggle = screen.getByLabelText('Toggle strict security mode');
    
    expect(sessionSlider).toBeDisabled();
    expect(clipboardSlider).toBeDisabled();
    expect(biometricToggle).toBeDisabled();
    expect(strictModeToggle).toBeDisabled();
  });

  it('formats timeout displays correctly', () => {
    const customSettings: UserSettingsRequest = {
      ...defaultSettings,
      sessionTimeoutMinutes: 90, // 1h 30m
      clipboardTimeoutSeconds: 150, // 2m 30s
    };

    render(
      <SecuritySettings
        settings={customSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    expect(screen.getByText('Current: 1h 30m')).toBeInTheDocument();
    expect(screen.getByText('Current: 2m 30s')).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <SecuritySettings
        settings={defaultSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const biometricToggle = screen.getByLabelText('Toggle biometric authentication');
    const strictModeToggle = screen.getByLabelText('Toggle strict security mode');

    expect(biometricToggle).toHaveAttribute('aria-pressed', 'false');
    expect(strictModeToggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates ARIA pressed state when toggles are enabled', () => {
    const enabledSettings = { 
      ...defaultSettings, 
      biometricEnabled: true, 
      strictSecurityMode: true 
    };
    
    render(
      <SecuritySettings
        settings={enabledSettings}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    const biometricToggle = screen.getByLabelText('Toggle biometric authentication');
    const strictModeToggle = screen.getByLabelText('Toggle strict security mode');

    expect(biometricToggle).toHaveAttribute('aria-pressed', 'true');
    expect(strictModeToggle).toHaveAttribute('aria-pressed', 'true');
  });
});