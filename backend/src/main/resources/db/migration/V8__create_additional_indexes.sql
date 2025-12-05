-- Create additional performance indexes based on common query patterns
-- Requirements: Performance optimization for all features

-- Composite index for vault sync queries (user + updated_at + not deleted)
CREATE INDEX idx_vault_sync_query ON vault_entries(user_id, updated_at DESC, deleted_at) 
    WHERE deleted_at IS NULL;

-- Index for folder hierarchy queries (parent-child relationships)
CREATE INDEX idx_vault_folder_hierarchy ON vault_entries(folder_id, entry_type, deleted_at) 
    WHERE entry_type = 'folder' AND deleted_at IS NULL;

-- Index for tag filtering queries
CREATE INDEX idx_vault_tags ON vault_entries(entry_type, deleted_at) 
    WHERE entry_type = 'tag' AND deleted_at IS NULL;

-- Index for credential type entries only
CREATE INDEX idx_vault_credentials ON vault_entries(user_id, entry_type, deleted_at) 
    WHERE entry_type = 'credential' AND deleted_at IS NULL;

-- Index for secure notes only
CREATE INDEX idx_vault_notes ON vault_entries(user_id, entry_type, deleted_at) 
    WHERE entry_type = 'secure_note' AND deleted_at IS NULL;

-- Composite index for audit log date range queries
CREATE INDEX idx_audit_logs_date_range ON audit_logs(user_id, timestamp DESC, action);

-- Index for security report queries (failed logins by IP)
CREATE INDEX idx_audit_failed_by_ip ON audit_logs(ip_address, timestamp DESC) 
    WHERE action = 'LOGIN_FAILED' AND success = FALSE;

-- Index for session cleanup job (find expired sessions)
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at, is_active) 
    WHERE is_active = TRUE AND expires_at < CURRENT_TIMESTAMP;

-- Index for concurrent session limit enforcement
CREATE INDEX idx_sessions_concurrent ON sessions(user_id, created_at DESC) 
    WHERE is_active = TRUE;

-- Add comments
COMMENT ON INDEX idx_vault_sync_query IS 'Optimizes vault synchronization queries';
COMMENT ON INDEX idx_vault_folder_hierarchy IS 'Optimizes folder tree navigation';
COMMENT ON INDEX idx_vault_tags IS 'Optimizes tag listing and filtering';
COMMENT ON INDEX idx_audit_logs_date_range IS 'Optimizes audit log date range queries';
COMMENT ON INDEX idx_sessions_cleanup IS 'Optimizes expired session cleanup job';
