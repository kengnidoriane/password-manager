/**
 * Status Indicator Component
 * Provides multi-modal feedback using color, icons, and text
 * Requirements: 20.4 - Multi-modal feedback
 */

import React from 'react';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';

export interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({
  status,
  message,
  showIcon = true,
  showText = true,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Color and style classes based on status
  const statusClasses = {
    success: 'text-green-700 dark:text-green-400',
    error: 'text-red-700 dark:text-red-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    info: 'text-blue-700 dark:text-blue-400',
    loading: 'text-gray-700 dark:text-gray-400',
    idle: 'text-gray-500 dark:text-gray-500',
  };

  // Default messages
  const defaultMessages = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading',
    idle: 'Ready',
  };

  const displayMessage = message || defaultMessages[status];

  // Render icon based on status
  const renderIcon = () => {
    if (!showIcon) return null;

    const iconClass = `${iconSizes[size]} ${statusClasses[status]}`;

    switch (status) {
      case 'success':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>Success</title>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>Error</title>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>Warning</title>
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>Information</title>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'loading':
        return (
          <svg
            className={`${iconSizes[size]} ${statusClasses[status]} animate-spin`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <title>Loading</title>
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'idle':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>Ready</title>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {renderIcon()}
      {showText && (
        <span className={statusClasses[status]}>
          {/* Screen reader only status type */}
          <span className="sr-only">{defaultMessages[status]}: </span>
          {displayMessage}
        </span>
      )}
    </div>
  );
}

/**
 * Loading Spinner Component
 * Dedicated loading indicator with multi-modal feedback
 */
export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ message = 'Loading', size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <StatusIndicator
      status="loading"
      message={message}
      size={size}
      className={className}
    />
  );
}

/**
 * Status Badge Component
 * Compact status indicator with background color
 */
export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, label, size = 'md', className = '' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const badgeClasses = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    loading: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    idle: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${badgeClasses[status]} ${className}`}
      role="status"
      aria-label={`${status}: ${label}`}
    >
      <span className="sr-only">{status}: </span>
      {label}
    </span>
  );
}
