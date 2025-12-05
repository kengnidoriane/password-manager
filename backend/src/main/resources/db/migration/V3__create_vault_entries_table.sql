-- Create vault_entries table for encrypted credential storage
-- Requirements: 3.1, 3.2, 3.4

CREATE TABLE IF NOT EXISTS vault_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    auth_tag VARCHAR(255) NOT NULL,
    entry_type VARCHAR(50) NOT NULL DEFAULT 'credential',
    folder_id UUID,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    last_used_at TIMESTAMP,
    CONSTRAINT fk_vault_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_entry_type CHECK (entry_type IN ('credential', 'secure_note', 'folder', 'tag'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_vault_entries_user_id ON vault_entries(user_id);

-- Index for non-deleted entries (most common query)
CREATE INDEX idx_vault_entries_user_active ON vault_entries(user_id, deleted_at) WHERE deleted_at IS NULL;

-- Index for soft-deleted entries (trash view)
CREATE INDEX idx_vault_entries_deleted ON vault_entries(user_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- Index for sync operations (ordered by update time)
CREATE INDEX idx_vault_entries_updated_at ON vault_entries(user_id, updated_at DESC);

-- Index for folder hierarchy
CREATE INDEX idx_vault_entries_folder ON vault_entries(folder_id) WHERE folder_id IS NOT NULL;

-- Index for last used tracking
CREATE INDEX idx_vault_entries_last_used ON vault_entries(user_id, last_used_at DESC NULLS LAST);

-- Add comments
COMMENT ON TABLE vault_entries IS 'Stores encrypted vault data including credentials, secure notes, folders, and tags';
COMMENT ON COLUMN vault_entries.encrypted_data IS 'AES-256-GCM encrypted JSON blob containing credential/note data';
COMMENT ON COLUMN vault_entries.iv IS 'Initialization vector for AES-GCM encryption';
COMMENT ON COLUMN vault_entries.auth_tag IS 'Authentication tag for AES-GCM encryption integrity';
COMMENT ON COLUMN vault_entries.entry_type IS 'Type of vault entry: credential, secure_note, folder, or tag';
COMMENT ON COLUMN vault_entries.folder_id IS 'Reference to parent folder (for hierarchical organization)';
COMMENT ON COLUMN vault_entries.version IS 'Version number for optimistic locking and conflict resolution';
COMMENT ON COLUMN vault_entries.deleted_at IS 'Soft delete timestamp (NULL if not deleted, moves to trash for 30 days)';
COMMENT ON COLUMN vault_entries.last_used_at IS 'Timestamp of last access (for sorting by recent use)';
