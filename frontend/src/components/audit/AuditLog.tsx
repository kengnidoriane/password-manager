'use client';

/**
 * AuditLog Component
 * 
 * Displays audit logs in a table view with filtering, pagination, and export functionality.
 * Highlights suspicious activities (failed operations).
 * 
 * Requirements: 18.2, 18.3, 18.4
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  AuditService,
  AuditLogEntry,
  AuditLogPageResponse,
  AuditLogFilters,
  AuditAction,
} from '@/services/auditService';

export function AuditLog() {
  const { session } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
  const [deviceFilter, setDeviceFilter] = useState('');

  /**
   * Fetch audit logs with current filters
   */
  const fetchLogs = useCallback(async () => {
    if (!session?.token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: AuditLogFilters = {
        page: currentPage,
        size: pageSize,
      };

      if (startDate) {
        filters.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        filters.endDate = new Date(endDate).toISOString();
      }
      if (selectedAction) {
        filters.action = selectedAction;
      }
      if (deviceFilter) {
        filters.device = deviceFilter;
      }

      const response: AuditLogPageResponse = await AuditService.getAuditLogs(
        session.token,
        filters
      );

      setLogs(response.logs);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.token, currentPage, pageSize, startDate, endDate, selectedAction, deviceFilter]);

  /**
   * Export audit logs to CSV
   */
  const handleExport = async () => {
    if (!session?.token) {
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const filters: Pick<AuditLogFilters, 'startDate' | 'endDate'> = {};

      if (startDate) {
        filters.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        filters.endDate = new Date(endDate).toISOString();
      }

      const blob = await AuditService.exportAuditLogs(session.token, filters);
      
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      AuditService.downloadCsv(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit logs');
      console.error('Failed to export audit logs:', err);
    } finally {
      setExporting(false);
    }
  };

  /**
   * Reset filters to default values
   */
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAction('');
    setDeviceFilter('');
    setCurrentPage(0);
  };

  /**
   * Apply filters and reset to first page
   */
  const handleApplyFilters = () => {
    setCurrentPage(0);
    // fetchLogs will be called automatically by useEffect when currentPage changes
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Get status badge color based on success/suspicious flags
   */
  const getStatusBadgeClass = (log: AuditLogEntry): string => {
    if (log.suspicious) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (!log.success) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-green-100 text-green-800 border-green-300';
  };

  /**
   * Get status text
   */
  const getStatusText = (log: AuditLogEntry): string => {
    if (log.suspicious) {
      return 'Suspicious';
    }
    if (!log.success) {
      return 'Failed';
    }
    return 'Success';
  };

  // Fetch logs on mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and filter your account activity history
            {totalElements > 0 && (
              <span className="ml-2 text-gray-500">
                ({totalElements.toLocaleString()} total entries)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Type */}
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              id="action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as AuditAction | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <optgroup label="Authentication">
                <option value={AuditAction.LOGIN}>Login</option>
                <option value={AuditAction.LOGOUT}>Logout</option>
                <option value={AuditAction.LOGIN_FAILED}>Login Failed</option>
                <option value={AuditAction.REGISTER}>Register</option>
              </optgroup>
              <optgroup label="Credentials">
                <option value={AuditAction.CREDENTIAL_CREATE}>Create</option>
                <option value={AuditAction.CREDENTIAL_READ}>Read</option>
                <option value={AuditAction.CREDENTIAL_UPDATE}>Update</option>
                <option value={AuditAction.CREDENTIAL_DELETE}>Delete</option>
                <option value={AuditAction.CREDENTIAL_COPY}>Copy</option>
              </optgroup>
              <optgroup label="Vault">
                <option value={AuditAction.VAULT_SYNC}>Sync</option>
                <option value={AuditAction.VAULT_EXPORT}>Export</option>
                <option value={AuditAction.VAULT_IMPORT}>Import</option>
              </optgroup>
              <optgroup label="Security">
                <option value={AuditAction.TWO_FA_ENABLE}>Enable 2FA</option>
                <option value={AuditAction.TWO_FA_DISABLE}>Disable 2FA</option>
                <option value={AuditAction.PASSWORD_CHANGE}>Password Change</option>
                <option value={AuditAction.ACCOUNT_RECOVERY}>Account Recovery</option>
              </optgroup>
            </select>
          </div>

          {/* Device Filter */}
          <div>
            <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
              Device
            </label>
            <input
              type="text"
              id="device"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              placeholder="e.g., Chrome on Windows"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-3 items-center">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          {(startDate || endDate || selectedAction || deviceFilter) && (
            <span className="text-sm text-blue-600 font-medium">
              Filters active
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading audit logs...</p>
        </div>
      )}

      {/* Audit Logs Table */}
      {!loading && logs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className={log.suspicious ? 'bg-red-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {AuditService.formatActionName(log.action)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {AuditService.getActionCategory(log.action)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(
                          log
                        )}`}
                      >
                        {getStatusText(log)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={log.deviceInfo}>
                        {log.deviceInfo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.errorMessage ? (
                        <div className="max-w-xs truncate text-red-600" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min((currentPage + 1) * pageSize, totalElements)}
              </span>{' '}
              of <span className="font-medium">{totalElements}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {startDate || endDate || selectedAction || deviceFilter
              ? 'Try adjusting your filters'
              : 'Your activity will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}
