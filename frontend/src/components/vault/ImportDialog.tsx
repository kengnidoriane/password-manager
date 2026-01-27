'use client';

/**
 * ImportDialog Component
 * 
 * Dialog for importing vault data from external sources with file upload,
 * duplicate resolution, and import summary display.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const importSchema = z.object({
  format: z.enum(['CSV', 'JSON'], { required_error: 'Format is required' }),
  source: z.string().optional(),
  skipDuplicates: z.boolean().default(false),
  mergeDuplicates: z.boolean().default(false)
}).refine((data) => {
  // Can't both skip and merge duplicates
  if (data.skipDuplicates && data.mergeDuplicates) {
    return false;
  }
  return true;
}, {
  message: 'Cannot both skip and merge duplicates',
  path: ['mergeDuplicates']
});

type ImportFormData = z.infer<typeof importSchema>;

export interface ImportSummary {
  imported: number;
  duplicates: number;
  errors: number;
  total: number;
  errorMessages: string[];
  duplicateEntries: Array<{
    title: string;
    username: string;
    url: string;
    existingEntryId: string;
    action: 'SKIPPED' | 'MERGED' | 'REPLACED';
  }>;
}

export interface DuplicateResolution {
  entryIndex: number;
  action: 'skip' | 'merge' | 'replace';
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, options: ImportFormData) => Promise<ImportSummary>;
  isLoading?: boolean;
}

export function ImportDialog({
  isOpen,
  onClose,
  onImport,
  isLoading = false
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [duplicateResolutions, setDuplicateResolutions] = useState<DuplicateResolution[]>([]);
  const [showDuplicateResolution, setShowDuplicateResolution] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      format: 'CSV',
      skipDuplicates: false,
      mergeDuplicates: false
    }
  });

  const watchedSkipDuplicates = watch('skipDuplicates');
  const watchedMergeDuplicates = watch('mergeDuplicates');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleFormSubmit = async (data: ImportFormData) => {
    if (!selectedFile) {
      setImportError('Please select a file to import');
      return;
    }

    try {
      setImportError(null);
      const summary = await onImport(selectedFile, data);
      setImportSummary(summary);
      
      // If there are duplicates and no resolution strategy was chosen, show resolution UI
      if (summary.duplicates > 0 && !data.skipDuplicates && !data.mergeDuplicates) {
        setShowDuplicateResolution(true);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const handleDuplicateResolution = (entryIndex: number, action: 'skip' | 'merge' | 'replace') => {
    setDuplicateResolutions(prev => {
      const existing = prev.find(r => r.entryIndex === entryIndex);
      if (existing) {
        return prev.map(r => r.entryIndex === entryIndex ? { ...r, action } : r);
      } else {
        return [...prev, { entryIndex, action }];
      }
    });
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setImportSummary(null);
    setDuplicateResolutions([]);
    setShowDuplicateResolution(false);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Import Vault Data</h2>
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

          {/* Import Summary Display */}
          {importSummary && !showDuplicateResolution && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Import Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importSummary.imported}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importSummary.duplicates}</div>
                  <div className="text-sm text-yellow-700">Duplicates</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importSummary.errors}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importSummary.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>

              {/* Error Messages */}
              {importSummary.errorMessages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Import Errors:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importSummary.errorMessages.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Duplicate Entries */}
              {importSummary.duplicateEntries.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Duplicate Entries:</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 max-h-32 overflow-y-auto">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {importSummary.duplicateEntries.map((duplicate, index) => (
                        <li key={index}>
                          • {duplicate.title} ({duplicate.username}) - {duplicate.action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Resolution UI */}
          {showDuplicateResolution && importSummary && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Resolve Duplicates</h3>
              <p className="text-sm text-gray-600 mb-4">
                We found {importSummary.duplicates} duplicate entries. Choose how to handle each one:
              </p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {importSummary.duplicateEntries.map((duplicate, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{duplicate.title}</h4>
                        <p className="text-sm text-gray-600">{duplicate.username} • {duplicate.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDuplicateResolution(index, 'skip')}
                        className={`px-3 py-1 text-xs rounded ${
                          duplicateResolutions.find(r => r.entryIndex === index)?.action === 'skip'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleDuplicateResolution(index, 'merge')}
                        className={`px-3 py-1 text-xs rounded ${
                          duplicateResolutions.find(r => r.entryIndex === index)?.action === 'merge'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        Merge
                      </button>
                      <button
                        onClick={() => handleDuplicateResolution(index, 'replace')}
                        className={`px-3 py-1 text-xs rounded ${
                          duplicateResolutions.find(r => r.entryIndex === index)?.action === 'replace'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowDuplicateResolution(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Apply Resolutions
                </button>
              </div>
            </div>
          )}

          {/* Import Form */}
          {!importSummary && (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File to Import
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting || isLoading}
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-700"
                        disabled={isSubmitting || isLoading}
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                          disabled={isSubmitting || isLoading}
                        >
                          Click to upload
                        </button>
                        <p className="text-sm text-gray-500">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-400">CSV or JSON files only</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="CSV"
                      {...register('format')}
                      className="mr-2"
                      disabled={isSubmitting || isLoading}
                    />
                    <span className="text-sm">CSV (Comma Separated Values)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="JSON"
                      {...register('format')}
                      className="mr-2"
                      disabled={isSubmitting || isLoading}
                    />
                    <span className="text-sm">JSON (JavaScript Object Notation)</span>
                  </label>
                </div>
                {errors.format && (
                  <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>
                )}
              </div>

              {/* Source Selection */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source (Optional)
                </label>
                <select
                  id="source"
                  {...register('source')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting || isLoading}
                >
                  <option value="">Select source...</option>
                  <option value="Chrome">Google Chrome</option>
                  <option value="Firefox">Mozilla Firefox</option>
                  <option value="Safari">Safari</option>
                  <option value="Edge">Microsoft Edge</option>
                  <option value="1Password">1Password</option>
                  <option value="LastPass">LastPass</option>
                  <option value="Bitwarden">Bitwarden</option>
                  <option value="Dashlane">Dashlane</option>
                  <option value="KeePass">KeePass</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Duplicate Handling Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duplicate Handling
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('skipDuplicates')}
                      className="mr-2"
                      disabled={isSubmitting || isLoading || watchedMergeDuplicates}
                    />
                    <span className="text-sm">Skip duplicate entries</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('mergeDuplicates')}
                      className="mr-2"
                      disabled={isSubmitting || isLoading || watchedSkipDuplicates}
                    />
                    <span className="text-sm">Merge duplicate entries</span>
                  </label>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  If neither option is selected, you'll be prompted to resolve duplicates individually
                </p>
                {errors.mergeDuplicates && (
                  <p className="text-red-500 text-sm mt-1">{errors.mergeDuplicates.message}</p>
                )}
              </div>

              {/* Import Error */}
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{importError}</p>
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
                  disabled={isSubmitting || isLoading || !selectedFile}
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </div>
                  ) : (
                    'Import Data'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}