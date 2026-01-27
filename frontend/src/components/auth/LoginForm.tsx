'use client';

/**
 * LoginForm Component
 * 
 * Handles user authentication with master password and biometric authentication.
 * Uses React Hook Form + Zod for validation.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { authService, type AuthError } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { BackupCodeInput } from './BackupCodeInput';
import { BiometricAuth } from './BiometricAuth';
import { biometricService } from '@/services/biometricService';

export function LoginForm() {
  const router = useRouter();
  const { setUser, setSession, setLoading } = useAuthStore();
  const [apiError, setApiError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // Check biometric availability on component mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const supported = await biometricService.isSupported();
      const setup = biometricService.isBiometricSetup();
      setBiometricAvailable(supported && setup);
      
      // Auto-show biometric if available
      if (supported && setup) {
        setShowBiometric(true);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricSuccess = async (masterKey: string) => {
    try {
      setApiError('');
      setLoading(true);

      // Get email from form or stored value
      const formData = getValues();
      if (!formData.email) {
        setApiError('Please enter your email address first.');
        setShowBiometric(false);
        return;
      }

      // Use the master key to authenticate
      const response = await authService.loginWithMasterKey({
        email: formData.email,
        masterKey: masterKey,
      });

      authService.initializeUserSession(response, formData.email);
      router.push('/vault');
    } catch (error) {
      const authError = error as AuthError;
      setApiError(authError.message || 'Biometric authentication failed.');
      setShowBiometric(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricFallback = () => {
    setShowBiometric(false);
    setApiError('');
  };

  const handleBiometricError = (error: string) => {
    setApiError(error);
    setShowBiometric(false);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError('');
      setLoading(true);

      // Validate crypto support
      if (!authService.validateCryptoSupport()) {
        setApiError('Your browser does not support required security features. Please use a modern browser.');
        return;
      }

      // Authenticate with API
      const response = await authService.login({
        email: data.email,
        masterPassword: data.masterPassword,
        twoFactorCode: data.twoFactorCode,
      });

      // Initialize session using the auth service
      authService.initializeUserSession(response, data.email);

      // Redirect to vault
      router.push('/vault');
    } catch (error) {
      const authError = error as AuthError;
      
      // Check if 2FA is required
      if (authError.code === '2FA_REQUIRED') {
        setRequires2FA(true);
        setApiError('Please enter your 2FA code to continue.');
      } else {
        setApiError(authError.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeSubmit = async (backupCode: string) => {
    try {
      setApiError('');
      setLoading(true);

      const formData = getValues();
      const response = await authService.login({
        email: formData.email,
        masterPassword: formData.masterPassword,
        twoFactorCode: backupCode,
        isBackupCode: true,
      });

      authService.initializeUserSession(response, formData.email);
      router.push('/vault');
    } catch (error) {
      const authError = error as AuthError;
      setApiError(authError.message || 'Invalid backup code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show biometric authentication if available and enabled
  if (showBiometric) {
    return (
      <BiometricAuth
        onSuccess={handleBiometricSuccess}
        onFallback={handleBiometricFallback}
        onError={handleBiometricError}
      />
    );
  }

  // Show backup code input if requested
  if (showBackupCodeInput) {
    return (
      <BackupCodeInput
        onSubmit={handleBackupCodeSubmit}
        onCancel={() => setShowBackupCodeInput(false)}
        isLoading={isSubmitting}
        error={apiError}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* API Error Message */}
      {apiError && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <div className="mt-1">
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="you@example.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Master Password Field */}
      <div>
        <label
          htmlFor="masterPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Master Password
        </label>
        <div className="relative mt-1">
          <input
            {...register('masterPassword')}
            id="masterPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="Enter your master password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.masterPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.masterPassword.message}
          </p>
        )}
      </div>

      {/* 2FA Code Field */}
      <div>
        <label
          htmlFor="twoFactorCode"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Two-Factor Code {requires2FA && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
          <input
            {...register('twoFactorCode')}
            id="twoFactorCode"
            type="text"
            autoComplete="one-time-code"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="000000"
            maxLength={6}
          />
        </div>
        {errors.twoFactorCode && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.twoFactorCode.message}
          </p>
        )}
        {requires2FA && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowBackupCodeInput(true)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Can't access your authenticator? Use a backup code
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </div>

      {/* Biometric Authentication Button */}
      {biometricAvailable && (
        <div>
          <button
            type="button"
            onClick={() => setShowBiometric(true)}
            disabled={isSubmitting || !getValues('email')}
            className="flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Use Biometric Authentication
          </button>
          {!getValues('email') && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your email address first
            </p>
          )}
        </div>
      )}

      {/* Register Link */}
      <div className="text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
        </span>
        <a
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Create one
        </a>
      </div>
    </form>
  );
}
