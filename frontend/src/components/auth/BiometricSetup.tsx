'use client';

import React, { useState, useEffect } from 'react';
import { biometricService } from '@/services/biometricService';

interface BiometricSetupProps {
  userId: string;
  masterKey: string;
  onSetupComplete: (success: boolean) => void;
  onCancel: () => void;
}

export function BiometricSetup({ userId, masterKey, onSetupComplete, onCancel }: BiometricSetupProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'check' | 'setup' | 'complete'>('check');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const supported = await biometricService.isSupported();
      setIsSupported(supported);
      if (supported) {
        setSetupStep('setup');
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsSupported(false);
      setError('Unable to check biometric support');
    }
  };

  const handleSetupBiometric = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await biometricService.setupBiometric(userId, masterKey);
      
      if (result.success) {
        setSetupStep('complete');
        setTimeout(() => {
          onSetupComplete(true);
        }, 2000);
      } else {
        setError(result.error || 'Failed to set up biometric authentication');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      setError('An unexpected error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSupported === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking biometric support...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Biometric Authentication Not Available
            </h3>
            <p className="text-gray-600 mb-6">
              Your device or browser doesn't support biometric authentication, or no biometric sensors are available.
            </p>
            <button
              onClick={onCancel}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {setupStep === 'setup' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Set Up Biometric Authentication
            </h3>
            <p className="text-gray-600 mb-6">
              Use your fingerprint, face ID, or other biometric authentication to quickly unlock your password vault.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSetupBiometric}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  'Set Up Biometric Authentication'
                )}
              </button>
              
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {setupStep === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Biometric Authentication Enabled
            </h3>
            <p className="text-gray-600 mb-4">
              You can now use biometric authentication to quickly access your password vault.
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-green-200 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}