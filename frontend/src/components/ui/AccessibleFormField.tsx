/**
 * AccessibleFormField Component
 * 
 * A wrapper component that ensures form fields meet WCAG 2.1 AA accessibility standards.
 * Provides proper label association, error announcements, and ARIA attributes.
 */

import React from 'react';
import { getFormFieldAccessibility } from '@/lib/formAccessibility';

export interface AccessibleFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFormField({
  id,
  label,
  required = false,
  error,
  description,
  children,
  className = ''
}: AccessibleFormFieldProps) {
  const a11y = getFormFieldAccessibility({ id, label, required, error, description });

  return (
    <div className={className}>
      <label
        {...a11y.label}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {description && a11y.description && (
        <p
          {...a11y.description}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      
      <div className="mt-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...a11y.input,
              ...child.props
            } as any);
          }
          return child;
        })}
      </div>
      
      {error && a11y.error && (
        <p
          {...a11y.error}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export interface AccessibleFieldsetProps {
  id: string;
  legend: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFieldset({
  id,
  legend,
  description,
  children,
  className = ''
}: AccessibleFieldsetProps) {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <fieldset
      className={className}
      aria-describedby={descriptionId}
    >
      <legend
        id={`${id}-legend`}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {legend}
      </legend>
      
      {description && (
        <p
          id={descriptionId}
          className="mt-1 mb-3 text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      
      {children}
    </fieldset>
  );
}
