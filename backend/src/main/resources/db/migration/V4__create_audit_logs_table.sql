-- Create audit_logs table for security and activity tracking
-- Requirements: 18.1, 18.5

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_action CHECK (action IN (
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'REGISTER', 
        'CREDENTIAL_CREATE', 'CREDENTIAL_READ', 'CREDENTIAL_UPDATE', 'CREDENTIAL_DELETE',
        'CREDENTIAL_COPY', 'CREDENTIAL_EXPORT', 'CREDENTIAL_IMPORT',
        'NOTE_CREATE', 'NOTE_READ', 'NOTE_UPDATE', 'NOTE_DELETE',
        'FOLDER_CREATE', 'FOLDER_UPDATE', 'FOLDER_DELETE',
        'TAG_CREATE', 'TAG_UPDATE', 'TAG_DELETE',
        'SHARE_CREATE', 'SHARE_REVOKE', 'SHARE_ACCESS',
        'VAULT_SYNC', 'VAULT_EXPORT', 'VAULT_IMPORT',
        '2FA_ENABLE', '2FA_DISABLE', '2FA_VERIFY',
        'PASSWORD_CHANGE', 'ACCOUNT_RECOVERY', 'ACCOUNT_DELETE',
        'SETTINGS_UPDATE', 'SESSION_TIMEOUT'
    ))
);

-- Create composite index for user activity queries (most common)
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- Index for action type filtering
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);

-- Index for failed authentication tracking
CREATE INDEX idx_audit_logs_failed_auth ON audit_logs(user_id, action, timestamp DESC) 
    WHERE action = 'LOGIN_FAILED';

-- Index for suspicious activity detection
CREATE INDEX idx_audit_logs_suspicious ON audit_logs(user_id, ip_address, timestamp DESC) 
    WHERE success = FALSE;

-- Index for resource-specific audit trails
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC) 
    WHERE resource_id IS NOT NULL;

-- Partial index for recent logs (90 days retention policy)
CREATE INDEX idx_audit_logs_recent ON audit_logs(timestamp DESC) 
    WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Add comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all user actions and security events';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., LOGIN, CREDENTIAL_CREATE)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., credential, note, folder)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client (IPv4 or IPv6)';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN audit_logs.device_info IS 'Parsed device information (OS, browser, device type)';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action succeeded';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data in JSON format';
