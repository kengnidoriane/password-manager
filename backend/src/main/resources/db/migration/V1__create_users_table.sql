-- Create users table for authentication and account management
-- Requirements: 1.1, 2.1

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    auth_key_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    iterations INTEGER NOT NULL DEFAULT 100000,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    recovery_key_hash VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT chk_iterations CHECK (iterations >= 100000),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for email lookups (used frequently for authentication)
CREATE INDEX idx_users_email ON users(email);

-- Create index for created_at for analytics and reporting
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create index for last_login_at for session management
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- Add comment to table
COMMENT ON TABLE users IS 'Stores user account information with encrypted authentication keys';
COMMENT ON COLUMN users.auth_key_hash IS 'BCrypt hash of the derived authentication key (never stores master password)';
COMMENT ON COLUMN users.salt IS 'Salt used for PBKDF2 key derivation on client side';
COMMENT ON COLUMN users.iterations IS 'Number of PBKDF2 iterations (minimum 100,000)';
COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret for two-factor authentication';
COMMENT ON COLUMN users.recovery_key_hash IS 'Hash of the backup recovery key for account recovery';
