/**
 * Session Management Integration Tests
 * 
 * Tests the complete session management flow including automatic expiration,
 * locking, and unlocking functionality.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import { SessionProvider } from '../SessionProvider';
import { SessionLock } from '../SessionLock';

// Mock the config
jest.mock('@/lib/config', () => ({
  config: {
    security: {
      sessionTimeout: 900000 // 15 minutes
    }
  }
}));

// Mock the auth service
jest.mock('@/services/authService', () => ({
  authService: {
    logout: jest.fn().mockResolvedValue(undefined),
    refreshToken: jest.fn().mockResolvedValue({
      token: 'new-token',
      expiresAt: Date.now() + 3600000,
      userId: 'user-1'
    })
  }
}));

// Test component that uses session
function TestComponent() {
  const { session, user, isAuthenticated } = useAuthStore();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="session-status">
        {session?.isLocked ? 'Locked' : 'Unlocked'}
      </div>
      <div data-testid="user-email">
        {user?.email || 'No User'}
      </div>
    </div>
  );
}

describe('Session Management Integration', () => {
  beforeEach(() => {
    // Reset the auth store
    useAuthStore.getState().logout();
    jest.clearAllMocks();
  });

  it('should initialize session correctly', () => {
    const { initializeSession, setUser } = useAuthStore.getState();
    
    // Set up user and session
    setUser({
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    
    initializeSession('test-token', Date.now() + 3600000, 'user-1');
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('session-status')).toHaveTextContent('Unlocked');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('should show lock screen when session is locked', async () => {
    const { initializeSession, setUser, lockSession } = useAuthStore.getState();
    
    // Set up user and session
    setUser({
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    
    initializeSession('test-token', Date.now() + 3600000, 'user-1');
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    // Lock the session
    act(() => {
      lockSession();
    });

    // Should show lock screen
    await waitFor(() => {
      expect(screen.getByText('Session Locked')).toBeInTheDocument();
      expect(screen.getByText('Your session has been locked due to inactivity. Please enter your master password to continue.')).toBeInTheDocument();
    });
  });

  it('should unlock session with correct password', async () => {
    const { initializeSession, setUser, lockSession } = useAuthStore.getState();
    
    // Set up user and session
    setUser({
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    
    initializeSession('test-token', Date.now() + 3600000, 'user-1');
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    // Lock the session
    act(() => {
      lockSession();
    });

    // Should show lock screen
    await waitFor(() => {
      expect(screen.getByText('Session Locked')).toBeInTheDocument();
    });

    // Enter password and unlock
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    const unlockButton = screen.getByText('Unlock Session');

    fireEvent.change(passwordInput, { target: { value: 'correct-password' } });
    fireEvent.click(unlockButton);

    // Session should be unlocked (lock screen should disappear)
    await waitFor(() => {
      expect(screen.queryByText('Session Locked')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('session-status')).toHaveTextContent('Unlocked');
  });

  it('should handle logout from lock screen', async () => {
    const { initializeSession, setUser, lockSession } = useAuthStore.getState();
    
    // Set up user and session
    setUser({
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    
    initializeSession('test-token', Date.now() + 3600000, 'user-1');
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    // Lock the session
    act(() => {
      lockSession();
    });

    // Should show lock screen
    await waitFor(() => {
      expect(screen.getByText('Session Locked')).toBeInTheDocument();
    });

    // Click sign out
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    // Should be logged out
    await waitFor(() => {
      expect(screen.queryByText('Session Locked')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
});

describe('SessionLock Component', () => {
  const mockProps = {
    onUnlock: jest.fn(),
    onLogout: jest.fn()
  };

  beforeEach(() => {
    // Set up authenticated user for SessionLock component
    const { setUser, initializeSession, lockSession } = useAuthStore.getState();
    
    setUser({
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    
    initializeSession('test-token', Date.now() + 3600000, 'user-1');
    lockSession();
    
    jest.clearAllMocks();
  });

  it('should render lock screen with user email', () => {
    render(<SessionLock {...mockProps} />);

    expect(screen.getByText('Session Locked')).toBeInTheDocument();
    expect(screen.getByText('Your session has been locked due to inactivity. Please enter your master password to continue.')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should disable unlock button when password is empty', () => {
    render(<SessionLock {...mockProps} />);

    const unlockButton = screen.getByText('Unlock Session');
    expect(unlockButton).toBeDisabled();
  });

  it('should call onUnlock when session is successfully unlocked', async () => {
    render(<SessionLock {...mockProps} />);

    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    const unlockButton = screen.getByText('Unlock Session');

    fireEvent.change(passwordInput, { target: { value: 'correct-password' } });
    fireEvent.click(unlockButton);

    await waitFor(() => {
      expect(mockProps.onUnlock).toHaveBeenCalled();
    });
  });

  it('should call onLogout when sign out is clicked', async () => {
    render(<SessionLock {...mockProps} />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockProps.onLogout).toHaveBeenCalled();
    });
  });
});