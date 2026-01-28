/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';

// Mock the service worker manager
jest.mock('@/lib/serviceWorker', () => ({
  serviceWorkerManager: {
    checkForUpdates: jest.fn(),
    updateServiceWorker: jest.fn(),
    getUpdateStatus: jest.fn(),
  },
}));

// Mock the hook
jest.mock('@/hooks/useServiceWorker', () => ({
  useServiceWorkerUpdate: jest.fn(),
}));

import { useServiceWorkerUpdate } from '@/hooks/useServiceWorker';
const mockUseServiceWorkerUpdate = useServiceWorkerUpdate as jest.MockedFunction<typeof useServiceWorkerUpdate>;

describe('PWA Update Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window events
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });
    
    // Mock intervals
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should complete full update flow successfully', async () => {
    // Mock successful update flow
    const mockApplyUpdate = jest.fn().mockResolvedValue(undefined);
    
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: false,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: mockApplyUpdate,
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);

    expect(screen.getByText('App Update Available')).toBeInTheDocument();

    // Click update button
    const updateButton = screen.getByRole('button', { name: 'Update Now' });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockApplyUpdate).toHaveBeenCalled();
    });
  });

  it('should handle update errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockApplyUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
    
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: false,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: mockApplyUpdate,
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);

    expect(screen.getByText('App Update Available')).toBeInTheDocument();

    // Click update button
    const updateButton = screen.getByRole('button', { name: 'Update Now' });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Update failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should check for updates on visibility change', async () => {
    const mockCheckForUpdates = jest.fn().mockResolvedValue(false);
    
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: false,
      isUpdating: false,
      updateStatus: {
        hasUpdate: false,
        isWaiting: false,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: mockCheckForUpdates,
    });

    render(<PWAUpdatePrompt />);

    // Simulate page becoming visible
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });

    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(mockCheckForUpdates).toHaveBeenCalled();
    });
  });

  it('should check for updates periodically', async () => {
    const mockCheckForUpdates = jest.fn().mockResolvedValue(false);
    
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: false,
      isUpdating: false,
      updateStatus: {
        hasUpdate: false,
        isWaiting: false,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: mockCheckForUpdates,
    });

    render(<PWAUpdatePrompt />);

    // Fast-forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(mockCheckForUpdates).toHaveBeenCalled();
    });
  });

  it('should dismiss update notification', async () => {
    const mockDismissUpdate = jest.fn();
    
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: false,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: mockDismissUpdate,
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);

    expect(screen.getByText('App Update Available')).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: 'Later' });
    fireEvent.click(dismissButton);

    expect(mockDismissUpdate).toHaveBeenCalled();
  });
});