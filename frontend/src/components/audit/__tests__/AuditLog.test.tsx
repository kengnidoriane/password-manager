/**
 * AuditLog Component Tests
 * 
 * Tests for the audit log component including rendering, filtering, and export functionality.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AuditLog } from '../AuditLog';
import { useAuthStore } from '@/stores/authStore';
import { AuditService } from '@/services/auditService';

// Mock the auth store
jest.mock('@/stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the audit service
jest.mock('@/services/auditService');
const mockAuditService = AuditService as jest.Mocked<typeof AuditService>;

describe('AuditLog Component', () => {
  const mockSession = {
    token: 'mock-token',
    userId: 'user-123',
    expiresAt: Date.now() + 3600000,
    isLocked: false,
  };

  const mockAuditLogs = {
    logs: [
      {
        id: 'log-1',
        action: 'LOGIN' as const,
        resourceType: null,
        resourceId: null,
        ipAddress: '192.168.1.1',
        deviceInfo: 'Chrome on Windows',
        success: true,
        errorMessage: null,
        timestamp: '2024-01-15T10:30:00',
        suspicious: false,
      },
      {
        id: 'log-2',
        action: 'LOGIN_FAILED' as const,
        resourceType: null,
        resourceId: null,
        ipAddress: '192.168.1.2',
        deviceInfo: 'Firefox on Mac',
        success: false,
        errorMessage: 'Invalid credentials',
        timestamp: '2024-01-15T10:25:00',
        suspicious: true,
      },
    ],
    page: 0,
    size: 20,
    totalPages: 1,
    totalElements: 2,
    first: true,
    last: true,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock auth store
    mockUseAuthStore.mockReturnValue({
      session: mockSession,
      user: null,
      isAuthenticated: true,
      setUser: jest.fn(),
      clearUser: jest.fn(),
      initializeSession: jest.fn(),
      updateSessionActivity: jest.fn(),
      lockSession: jest.fn(),
      unlockSession: jest.fn(),
      clearSession: jest.fn(),
    });

    // Mock audit service
    mockAuditService.getAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);
    mockAuditService.formatActionName = jest.fn((action) => 
      action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    );
    mockAuditService.getActionCategory = jest.fn((action) => {
      if (action.toString().startsWith('LOGIN') || action === 'LOGOUT') {
        return 'Authentication';
      }
      return 'Other';
    });
  });

  it('renders audit log component', async () => {
    render(<AuditLog />);

    // Check for header
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('View and filter your account activity history')).toBeInTheDocument();

    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('displays audit logs in table', async () => {
    render(<AuditLog />);

    await waitFor(() => {
      // Check for successful login in table (not in dropdown)
      const loginCells = screen.getAllByText('Login');
      expect(loginCells.length).toBeGreaterThan(1); // Should be in dropdown and table
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();

      // Check for failed login - use getAllByText to handle multiple occurrences
      const loginFailedCells = screen.getAllByText('Login Failed');
      expect(loginFailedCells.length).toBeGreaterThan(0);
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
      expect(screen.getByText('Firefox on Mac')).toBeInTheDocument();
      expect(screen.getByText('Suspicious')).toBeInTheDocument();
    });
  });

  it('highlights suspicious activities', async () => {
    render(<AuditLog />);

    await waitFor(() => {
      const suspiciousBadge = screen.getByText('Suspicious');
      expect(suspiciousBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  it('displays pagination information', async () => {
    render(<AuditLog />);

    await waitFor(() => {
      // Use more flexible text matching for pagination
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Showing 1 to 2 of 2 results';
      })).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Page 1 of 1';
      })).toBeInTheDocument();
    });
  });

  it('shows export button', async () => {
    render(<AuditLog />);

    await waitFor(() => {
      const exportButton = screen.getByText('Export to CSV');
      expect(exportButton).toBeInTheDocument();
      // The button is disabled during loading, so we need to wait for loading to complete
      expect(exportButton).not.toBeDisabled();
    });
  });

  it('displays filter controls', async () => {
    render(<AuditLog />);

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Action Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Device')).toBeInTheDocument();
    expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows empty state when no logs', async () => {
    mockAuditService.getAuditLogs = jest.fn().mockResolvedValue({
      logs: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
      first: true,
      last: true,
    });

    render(<AuditLog />);

    await waitFor(() => {
      expect(screen.getByText('No audit logs found')).toBeInTheDocument();
      expect(screen.getByText('Your activity will appear here')).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    mockAuditService.getAuditLogs = jest.fn().mockRejectedValue(new Error('API Error'));

    render(<AuditLog />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    // Mock a delayed response
    mockAuditService.getAuditLogs = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAuditLogs), 1000))
    );

    render(<AuditLog />);

    expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
  });
});
