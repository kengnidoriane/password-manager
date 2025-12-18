/**
 * Session Management Hook Tests
 * 
 * Tests for the useSession hook functionality including session expiration,
 * activity tracking, and automatic refresh.
 */

import { renderHook, act } from '@testing-library/react';
import { useSession } from '../useSession';
import { useAuthStore } from '@/stores/authStore';

// Mock the auth store
jest.mock('@/stores/authStore');

// Mock the config
jest.mock('@/lib/config', () => ({
  config: {
    security: {
      sessionTimeout: 900000 // 15 minutes
    }
  }
}));

const mockAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('useSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementation
    mockAuthStore.mockReturnValue({
      session: null,
      user: null,
      isAuthenticated: false,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: jest.fn(),
      lockSession: jest.fn(),
      logout: jest.fn(),
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);
  });

  it('should return correct session status when not authenticated', () => {
    const { result } = renderHook(() => useSession());

    expect(result.current.sessionStatus.isActive).toBe(false);
    expect(result.current.sessionStatus.isLocked).toBe(false);
    expect(result.current.sessionStatus.isExpired).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return correct session status when authenticated with active session', () => {
    const mockSession = {
      token: 'test-token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      isLocked: false,
      lastActivity: Date.now() - 60000 // 1 minute ago
    };

    mockAuthStore.mockReturnValue({
      session: mockSession,
      user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() },
      isAuthenticated: true,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: jest.fn(),
      lockSession: jest.fn(),
      logout: jest.fn(),
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);

    const { result } = renderHook(() => useSession());

    expect(result.current.sessionStatus.isActive).toBe(true);
    expect(result.current.sessionStatus.isLocked).toBe(false);
    expect(result.current.sessionStatus.isExpired).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return correct session status when session is locked', () => {
    const mockSession = {
      token: 'test-token',
      expiresAt: Date.now() + 3600000,
      isLocked: true,
      lastActivity: Date.now() - 60000
    };

    mockAuthStore.mockReturnValue({
      session: mockSession,
      user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() },
      isAuthenticated: true,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: jest.fn(),
      lockSession: jest.fn(),
      logout: jest.fn(),
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);

    const { result } = renderHook(() => useSession());

    expect(result.current.sessionStatus.isActive).toBe(false);
    expect(result.current.sessionStatus.isLocked).toBe(true);
    expect(result.current.sessionStatus.isExpired).toBe(false);
  });

  it('should call refresh session when refresh is invoked', async () => {
    const mockRefreshSession = jest.fn().mockResolvedValue(true);
    
    mockAuthStore.mockReturnValue({
      session: {
        token: 'test-token',
        expiresAt: Date.now() + 3600000,
        isLocked: false,
        lastActivity: Date.now()
      },
      user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() },
      isAuthenticated: true,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: mockRefreshSession,
      lockSession: jest.fn(),
      logout: jest.fn(),
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockRefreshSession).toHaveBeenCalled();
  });

  it('should call lock session when lock is invoked', () => {
    const mockLockSession = jest.fn();
    
    mockAuthStore.mockReturnValue({
      session: {
        token: 'test-token',
        expiresAt: Date.now() + 3600000,
        isLocked: false,
        lastActivity: Date.now()
      },
      user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() },
      isAuthenticated: true,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: jest.fn(),
      lockSession: mockLockSession,
      logout: jest.fn(),
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);

    const { result } = renderHook(() => useSession());

    act(() => {
      result.current.lock();
    });

    expect(mockLockSession).toHaveBeenCalled();
  });

  it('should call logout when logout is invoked', async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    
    mockAuthStore.mockReturnValue({
      session: {
        token: 'test-token',
        expiresAt: Date.now() + 3600000,
        isLocked: false,
        lastActivity: Date.now()
      },
      user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() },
      isAuthenticated: true,
      updateActivity: jest.fn(),
      checkSessionExpiry: jest.fn(),
      refreshSession: jest.fn(),
      lockSession: jest.fn(),
      logout: mockLogout,
      startSessionTimer: jest.fn(),
      clearSessionTimer: jest.fn()
    } as any);

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});