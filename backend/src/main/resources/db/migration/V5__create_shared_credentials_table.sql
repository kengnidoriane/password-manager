-- Create shared_credentials table for secure credential sharing
-- Requirements: 9.1, 9.2, 9.3, 9.4

CREATE TABLE IF NOT EXISTS shared_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    vault_entry_id UUID NOT NULL,
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    auth_tag VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    CONSTRAINT fk_shared_credentials_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shared_credentials_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shared_credentials_vault_entry FOREIGN KEY (vault_entry_id) REFERENCES vault_entries(id) ON DELETE CASCADE,
    CONSTRAINT chk_different_users CHECK (owner_id != recipient_id),
    CONSTRAINT chk_permissions CHECK (
        jsonb_typeof(permissions) = 'array' AND
        permissions <@ '["read", "write", "share"]'::jsonb
    )
);

-- Create index for recipient lookups (shared with me view)
CREATE INDEX idx_shared_credentials_recipient ON shared_credentials(recipient_id, revoked_at) 
    WHERE revoked_at IS NULL;

-- Create index for owner lookups (shared by me view)
CREATE INDEX idx_shared_credentials_owner ON shared_credentials(owner_id, revoked_at) 
    WHERE revoked_at IS NULL;

-- Create index for vault entry lookups (who has access to this credential)
CREATE INDEX idx_shared_credentials_vault_entry ON shared_credentials(vault_entry_id, revoked_at) 
    WHERE revoked_at IS NULL;

-- Create composite index for access tracking
CREATE INDEX idx_shared_credentials_access ON shared_credentials(recipient_id, last_accessed_at DESC);

-- Unique constraint to prevent duplicate shares
CREATE UNIQUE INDEX idx_shared_credentials_unique_active ON shared_credentials(owner_id, recipient_id, vault_entry_id) 
    WHERE revoked_at IS NULL;

-- Add comments
COMMENT ON TABLE shared_credentials IS 'Manages secure sharing of credentials between users';
COMMENT ON COLUMN shared_credentials.owner_id IS 'User who owns and shares the credential';
COMMENT ON COLUMN shared_credentials.recipient_id IS 'User who receives the shared credential';
COMMENT ON COLUMN shared_credentials.vault_entry_id IS 'Reference to the original vault entry being shared';
COMMENT ON COLUMN shared_credentials.encrypted_data IS 'Credential data encrypted with recipient public key';
COMMENT ON COLUMN shared_credentials.iv IS 'Initialization vector for encryption';
COMMENT ON COLUMN shared_credentials.auth_tag IS 'Authentication tag for encryption integrity';
COMMENT ON COLUMN shared_credentials.permissions IS 'JSON array of permissions: read, write, share';
COMMENT ON COLUMN shared_credentials.revoked_at IS 'Timestamp when sharing was revoked (NULL if still active)';
COMMENT ON COLUMN shared_credentials.last_accessed_at IS 'Last time recipient accessed this shared credential';
