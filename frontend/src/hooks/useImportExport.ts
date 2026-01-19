/**
 * useImportExport Hook
 * 
 * Custom hook for managing import and export operations
 * with state management and error handling.
 */

import { useState, useCallback } from 'react';
import { importExportService, ExportRequest, ImportResponse } from '@/services/importExportService';
import { ImportSummary } from '@/components/vault/ImportDialog';

interface UseImportExportReturn {
  // Export state
  isExporting: boolean;
  exportError: string | null;
  
  // Import state
  isImporting: boolean;
  importError: string | null;
  
  // Actions
  exportVault: (request: ExportRequest) => Promise<void>;
  importVault: (file: File, options: { format: 'CSV' | 'JSON'; source?: string; skipDuplicates: boolean; mergeDuplicates: boolean }) => Promise<ImportSummary>;
  clearErrors: () => void;
}

export function useImportExport(): UseImportExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const exportVault = useCallback(async (request: ExportRequest) => {
    try {
      setIsExporting(true);
      setExportError(null);

      const response = await importExportService.exportVault(request);
      
      // Generate filename and download
      const filename = importExportService.generateExportFilename(
        request.format,
        request.encrypted
      );
      
      importExportService.downloadExportData(
        response.data,
        filename,
        request.format
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportError(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importVault = useCallback(async (
    file: File,
    options: { format: 'CSV' | 'JSON'; source?: string; skipDuplicates: boolean; mergeDuplicates: boolean }
  ): Promise<ImportSummary> => {
    try {
      setIsImporting(true);
      setImportError(null);

      const response = await importExportService.importVault(file, options);
      
      // Convert API response to ImportSummary format
      const summary: ImportSummary = {
        imported: response.imported,
        duplicates: response.duplicates,
        errors: response.errors,
        total: response.total,
        errorMessages: response.errorMessages,
        duplicateEntries: response.duplicateEntries
      };
      
      return summary;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setImportError(errorMessage);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setExportError(null);
    setImportError(null);
  }, []);

  return {
    isExporting,
    exportError,
    isImporting,
    importError,
    exportVault,
    importVault,
    clearErrors
  };
}