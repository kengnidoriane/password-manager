'use client';

/**
 * ExportDialog Component
 * 
 * Dialog for exporting vault data with format selection and master password re-authentication.
 * Supports CSV and JSON formats with optional encryption.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/stores/authStore';
import { config } from '@/lib/config';

const exportSchema = z.object({
  format: z.enum(['CSV', 'JSON'], { required_error: 'Format is required' }),
  masterPassword: z.string().min(1, 'Master password is required for re-authentication'),
  encrypted: z.boolean().default(false),
  exportPassword: z.string().optional(),
  includeDeleted: z.boolean().default(false)
}).refine((data) => {
  if (data.encrypted && !data.exportPassword) {
    return false;
  }
  return true;
}, {
  message: 'Export password is required when encryption is enabled',
  path: ['exportPassword']
});

type ExportFormData = z.infer<typeof exportSchema>;

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (data: ExportFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  isLoading = false
}: ExportDialogProps) {
  const { user } = useAuthStore();
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: 'CSV',
      encrypted: false,
      includeDeleted: false
    }
  });

  const watchedEncrypted = watch('encrypted');
  const watchedFormat = watch('format');

  const handleFormSubmit = async (data: ExportFormData) => {
    try {
      setAuthError(null);
      
      // Verify master password by attempting key derivation
      if (user?.salt && user?.iterations) {
        const salt = CryptoService.base64ToArrayBuffer(user.salt);
        await CryptoService.deriveKeys(data.masterPassword, salt, user.iterations);
      }
      
      await onExport(data);
      reset();
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Key derivation failed')) {
        setAuthError('Invalid master password');
      } else {
        setAuthError('Export failed. Please try again.');
      }
    }
  };

  const handleClose = () => {
    reset();
    setAuthError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Export Vault</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting || isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="CSV"
                    {...register('format')}
                    className="mr-2"
                  />
                  <span className="text-sm">CSV (Comma Separated Values)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="JSON"
                    {...register('format')}
                    className="mr-2"
                  />
                  <span className="text-sm">JSON (JavaScript Object Notation)</span>
                </label>
              </div>
              {errors.format && (
                <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>
              )}
            </div>

            {/* Master Password Re-authentication */}
            <div>
              <label htmlFor="masterPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Master Password *
              </label>
              <div className="relative">
                <input
                  id="masterPassword"
                  type={showMasterPassword ? 'text' : 'password'}
                  {...register('masterPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your master password"
                  disabled={isSubmitting || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPassword(!showMasterPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting || isLoading}
                >
                  {showMasterPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.masterPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.masterPassword.message}</p>
              )}
              {authError && (
                <p className="text-red-500 text-sm mt-1">{authError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Required for security verification
              </p>
            </div>

            {/* Encryption Options */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('encrypted')}
                  className="mr-2"
                  disabled={isSubmitting || isLoading}
                />
                <span className="text-sm font-medium text-gray-700">
                  Encrypt export with password
                </span>
              </label>
              <p className="text-gray-500 text-xs mt-1">
                Recommended for additional security when sharing or storing the export
              </p>
            </div>

            {/* Export Password (conditional) */}
            {watchedEncrypted && (
              <div>
                <label htmlFor="exportPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Export Password *
                </label>
                <div className="relative">
                  <input
                    id="exportPassword"
                    type={showExportPassword ? 'text' : 'password'}
                    {...register('exportPassword')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password for export encryption"
                    disabled={isSubmitting || isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassword(!showExportPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting || isLoading}
                  >
                    {showExportPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.exportPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.exportPassword.message}</p>
                )}
              </div>
            )}

            {/* Include Deleted Items */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('includeDeleted')}
                  className="mr-2"
                  disabled={isSubmitting || isLoading}
                />
                <span className="text-sm font-medium text-gray-700">
                  Include deleted items
                </span>
              </label>
              <p className="text-gray-500 text-xs mt-1">
                Include items in trash (deleted within last 30 days)
              </p>
            </div>

            {/* Security Warning for Unencrypted Export */}
            {!watchedEncrypted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Security Warning</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Unencrypted exports contain your passwords in plain text. Only use this option if you plan to import immediately into another password manager.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </div>
                ) : (
                  `Export ${watchedFormat}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}