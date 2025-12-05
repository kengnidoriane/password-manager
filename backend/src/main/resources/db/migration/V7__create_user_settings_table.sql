-- Create user_settings table for user preferences and configuration
-- Requirements: 19.1, 19.2, 19.3, 19.4, 19.5

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    session_timeout_minutes INTEGER NOT NULL DEFAULT 15,
    clipboard_timeout_seconds INTEGER NOT NULL DEFAULT 60,
    biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    strict_security_mode BOOLEAN NOT NULL DEFAULT FALSE,
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_session_timeout CHECK (session_timeout_minutes BETWEEN 1 AND 60),
    CONSTRAINT chk_clipboard_timeout CHECK (clipboard_timeout_seconds BETWEEN 30 AND 300),
    CONSTRAINT chk_theme CHECK (theme IN ('light', 'dark', 'auto')),
    CONSTRAINT chk_language CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- Create index for user lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Add comments
COMMENT ON TABLE user_settings IS 'User-specific settings and preferences';
COMMENT ON COLUMN user_settings.session_timeout_minutes IS 'Session inactivity timeout (1-60 minutes)';
COMMENT ON COLUMN user_settings.clipboard_timeout_seconds IS 'Auto-clear clipboard timeout (30-300 seconds)';
COMMENT ON COLUMN user_settings.biometric_enabled IS 'Whether biometric authentication is enabled';
COMMENT ON COLUMN user_settings.strict_security_mode IS 'Requires authentication for every credential view';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference: light, dark, or auto';
COMMENT ON COLUMN user_settings.language IS 'Preferred language code (ISO 639-1)';
