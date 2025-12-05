-- Create database functions and triggers for automated tasks
-- Requirements: 3.4 (soft delete cleanup), 18.5 (audit log retention)

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for vault_entries table
CREATE TRIGGER trigger_vault_entries_updated_at
    BEFORE UPDATE ON vault_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for shared_credentials table
CREATE TRIGGER trigger_shared_credentials_updated_at
    BEFORE UPDATE ON shared_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_settings table
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create default user settings on user registration
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings for new users
CREATE TRIGGER trigger_create_user_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Function to permanently delete soft-deleted vault entries after 30 days
CREATE OR REPLACE FUNCTION cleanup_old_deleted_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM vault_entries
    WHERE deleted_at IS NOT NULL
    AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE sessions
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON FUNCTION create_default_user_settings() IS 'Creates default settings entry when new user registers';
COMMENT ON FUNCTION cleanup_old_deleted_entries() IS 'Permanently deletes vault entries that have been in trash for 30+ days';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Deletes audit logs older than 90 days per retention policy';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Marks expired sessions as inactive';
