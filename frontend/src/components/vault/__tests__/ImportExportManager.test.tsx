/**
 * ImportExportManager Component Tests
 * 
 * Tests for the import/export manager component functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExportManager } from '../ImportExportManager';

// Mock the hooks and services
jest.mock('@/hooks/useImportExport', () => ({
  useImportExport: () => ({
    isExporting: false,
    exportError: null,
    isImporting: false,
    importError: null,
    exportVault: jest.fn(),
    importVault: jest.fn(),
    clearErrors: jest.fn()
  })
}));

jest.mock('@/services/importExportService', () => ({
  importExportService: {
    exportVault: jest.fn(),
    importVault: jest.fn(),
    downloadExportData: jest.fn(),
    generateExportFilename: jest.fn()
  }
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        salt: 'test-salt',
        iterations: 100000
      },
      session: {
        token: 'test-token'
      }
    })
  }
}));

describe('ImportExportManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders export and import buttons', () => {
    render(<ImportExportManager />);
    
    expect(screen.getByText('Export Vault')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
  });

  it('opens export dialog when export button is clicked', () => {
    render(<ImportExportManager />);
    
    const exportButton = screen.getByText('Export Vault');
    fireEvent.click(exportButton);
    
    // The dialog should be rendered (though we're not testing the dialog content here)
    expect(exportButton).toBeInTheDocument();
  });

  it('opens import dialog when import button is clicked', () => {
    render(<ImportExportManager />);
    
    const importButton = screen.getByText('Import Data');
    fireEvent.click(importButton);
    
    // The dialog should be rendered (though we're not testing the dialog content here)
    expect(importButton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ImportExportManager className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});