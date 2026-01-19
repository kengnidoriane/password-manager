'use client';

/**
 * ImportExportManager Component
 * 
 * Manages import and export dialogs with integrated state management.
 * Provides buttons to trigger import/export operations and handles the dialog states.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4
 */

import { useState } from 'react';
import { ExportDialog } from './ExportDialog';
import { ImportDialog, ImportSummary } from './ImportDialog';
import { useImportExport } from '@/hooks/useImportExport';
import { ExportRequest } from '@/services/importExportService';

interface ImportExportManagerProps {
  className?: string;
}

export function ImportExportManager({ className = '' }: ImportExportManagerProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const {
    isExporting,
    exportError,
    isImporting,
    importError,
    exportVault,
    importVault,
    clearErrors
  } = useImportExport();

  const handleExport = async (data: ExportRequest) => {
    try {
      await exportVault(data);
      setShowExportDialog(false);
    } catch (error) {
      // Error is handled by the hook and displayed in the dialog
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (
    file: File,
    options: { format: 'CSV' | 'JSON'; source?: string; skipDuplicates: boolean; mergeDuplicates: boolean }
  ): Promise<ImportSummary> => {
    try {
      const summary = await importVault(file, options);
      return summary;
    } catch (error) {
      // Error is handled by the hook and displayed in the dialog
      console.error('Import failed:', error);
      throw error;
    }
  };

  const handleExportDialogClose = () => {
    setShowExportDialog(false);
    clearErrors();
  };

  const handleImportDialogClose = () => {
    setShowImportDialog(false);
    clearErrors();
  };

  return (
    <div className={className}>
      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => setShowExportDialog(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isExporting || isImporting}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Vault
        </button>
        
        <button
          onClick={() => setShowImportDialog(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isExporting || isImporting}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import Data
        </button>
      </div>

      {/* Status Messages */}
      {(exportError || importError) && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Operation Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {exportError || importError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(isExporting || isImporting) && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <svg className="animate-spin w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-blue-700">
              {isExporting ? 'Exporting vault data...' : 'Importing vault data...'}
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={handleExportDialogClose}
        onExport={handleExport}
        isLoading={isExporting}
      />
      
      <ImportDialog
        isOpen={showImportDialog}
        onClose={handleImportDialogClose}
        onImport={handleImport}
        isLoading={isImporting}
      />
    </div>
  );
}