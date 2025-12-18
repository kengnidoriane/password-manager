/**
 * RegisterForm Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';

// Mock the auth service
jest.mock('@/services/authService', () => ({
  authService: {
    validateCryptoSupport: jest.fn(() => true),
    register: jest.fn(),
  },
}));

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    setUser: jest.fn(),
    setLoading: jest.fn(),
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock password validation service
jest.mock('@/lib/passwordValidation', () => ({
  PasswordValidationService: {
    analyzePasswordStrength: jest.fn(() => ({
      score: 75,
      entropy: 60,
      crackTime: '1 year',
      crackTimeSeconds: 31536000,
      feedback: ['Good password strength'],
      isWeak: false,
    })),
  },
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^master password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm master password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('validates master password requirements', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^master password$/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/master password must be at least 12 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^master password$/i);
    const confirmInput = screen.getByLabelText(/confirm master password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('shows password strength meter', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^master password$/i);
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });

    await waitFor(() => {
      expect(screen.getAllByText(/password strength/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/^good$/i)).toBeInTheDocument();
    });
  });
});