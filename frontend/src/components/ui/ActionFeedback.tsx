/**
 * Action Feedback Component
 * Provides visual and auditory feedback for user actions
 * Requirements: 20.4 - Multi-modal feedback
 */

import React, { useState, useEffect } from 'react';
import { screenReaderService } from '@/services/screenReaderService';

export interface ActionFeedbackProps {
  action: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  children: React.ReactNode;
  onComplete?: () => void;
}

/**
 * Wraps an action with visual and screen reader feedback
 */
export function ActionFeedback({
  action,
  status,
  message,
  children,
  onComplete,
}: ActionFeedbackProps) {
  const [previousStatus, setPreviousStatus] = useState(status);

  useEffect(() => {
    // Announce status changes to screen readers
    if (status !== previousStatus) {
      switch (status) {
        case 'loading':
          screenReaderService.announceLoading(`${action} in progress`);
          break;
        case 'success':
          screenReaderService.announceSuccess(message || `${action} completed successfully`);
          if (onComplete) {
            setTimeout(onComplete, 1000);
          }
          break;
        case 'error':
          screenReaderService.announceError(message || `${action} failed`);
          break;
      }
      setPreviousStatus(status);
    }
  }, [status, previousStatus, action, message, onComplete]);

  return <>{children}</>;
}

/**
 * Button with integrated action feedback
 */
export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: string;
  status?: 'idle' | 'loading' | 'success' | 'error';
  successMessage?: string;
  errorMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function ActionButton({
  action,
  status = 'idle',
  successMessage,
  errorMessage,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className = '',
  ...props
}: ActionButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const isDisabled = disabled || status === 'loading';

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-busy={status === 'loading'}
      aria-live="polite"
    >
      {/* Loading spinner */}
      {status === 'loading' && (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
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
      )}

      {/* Success icon */}
      {status === 'success' && showFeedback && (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {/* Error icon */}
      {status === 'error' && showFeedback && (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {/* Button text */}
      <span>
        {status === 'loading' && `${action}...`}
        {status === 'success' && showFeedback && (successMessage || 'Success!')}
        {status === 'error' && showFeedback && (errorMessage || 'Error')}
        {(status === 'idle' || !showFeedback) && children}
      </span>

      {/* Screen reader status */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'loading' && `${action} in progress`}
        {status === 'success' && (successMessage || `${action} completed successfully`)}
        {status === 'error' && (errorMessage || `${action} failed`)}
      </span>
    </button>
  );
}

/**
 * Progress indicator with multi-modal feedback
 */
export interface ProgressIndicatorProps {
  label: string;
  current: number;
  total: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressIndicator({
  label,
  current,
  total,
  showPercentage = true,
  size = 'md',
  className = '',
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {percentage}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-gray-200 rounded-full dark:bg-gray-700 ${heightClasses[size]}`}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label}: ${current} of ${total} (${percentage}%)`}
      >
        <div
          className={`bg-blue-600 ${heightClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="sr-only">
        {label}: {current} of {total} completed ({percentage}%)
      </span>
    </div>
  );
}
