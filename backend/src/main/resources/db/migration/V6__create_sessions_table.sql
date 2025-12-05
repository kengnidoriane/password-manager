-- Create sessions table for database-backed session storage (optional, Redis is primary)
-- This table serves as a backup/fallback when Redis is unavailable
-- Requirements: 2.2, 2.5

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token VARCHAR(512) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_expires_after_created CHECK (expires_at > created_at)
);

-- Create index for user session lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id, is_active) WHERE is_active = TRUE;

-- Create index for token lookups (authentication)
CREATE INDEX idx_sessions_token ON sessions(session_token) WHERE is_active = TRUE;

-- Create index for expired session cleanup
CREATE INDEX idx_sessions_expired ON sessions(expires_at) WHERE is_active = TRUE;

-- Create index for last activity tracking
CREATE INDEX idx_sessions_last_activity ON sessions(user_id, last_activity_at DESC);

-- Add comments
COMMENT ON TABLE sessions IS 'Database-backed session storage (fallback for Redis)';
COMMENT ON COLUMN sessions.session_token IS 'JWT token or session identifier';
COMMENT ON COLUMN sessions.device_info IS 'Parsed device information (OS, browser, device type)';
COMMENT ON COLUMN sessions.ip_address IS 'IP address of the client';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp (default 15 minutes from last activity)';
COMMENT ON COLUMN sessions.last_activity_at IS 'Last activity timestamp for session timeout tracking';
COMMENT ON COLUMN sessions.is_active IS 'Whether session is currently active (false after logout)';
