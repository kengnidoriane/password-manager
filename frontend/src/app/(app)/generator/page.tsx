'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Metadata } from 'next';
import { PasswordGeneratorService, GeneratorOptions, GeneratedPassword as GeneratedPasswordType } from '@/lib/passwordGenerator';
import { PasswordValidationService, PasswordStrength } from '@/lib/passwordValidation';
import { GeneratorConfig } from '@/components/generator/GeneratorConfig';
import { StrengthMeter } from '@/components/generator/StrengthMeter';
import { GeneratedPassword } from '@/components/generator/GeneratedPassword';
import { useVault } from '@/hooks/useVault';
import { CredentialForm } from '@/components/vault/CredentialForm';
import { CredentialFormData } from '@/lib/validations';

/**
 * Password Generator Page
 * Generate secure passwords with customizable options
 */
export default function GeneratorPage() {
  const { createCredential } = useVault();
  
  // Generator state
  const [generatorOptions, setGeneratorOptions] = useState<GeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false
  });
  
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Generate initial password on mount
  useEffect(() => {
    handleGeneratePassword();
  }, []);

  // Generate password with current options
  const handleGeneratePassword = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const result = PasswordGeneratorService.generatePassword(generatorOptions);
      setGeneratedPassword(result.password);
      setPasswordStrength(result.strength);
    } catch (error) {
      console.error('Password generation failed:', error);
      // Show error notification or fallback
      setGeneratedPassword('');
      setPasswordStrength(null);
    } finally {
      setIsGenerating(false);
    }
  }, [generatorOptions]);

  // Handle options change and regenerate
  const handleOptionsChange = useCallback((newOptions: GeneratorOptions) => {
    setGeneratorOptions(newOptions);
    // Auto-regenerate when options change
    setTimeout(() => {
      handleGeneratePassword();
    }, 100);
  }, [handleGeneratePassword]);

  // Handle copy action
  const handleCopy = useCallback(() => {
    // Optional: Add analytics or notifications
    console.log('Password copied to clipboard');
  }, []);

  // Handle save to credential
  const handleSaveToCredential = useCallback(() => {
    if (!generatedPassword) return;
    setShowSaveForm(true);
  }, [generatedPassword]);

  // Handle credential form submission
  const handleCredentialSubmit = useCallback(async (data: CredentialFormData) => {
    try {
      await createCredential({
        ...data,
        password: generatedPassword
      });
      
      setShowSaveForm(false);
      // Optional: Show success notification
      console.log('Credential saved successfully');
    } catch (error) {
      console.error('Failed to save credential:', error);
      throw error; // Let the form handle the error
    }
  }, [createCredential, generatedPassword]);

  // Handle credential form cancel
  const handleCredentialCancel = useCallback(() => {
    setShowSaveForm(false);
  }, []);

  if (showSaveForm) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleCredentialCancel}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Generator</span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
            <CredentialForm
              onSubmit={handleCredentialSubmit}
              onCancel={handleCredentialCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Password Generator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create strong, secure passwords with customizable options
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Generator Configuration */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
              <GeneratorConfig
                options={generatorOptions}
                onChange={handleOptionsChange}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Right Column - Generated Password and Strength */}
          <div className="space-y-6">
            {/* Generated Password */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
              <GeneratedPassword
                password={generatedPassword}
                onCopy={handleCopy}
                onSave={handleSaveToCredential}
                onRegenerate={handleGeneratePassword}
                isGenerating={isGenerating}
                showSaveOption={true}
              />
            </div>

            {/* Password Strength */}
            {passwordStrength && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Password Strength Analysis
                </h3>
                <StrengthMeter strength={passwordStrength} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setGeneratorOptions({
                  length: 16,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: true,
                  excludeAmbiguous: false
                });
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Strong Password</span>
            </button>
            
            <button
              onClick={() => {
                setGeneratorOptions({
                  length: 16,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: false,
                  excludeAmbiguous: true
                });
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>Memorable</span>
            </button>
            
            <button
              onClick={() => {
                setGeneratorOptions({
                  length: 32,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: true,
                  excludeAmbiguous: false
                });
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Maximum Security</span>
            </button>
          </div>
        </div>

        {/* Tips and Best Practices */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 dark:bg-blue-900/20">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
            Password Security Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Use unique passwords for each account</span>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Longer passwords are generally stronger</span>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Include multiple character types</span>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Avoid personal information in passwords</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
