/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorker';

// Mock the useServiceWorkerUpdate hook
jest.mock('@/hooks/useServiceWorker', () => ({
  useServiceWorkerUpdate: jest.fn(),
}));

const mockUseServiceWorkerUpdate = useServiceWorkerUpdate as jest.MockedFunction<typeof useServiceWorkerUpdate>;

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when no update is available', () => {
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
      checkForUpdates: jest.fn(),
    });

    const { container } = render(<PWAUpdatePrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render update prompt when update is available', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: false,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);
    
    expect(screen.getByText('App Update Available')).toBeInTheDocument();
    expect(screen.getByText(/A new version of the Password Manager is ready to install/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
  });

  it('should show updating state when update is in progress', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: true,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);
    
    expect(screen.getByText('Updating App...')).toBeInTheDocument();
    expect(screen.getByText(/Installing the latest version/)).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    // Update button should be disabled
    const updateButton = screen.getByRole('button', { name: /Updating/ });
    expect(updateButton).toBeDisabled();
    
    // Later button should not be visible during update
    expect(screen.queryByRole('button', { name: 'Later' })).not.toBeInTheDocument();
  });

  it('should call applyUpdate when Update Now button is clicked', async () => {
    const mockApplyUpdate = jest.fn();
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
    
    const updateButton = screen.getByRole('button', { name: 'Update Now' });
    fireEvent.click(updateButton);
    
    expect(mockApplyUpdate).toHaveBeenCalledTimes(1);
  });

  it('should call dismissUpdate when Later button is clicked', () => {
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
    
    const laterButton = screen.getByRole('button', { name: 'Later' });
    fireEvent.click(laterButton);
    
    expect(mockDismissUpdate).toHaveBeenCalledTimes(1);
  });

  it('should call dismissUpdate when close button is clicked', () => {
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
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    
    expect(mockDismissUpdate).toHaveBeenCalledTimes(1);
  });

  it('should show details when Details button is clicked', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: false,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
        currentVersion: 'https://example.com/sw-v1.js',
        newVersion: 'https://example.com/sw-v2.js',
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);
    
    const detailsButton = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Status: Ready to install')).toBeInTheDocument();
    expect(screen.getByText(/Current: sw-v1.js/)).toBeInTheDocument();
    expect(screen.getByText(/New: sw-v2.js/)).toBeInTheDocument();
    
    // Button should now show "Hide"
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('should show progress indicator during update', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      isUpdateAvailable: true,
      isUpdating: true,
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
      },
      applyUpdate: jest.fn(),
      dismissUpdate: jest.fn(),
      checkForUpdates: jest.fn(),
    });

    render(<PWAUpdatePrompt />);
    
    // Progress bar should be visible (it's a div, not a progressbar role)
    const progressContainer = screen.getByText('Installing the latest version. This will only take a moment.').parentElement;
    const progressBar = progressContainer?.querySelector('.bg-blue-600.h-1.rounded-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle update errors gracefully', async () => {
    const mockApplyUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
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
    
    const updateButton = screen.getByRole('button', { name: 'Update Now' });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Update failed:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should check for updates periodically when auto-check is enabled', () => {
    jest.useFakeTimers();
    const mockCheckForUpdates = jest.fn();
    
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
    
    expect(mockCheckForUpdates).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('should check for updates when page becomes visible', () => {
    const mockCheckForUpdates = jest.fn();
    
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
    
    expect(mockCheckForUpdates).toHaveBeenCalled();
  });
});