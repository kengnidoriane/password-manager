import { z } from 'zod';

/**
 * Common validation schemas using Zod
 * Used with React Hook Form for type-safe form validation
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

// Master password validation (12+ chars, mixed case, numbers, symbols)
export const masterPasswordSchema = z
  .string()
  .min(12, 'Master password must be at least 12 characters')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character');

// Regular password validation (8+ chars)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// URL validation
export const urlSchema = z
  .string()
  .refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL or empty'
  });

// Credential validation schema
export const credentialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  url: urlSchema.default(''),
  notes: z.string().default(''),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type CredentialFormData = z.infer<typeof credentialSchema>;

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  masterPassword: z.string().min(1, 'Master password is required'),
  twoFactorCode: z.string().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form validation
export const registerSchema = z.object({
  email: emailSchema,
  masterPassword: masterPasswordSchema,
  confirmPassword: z.string()
}).refine((data) => data.masterPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Folder validation
export const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long'),
  parentId: z.string().optional()
});

export type FolderFormData = z.infer<typeof folderSchema>;

// Tag validation
export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(30, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
});

export type TagFormData = z.infer<typeof tagSchema>;

// Secure note validation
export const secureNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type SecureNoteFormData = z.infer<typeof secureNoteSchema>;

// Password generator options validation
export const generatorOptionsSchema = z.object({
  length: z.number().min(8).max(128),
  includeUppercase: z.boolean(),
  includeLowercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
  excludeAmbiguous: z.boolean()
}).refine(
  (data) => data.includeUppercase || data.includeLowercase || data.includeNumbers || data.includeSymbols,
  {
    message: 'At least one character type must be selected'
  }
);

export type GeneratorOptionsFormData = z.infer<typeof generatorOptionsSchema>;
