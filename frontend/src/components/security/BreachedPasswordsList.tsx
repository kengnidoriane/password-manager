'use client';

import { useState } from 'react';

/**
 * BreachedPasswordsList Component
 * 
 * Displays list of credentials with passwords found in data breaches.
 * Requirements: 8.1, 8.2
 */

interface BreachedPasswordInfo {
  credential_id: string;
  title: string;
  url: string;
  breach_count: number;
  breach_sources: string[];
  last_breach_date?: string;
}

interface BreachedPasswordsListProps {
  breachedPasswords: BreachedPasswordInfo[];
  onUpdatePassword: (credentialId: string) => void;
}

export function BreachedPasswordsList({ breachedPasswords, onUpdatePassword }: BreachedPasswordsListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (credentialId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(credentialId)) {
      newExpanded.delete(credentialId);
    } else {
      newExpanded.add(credentialId);
    }
    setExpandedItems(newExpanded);
  };

  const getSeverityColor = (breachCount: number): string => {
    if (breachCount >= 5) return 'text-red-600 dark:text-red-400';
    if (breachCount >= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getSeverityLabel = (breachCount: number): string => {
    if (breachCount >= 5) return 'Critical';
    if (breachCount >= 3) return 'High';
    return 'Medium';
  };

  const getSeverityBgColor = (breachCount: number): string => {
    if (breachCount >= 5) return 'bg-red-100 dark:bg-red-900';
    if (breachCount >= 3) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-yellow-100 dark:bg-yellow-900';
  };

  if (breachedPasswords.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Breached Passwords
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No breached passwords found!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              None of your passwords appear in known data breaches.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Breached Passwords
        </h2>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          {breachedPasswords.length} breach{breachedPasswords.length !== 1 ? 'es' : ''} found
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-3 w-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-medium text-red-800 dark:text-red-200">
              Immediate Action Required
            </h5>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              These passwords have been found in data breaches and should be changed immediately. 
              Attackers may already have access to these passwords.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {breachedPasswords.map((item) => {
          const isExpanded = expandedItems.has(item.credential_id);
          const severityColor = getSeverityColor(item.breach_count);
          const severityLabel = getSeverityLabel(item.breach_count);
          const severityBgColor = getSeverityBgColor(item.breach_count);

          return (
            <div
              key={item.credential_id}
              className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      {item.url && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.url}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Severity:
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityBgColor} ${severityColor}`}>
                        {severityLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Found in:
                      </span>
                      <span className={`text-sm font-medium ${severityColor}`}>
                        {item.breach_count} breach{item.breach_count !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
                        <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                          Breach Details:
                        </h4>
                        <div className="space-y-2">
                          {item.breach_sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="h-2 w-2 rounded-full bg-red-400"></div>
                              <span>{source}</span>
                            </div>
                          ))}
                        </div>
                        {item.last_breach_date && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Most recent breach: {new Date(item.last_breach_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                        <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
                          Immediate Actions Required:
                        </h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-300">
                          <li>Change this password immediately</li>
                          <li>Use a unique, strong password</li>
                          <li>Enable two-factor authentication if available</li>
                          <li>Monitor the account for suspicious activity</li>
                          <li>Check if any personal information was compromised</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(item.credential_id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    <svg 
                      className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onUpdatePassword(item.credential_id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              How We Check for Breaches
            </h5>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              We use k-anonymity to check passwords against known breach databases without exposing your actual passwords. 
              Only a partial hash is sent, ensuring your privacy is protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}