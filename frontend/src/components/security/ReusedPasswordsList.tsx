'use client';

import { useState } from 'react';

/**
 * ReusedPasswordsList Component
 * 
 * Displays list of credentials that share the same password.
 * Requirements: 8.3
 */

interface ReusedPasswordsListProps {
  reusedPasswords: Record<string, string[]>;
  onUpdatePassword: (credentialId: string) => void;
}

export function ReusedPasswordsList({ reusedPasswords, onUpdatePassword }: ReusedPasswordsListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpanded = (passwordHash: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(passwordHash)) {
      newExpanded.delete(passwordHash);
    } else {
      newExpanded.add(passwordHash);
    }
    setExpandedGroups(newExpanded);
  };

  const reusedPasswordEntries = Object.entries(reusedPasswords);

  if (reusedPasswordEntries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Reused Passwords
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No reused passwords found!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your passwords are unique across your accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalReusedCredentials = reusedPasswordEntries.reduce(
    (total, [, credentials]) => total + credentials.length,
    0
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Reused Passwords
        </h2>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          {totalReusedCredentials} credential{totalReusedCredentials !== 1 ? 's' : ''} affected
        </span>
      </div>

      <div className="space-y-4">
        {reusedPasswordEntries.map(([passwordHash, credentialTitles], index) => {
          const isExpanded = expandedGroups.has(passwordHash);
          const groupNumber = index + 1;

          return (
            <div
              key={passwordHash}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                      <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Password Group #{groupNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {credentialTitles.length} accounts using the same password
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
                        <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
                          Affected Accounts:
                        </h4>
                        <div className="space-y-2">
                          {credentialTitles.map((title, credIndex) => (
                            <div
                              key={`${passwordHash}-${credIndex}`}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {title}
                              </span>
                              <button
                                onClick={() => onUpdatePassword(`${passwordHash}-${credIndex}`)}
                                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                              >
                                Update
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                            <svg className="h-3 w-3 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Security Risk
                            </h5>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                              If one account is compromised, all accounts using this password are at risk. 
                              Update each account with a unique, strong password.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(passwordHash)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
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
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {credentialTitles.length}
                  </span>
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
              Best Practice
            </h5>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Use the password generator to create unique, strong passwords for each account. 
              This prevents a single breach from affecting multiple accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}