'use client';

import { useState } from 'react';
import { WeakPasswordInfo } from '@/services/securityService';

interface WeakPasswordsListProps {
  weakPasswords: WeakPasswordInfo[];
  onUpdatePassword: (credentialId: string) => void;
}

export function WeakPasswordsList({ weakPasswords, onUpdatePassword }: WeakPasswordsListProps) {
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

  const getEntropyColor = (entropy: number): string => {
    if (entropy >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (entropy >= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEntropyLabel = (entropy: number): string => {
    if (entropy >= 50) return 'Moderate';
    if (entropy >= 30) return 'Weak';
    return 'Very Weak';
  };

  if (weakPasswords.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Weak Passwords
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No weak passwords found!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your passwords meet the minimum strength requirements.
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
          Weak Passwords
        </h2>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          {weakPasswords.length} issue{weakPasswords.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {weakPasswords.map((item) => {
          const isExpanded = expandedItems.has(item.credential_id);
          const entropyColor = getEntropyColor(item.entropy);
          const entropyLabel = getEntropyLabel(item.entropy);

          return (
            <div
              key={item.credential_id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
                        Strength:
                      </span>
                      <span className={`text-sm font-medium ${entropyColor}`}>
                        {entropyLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Entropy:
                      </span>
                      <span className={`text-sm font-medium ${entropyColor}`}>
                        {item.entropy.toFixed(1)} bits
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-lg bg-white p-4 dark:bg-gray-900">
                      <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                        Recommendations:
                      </h4>
                      <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                        <li>Use at least 12 characters</li>
                        <li>Include uppercase and lowercase letters</li>
                        <li>Add numbers and special characters</li>
                        <li>Avoid common words and patterns</li>
                      </ul>
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
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}