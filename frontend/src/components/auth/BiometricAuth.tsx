'use client';

import React, { useState, useEffect } from 'react';
import { biometricService } from '@/services/biometricService';

interface BiometricAuthProps {
  onSuccess: (masterKey: string) => void;
  onFallback: () => void;
  onError: (error: string) => void;
}

export function BiometricAuth({ onSuccess, onFallback, onError }: BiometricAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const supported = await biometricService.isSupported();
      const setup = biometricService.isBiometricSetup();
      
      setIsSupported(supported);
      setIsSetup(setup);

      // If not supported or not set up, fall back to password
      if (!supported || !setup) {
        onFallback();
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      onFallback();
    }
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);

    try {
      const result = await biometricService.authenticateWithBiometric();
      
      if (result.success && result.masterKey) {
        onSuccess(result.masterKey);
      } else {
        onError(result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      onError('An unexpected error occurred during biometric authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger biometric auth when component mounts and is available
  useEffect(() => {
    if (isSupported && isSetup && !isLoading) {
      handleBiometricAuth();
    }
  }, [isSupported, isSetup]);

  if (isSupported === null) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking biometric authentication...</p>
      </div>
    );
  }

  if (!isSupported || !isSetup) {
    return null; // Component will trigger fallback
  }

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        ) : (
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Biometric Authentication
      </h2>
      
      <p className="text-gray-600 mb-6">
        {isLoading 
          ? 'Authenticating with biometric sensor...'
          : 'Use your fingerprint, face ID, or other biometric authentication to unlock your vault.'
        }
      </p>

      <div className="space-y-3">
        {!isLoading && (
          <button
            onClick={handleBiometricAuth}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Authenticate with Biometrics
          </button>
        )}
        
        <button
          onClick={onFallback}
          disabled={isLoading}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          Use Master Password Instead
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>Biometric authentication keeps your master password secure while providing quick access to your vault.</p>
      </div>
    </div>
  );
}