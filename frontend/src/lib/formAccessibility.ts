/**
 * Form Accessibility Utilities
 * 
 * Provides utilities for making forms accessible according to WCAG 2.1 AA standards.
 * Includes helpers for ARIA attributes, error announcements, and field associations.
 */

/**
 * Generate accessibility attributes for form fields
 */
export interface FormFieldAccessibilityProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function getFormFieldAccessibility({
  id,
  label,
  required = false,
  error,
  description
}: FormFieldAccessibilityProps) {
  const errorId = error ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return {
    input: {
      id,
      'aria-label': label,
      'aria-required': required,
      'aria-invalid': !!error,
      'aria-describedby': describedBy,
      required
    },
    label: {
      htmlFor: id
    },
    error: errorId ? {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite' as const
    } : undefined,
    description: descriptionId ? {
      id: descriptionId
    } : undefined
  };
}

/**
 * Generate accessibility attributes for fieldsets
 */
export interface FieldsetAccessibilityProps {
  id: string;
  legend: string;
  description?: string;
}

export function getFieldsetAccessibility({
  id,
  legend,
  description
}: FieldsetAccessibilityProps) {
  const descriptionId = description ? `${id}-description` : undefined;

  return {
    fieldset: {
      'aria-describedby': descriptionId
    },
    legend: {
      id: `${id}-legend`
    },
    description: descriptionId ? {
      id: descriptionId
    } : undefined
  };
}

/**
 * Announce form validation errors to screen readers
 */
export function announceFormError(message: string) {
  // Create a live region if it doesn't exist
  let liveRegion = document.getElementById('form-error-announcer');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'form-error-announcer';
    liveRegion.setAttribute('role', 'alert');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Clear previous message
  liveRegion.textContent = '';
  
  // Set new message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Announce form success to screen readers
 */
export function announceFormSuccess(message: string) {
  let liveRegion = document.getElementById('form-success-announcer');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'form-success-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = '';
  
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Get validation message for required fields
 */
export function getRequiredFieldMessage(fieldName: string): string {
  return `${fieldName} is required`;
}

/**
 * Get validation message for invalid fields
 */
export function getInvalidFieldMessage(fieldName: string, reason?: string): string {
  if (reason) {
    return `${fieldName} is invalid: ${reason}`;
  }
  return `${fieldName} is invalid`;
}
