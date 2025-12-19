/**
 * Vault Data Types
 * 
 * TypeScript interfaces for vault data models.
 * These interfaces ensure type safety across the application.
 */

// Re-export from db.ts for convenience
export type {
  Credential,
  Folder,
  Tag,
  SecureNote,
  SyncQueue,
  AppSettings
} from '@/lib/db';

/**
 * Form data types for creating new items (without generated fields)
 */
export type CredentialFormData = Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'lastUsed'>;

export type FolderFormData = Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>;

export type TagFormData = Omit<Tag, 'id' | 'createdAt'>;

export type SecureNoteFormData = Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update data types (partial updates)
 */
export type CredentialUpdateData = Partial<Omit<Credential, 'id' | 'createdAt'>>;

export type FolderUpdateData = Partial<Omit<Folder, 'id' | 'createdAt'>>;

export type SecureNoteUpdateData = Partial<Omit<SecureNote, 'id' | 'createdAt'>>;

/**
 * Search and filter types
 */
export interface SearchFilters {
  folderId?: string | null;
  tags?: string[];
  query?: string;
}

export interface VaultStats {
  credentialCount: number;
  folderCount: number;
  tagCount: number;
  noteCount: number;
  pendingSyncCount: number;
}

/**
 * Sync operation types
 */
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncResourceType = 'credential' | 'folder' | 'tag' | 'note';

export interface SyncOperationData {
  operation: SyncOperation;
  resourceType: SyncResourceType;
  resourceId: string;
  data?: any;
  timestamp: number;
}

/**
 * Clipboard operation types
 */
export interface ClipboardOperation {
  type: 'username' | 'password' | 'url' | 'notes';
  credentialId: string;
  timestamp: number;
}

/**
 * Password strength analysis
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  crackTime: string;
  entropy: number;
}

/**
 * Security analysis types
 */
export interface SecurityIssue {
  type: 'weak' | 'reused' | 'old' | 'breached';
  credentialId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityReport {
  score: number; // 0-100
  issues: SecurityIssue[];
  summary: {
    weakPasswords: number;
    reusedPasswords: number;
    oldPasswords: number;
    breachedPasswords: number;
  };
}

/**
 * Import/Export types
 */
export interface ImportResult {
  successful: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
}

export interface ExportOptions {
  format: 'csv' | 'json';
  encrypted: boolean;
  password?: string;
  includeNotes?: boolean;
  includeFolders?: boolean;
}

/**
 * Folder tree structure for UI
 */
export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  credentialCount: number;
  noteCount: number;
}

/**
 * Tag with usage statistics
 */
export interface TagWithStats extends Tag {
  usageCount: number;
}

/**
 * Credential with resolved references
 */
export interface CredentialWithRefs extends Credential {
  folderName?: string;
  tagNames: string[];
}

/**
 * Secure note with resolved references
 */
export interface SecureNoteWithRefs extends SecureNote {
  folderName?: string;
  tagNames: string[];
}

/**
 * UI state types
 */
export interface VaultUIState {
  selectedView: 'credentials' | 'notes' | 'folders' | 'tags';
  selectedCredentialId?: string;
  selectedNoteId?: string;
  isCreating: boolean;
  isEditing: boolean;
  showDeletedItems: boolean;
}

/**
 * Notification types
 */
export interface VaultNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string;
  operation: SyncOperation;
  resourceType: SyncResourceType;
  resourceId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Biometric authentication types
 */
export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  createdAt: number;
}

/**
 * Session lock types
 */
export interface SessionLockState {
  isLocked: boolean;
  lockedAt?: number;
  reason?: 'timeout' | 'manual' | 'security';
}

/**
 * Audit log types
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
}

/**
 * Sharing types
 */
export interface SharedCredential {
  id: string;
  credentialId: string;
  sharedBy: string;
  sharedWith: string;
  permissions: ('read' | 'write')[];
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessed?: number;
}

/**
 * Recovery types
 */
export interface RecoveryKey {
  key: string;
  createdAt: number;
  usedAt?: number;
}

/**
 * Two-factor authentication types
 */
export interface TwoFactorAuth {
  enabled: boolean;
  secret?: string;
  backupCodes: string[];
  lastUsed?: number;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  sessionTimeout: number; // milliseconds
  clipboardTimeout: number; // milliseconds
  biometricEnabled: boolean;
  strictSecurityMode: boolean;
  autoLockOnIdle: boolean;
  showPasswordStrength: boolean;
  defaultPasswordLength: number;
  passwordGeneratorSettings: {
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    excludeAmbiguous: boolean;
  };
}