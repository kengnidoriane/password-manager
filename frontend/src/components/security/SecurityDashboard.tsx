'use client';

import { useState, useEffect } from 'react';
import { SecurityScore } from './SecurityScore';
import { WeakPasswordsList } from './WeakPasswordsList';
import { ReusedPasswordsList } from './ReusedPasswordsList';
import { BreachedPasswordsList } from './BreachedPasswordsList';
import { securityService, SecurityReportResponse, BreachedPasswordInfo } from '@/services/securityService';
import { useAuthStore } from '@/stores/authStore';
import { useVault } from '@/hooks/useVault';
import { useRouter } from 'next/navigation';

/**
 * SecurityDashboard Component
 * 
 * Main security dashboard that displays comprehensive security analysis
 * and provides actionable recommendations for improving vault security.
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

interface SecurityDashboardProps {
  onUpdatePassword?: (credentialId: string) => void;
}

export function SecurityDashboard({ onUpdatePassword }: SecurityDashboardProps) {
  const [securityReport, setSecurityReport] = useState<SecurityReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { session } = useAuthStore();
  const { credentials } = useVault();
  const router = useRouter();

  // Get token from session
  const token = session?.token;

  // Mock breached passwords data (since backend doesn't support breach checking yet)
  const mockBreachedPasswords: BreachedPasswordInfo[] = [
    // This would be populated from actual breach checking service
  ];

  /**
   * Load security report from the backend
   */
  const loadSecurityReport = async (showRefreshing = false) => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      const report = await securityService.getSecurityReport(token);
      setSecurityReport(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load security report';
      setError(errorMessage);
      console.error('Failed to load security report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle password update request
   */
  const handleUpdatePassword = (credentialId: string) => {
    if (onUpdatePassword) {
      onUpdatePassword(credentialId);
    } else {
      // Default behavior: navigate to vault with edit mode
      // We'll pass the credential ID as a query parameter
      router.push(`/vault?edit=${credentialId}`);
    }
  };

  /**
   * Refresh security report
   */
  const handleRefresh = () => {
    loadSecurityReport(true);
  };

  // Load security report on component mount
  useEffect(() => {
    loadSecurityReport();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-12 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-3">
              <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Failed to Load Security Report
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-red-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!securityReport) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No security report available</p>
      </div>
    );
  }

  const hasSecurityIssues = 
    securityReport.weak_passwords.length > 0 ||
    Object.keys(securityReport.reused_passwords).length > 0 ||
    mockBreachedPasswords.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and improve your vault security
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
        >
          <svg 
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Security Score */}
      <SecurityScore 
        score={securityReport.overall_score} 
        totalCredentials={securityReport.total_credentials}
      />

      {/* Actionable Recommendations */}
      {securityReport.recommendations.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                Security Recommendations
              </h3>
              <div className="mt-2 space-y-2">
                {securityReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Quick Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/generator')}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-blue-900"
                >
                  Generate Strong Passwords
                </button>
                {securityReport.weak_passwords.length > 0 && (
                  <button
                    onClick={() => {
                      // Scroll to weak passwords section
                      const element = document.getElementById('weak-passwords-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-blue-900"
                  >
                    Fix Weak Passwords
                  </button>
                )}
                {Object.keys(securityReport.reused_passwords).length > 0 && (
                  <button
                    onClick={() => {
                      // Scroll to reused passwords section
                      const element = document.getElementById('reused-passwords-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-blue-900"
                  >
                    Fix Reused Passwords
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Issues Summary */}
      {hasSecurityIssues && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-orange-800 dark:text-orange-200">
                Security Issues Found
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                We've identified some security issues that need your attention. 
                Review the sections below and take action to improve your vault security.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {securityReport.weak_passwords.length > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {securityReport.weak_passwords.length} weak password{securityReport.weak_passwords.length !== 1 ? 's' : ''}
                  </span>
                )}
                {Object.keys(securityReport.reused_passwords).length > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {Object.keys(securityReport.reused_passwords).length} reused password{Object.keys(securityReport.reused_passwords).length !== 1 ? 's' : ''}
                  </span>
                )}
                {mockBreachedPasswords.length > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                    {mockBreachedPasswords.length} breached password{mockBreachedPasswords.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breached Passwords (highest priority) */}
      <div id="breached-passwords-section">
        <BreachedPasswordsList 
          breachedPasswords={mockBreachedPasswords}
          onUpdatePassword={handleUpdatePassword}
        />
      </div>

      {/* Weak Passwords */}
      <div id="weak-passwords-section">
        <WeakPasswordsList 
          weakPasswords={securityReport.weak_passwords}
          onUpdatePassword={handleUpdatePassword}
        />
      </div>

      {/* Reused Passwords */}
      <div id="reused-passwords-section">
        <ReusedPasswordsList 
          reusedPasswords={securityReport.reused_passwords}
          onUpdatePassword={handleUpdatePassword}
        />
      </div>

      {/* Report metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Report generated: {new Date(securityReport.generated_at).toLocaleString()}
          </span>
          <span>
            {securityReport.total_credentials} credential{securityReport.total_credentials !== 1 ? 's' : ''} analyzed
          </span>
        </div>
      </div>
    </div>
  );
}