-- Create backup_codes table for 2FA recovery codes
-- Requirements: 14.3

CREATE TABLE IF NOT EXISTS backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_backup_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for user_id lookups
CREATE INDEX idx_backup_codes_user_id ON backup_codes(user_id);

-- Create index for unused codes
CREATE INDEX idx_backup_codes_unused ON backup_codes(user_id, used) WHERE used = FALSE;

-- Add comments
COMMENT ON TABLE backup_codes IS 'Stores hashed backup codes for 2FA recovery';
COMMENT ON COLUMN backup_codes.code_hash IS 'BCrypt hash of the backup code';
COMMENT ON COLUMN backup_codes.used IS 'Whether this backup code has been used';
