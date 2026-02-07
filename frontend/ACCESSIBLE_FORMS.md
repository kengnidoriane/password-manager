# Accessible Forms Implementation

This document describes the accessible forms implementation in the Password Manager application, ensuring compliance with WCAG 2.1 AA standards (Requirement 20.5).

## Overview

All forms in the application follow accessibility best practices:
- Labels are properly associated with inputs using `htmlFor`/`id` attributes
- Required fields are marked with both `required` and `aria-required` attributes
- Error messages use `role="alert"` and `aria-live="polite"` for screen reader announcements
- Grouped inputs use `<fieldset>` and `<legend>` elements
- Inline validation provides immediate feedback

## Components

### AccessibleFormField

A wrapper component that ensures form fields meet accessibility standards.

**Usage:**

```tsx
import { AccessibleFormField } from '@/components/ui/AccessibleFormField';

<AccessibleFormField
  id="email"
  label="Email Address"
  required={true}
  error={errors.email?.message}
  description="We'll never share your email"
>
  <input
    type="email"
    className="..."
  />
</AccessibleFormField>
```

**Props:**
- `id` (required): Unique identifier for the input
- `label` (required): Label text
- `required` (optional): Whether the field is required
- `error` (optional): Error message to display
- `description` (optional): Help text for the field
- `children`: The input element
- `className` (optional): Additional CSS classes

**Generated Attributes:**
- Label: `htmlFor={id}`
- Input: `id`, `aria-label`, `aria-required`, `aria-invalid`, `aria-describedby`, `required`
- Error: `id="{id}-error"`, `role="alert"`, `aria-live="polite"`
- Description: `id="{id}-description"`

### AccessibleFieldset

A component for grouping related form inputs.

**Usage:**

```tsx
import { AccessibleFieldset } from '@/components/ui/AccessibleFormField';

<AccessibleFieldset
  id="password-options"
  legend="Password Generator Options"
  description="Configure how your password will be generated"
>
  <label>
    <input type="checkbox" />
    Include uppercase letters
  </label>
  <label>
    <input type="checkbox" />
    Include numbers
  </label>
</AccessibleFieldset>
```

**Props:**
- `id` (required): Unique identifier for the fieldset
- `legend` (required): Legend text
- `description` (optional): Description for the fieldset
- `children`: The grouped inputs
- `className` (optional): Additional CSS classes

## Utility Functions

### getFormFieldAccessibility

Generates accessibility attributes for form fields.

```typescript
import { getFormFieldAccessibility } from '@/lib/formAccessibility';

const a11y = getFormFieldAccessibility({
  id: 'username',
  label: 'Username',
  required: true,
  error: 'Username is required',
  description: 'Choose a unique username'
});

// Returns:
// {
//   input: { id, aria-label, aria-required, aria-invalid, aria-describedby, required },
//   label: { htmlFor },
//   error: { id, role, aria-live },
//   description: { id }
// }
```

### announceFormError / announceFormSuccess

Announce form validation results to screen readers.

```typescript
import { announceFormError, announceFormSuccess } from '@/lib/formAccessibility';

// On validation error
announceFormError('Please fix the errors in the form');

// On successful submission
announceFormSuccess('Your credential has been saved');
```

## Implementation Examples

### Login Form

The LoginForm demonstrates proper label association and error handling:

```tsx
<div>
  <label
    htmlFor="email"
    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    Email <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
    className="..."
  />
  {errors.email && (
    <p id="email-error" role="alert" aria-live="polite" className="...">
      {errors.email.message}
    </p>
  )}
</div>
```

### Credential Form with Fieldset

The CredentialForm uses fieldsets for the password generator:

```tsx
<fieldset
  className="..."
  aria-describedby="password-generator-description"
>
  <legend className="...">
    Password Generator
  </legend>
  <p id="password-generator-description" className="sr-only">
    Configure password generation options including length and character types
  </p>
  
  <div className="space-y-3">
    {/* Length slider */}
    <div>
      <label htmlFor="password-length">
        Length: {generatorOptions.length}
      </label>
      <input
        id="password-length"
        type="range"
        aria-label={`Password length: ${generatorOptions.length} characters`}
        aria-valuemin={8}
        aria-valuemax={128}
        aria-valuenow={generatorOptions.length}
      />
    </div>

    {/* Character type checkboxes */}
    <fieldset>
      <legend>Character Types</legend>
      <label>
        <input
          type="checkbox"
          aria-label="Include uppercase letters A-Z"
        />
        <span>A-Z</span>
      </label>
      {/* More checkboxes... */}
    </fieldset>
  </div>
</fieldset>
```

## Best Practices

### 1. Label Association

**Always** associate labels with inputs using `htmlFor` and `id`:

```tsx
// ✅ Good
<label htmlFor="password">Password</label>
<input id="password" type="password" />

// ❌ Bad - no association
<label>Password</label>
<input type="password" />
```

### 2. Required Field Indicators

Mark required fields with both attributes:

```tsx
// ✅ Good
<input
  required
  aria-required="true"
/>

// ❌ Bad - missing aria-required
<input required />
```

### 3. Error Messages

Error messages must have proper ARIA attributes:

```tsx
// ✅ Good
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'field-error' : undefined}
/>
{error && (
  <p id="field-error" role="alert" aria-live="polite">
    {error}
  </p>
)}

// ❌ Bad - no ARIA attributes
{error && <p>{error}</p>}
```

### 4. Grouped Inputs

Use fieldset and legend for related inputs:

```tsx
// ✅ Good
<fieldset>
  <legend>Contact Information</legend>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  <label htmlFor="phone">Phone</label>
  <input id="phone" type="tel" />
</fieldset>

// ❌ Bad - no grouping
<div>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  <label htmlFor="phone">Phone</label>
  <input id="phone" type="tel" />
</div>
```

### 5. Inline Validation

Provide immediate feedback with announcements:

```tsx
const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    announceFormSuccess('Form submitted successfully');
  } catch (error) {
    announceFormError('Please fix the errors in the form');
  }
};
```

## Testing

The form accessibility implementation is validated by property-based tests in:
- `frontend/src/components/__tests__/form-label-association.property.test.tsx`

These tests verify:
- All inputs have associated labels via `htmlFor`/`id`
- Required fields have both `required` and `aria-required` attributes
- Error messages have proper ARIA attributes (`role="alert"`, `aria-live="polite"`)
- Fieldsets have legends
- Fieldsets with descriptions have proper `aria-describedby`

Run tests with:
```bash
npm test -- form-label-association.property.test.tsx
```

## WCAG 2.1 AA Compliance

This implementation satisfies the following WCAG success criteria:

- **1.3.1 Info and Relationships (Level A)**: Information, structure, and relationships conveyed through presentation can be programmatically determined
- **3.3.1 Error Identification (Level A)**: If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text
- **3.3.2 Labels or Instructions (Level A)**: Labels or instructions are provided when content requires user input
- **3.3.3 Error Suggestion (Level AA)**: If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user
- **4.1.3 Status Messages (Level AA)**: Status messages can be programmatically determined through role or properties

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA Forms](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/forms)
