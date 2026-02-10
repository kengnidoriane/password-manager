# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the Password Manager application. The schema is managed using Flyway migrations for version control.

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Tables](#tables)
3. [Indexes](#indexes)
4. [Constraints](#constraints)
5. [Migration Strategy](#migration-strategy)

## Entity Relationship Diagram

```
┌─────────────────┐
│   users         │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ auth_key_hash   │
│ salt            │
│ iterations      │
│ two_factor_...  │
│ created_at      │
│ last_login_at   │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
┌───▼──────────┐  ┌──────────────┐  ┌────────▼──────┐
│ vault_entries│  │ sessions     │  │ audit_logs    │
├──────────────┤  ├──────────────┤  ├───────────────┤
│ id (PK)      │  │ id (PK)      │  │ id (PK)       │
│ user_id (FK) │  │ user_id (FK) │  │ user_id (FK)  │
│ encrypted_...│  │ token        │  │ action        │
│ iv           │  │ expires_at   │  │ resource_id   │
│ auth_tag     │  │ device_info  │  │ timestamp     │
│ version      │  │ ip_address   │  │ device_info   │
│ created_at   │  │ created_at   │  │ ip_address    │
│ updated_at   │  └──────────────┘  │ success       │
│ deleted_at   │                    └───────────────┘
└──────────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼──────────┐  ┌──────────▼────┐
│ folders      │  │ tags          │
├──────────────┤  ├───────────────┤
│ id (PK)      │  │ id (PK)       │
│ user_id (FK) │  │ user_id (FK)  │
│ name         │  │ name          │
│ parent_id    │  │ color         │
│ created_at   │  │ created_at    │
└──────────────┘  └───────────────┘

┌──────────────────┐
│ secure_notes     │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ encrypted_data   │
│ iv               │
│ auth_tag         │
│ folder_id (FK)   │
│ created_at       │
│ updated_at       │
│ deleted_at       │
└──────────────────┘

┌──────────────────────┐
│ shared_credentials   │
├──────────────────────┤
│ id (PK)              │
│ owner_id (FK)        │
│ recipient_id (FK)    │
│ credential_id (FK)   │
│ encrypted_data       │
│ permissions          │
│ created_at           │
│ revoked_at           │
└──────────────────────┘

┌──────────────────┐
│ user_settings    │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ session_timeout  │
│ clipboard_timeout│
│ biometric_enabled│
│ strict_mode      │
│ theme            │
│ language         │
│ updated_at       │
└──────────────────┘

┌──────────────────┐
│ backup_codes     │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ code_hash        │
│ used             │
│ used_at          │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│ sync_history     │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ device_id        │
│ sync_type        │
│ items_synced     │
│ conflicts        │
│ synced_at        │
└──────────────────┘
```

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    auth_key_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    iterations INTEGER NOT NULL DEFAULT 100000,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    recovery_key_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: Unique user identifier (UUID)
- `email`: User email address (unique)
- `auth_key_hash`: BCrypt hash of derived authentication key
- `salt`: Base64-encoded salt for PBKDF2 key derivation
- `iterations`: PBKDF2 iteration count (minimum 100,000)
- `two_factor_enabled`: Whether 2FA is enabled
- `two_factor_secret`: TOTP secret for 2FA
- `recovery_key_hash`: Hash of backup recovery key
- `email_verified`: Email verification status
- `created_at`: Account creation timestamp
- `last_login_at`: Last successful login timestamp
- `updated_at`: Last update timestamp

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

### vault_entries

Stores encrypted credential entries.

```sql
CREATE TABLE vault_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    auth_tag VARCHAR(255) NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_vault_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Columns**:
- `id`: Unique credential identifier (UUID)
- `user_id`: Owner user ID (foreign key)
- `encrypted_data`: Base64-encoded encrypted credential JSON
- `iv`: Initialization vector for AES-256-GCM
- `auth_tag`: Authentication tag for integrity verification
- `version`: Version number for conflict resolution
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp (NULL if not deleted)

**Indexes**:
```sql
CREATE INDEX idx_vault_user_id ON vault_entries(user_id);
CREATE INDEX idx_vault_deleted_at ON vault_entries(deleted_at);
CREATE INDEX idx_vault_updated_at ON vault_entries(updated_at);
CREATE INDEX idx_vault_user_not_deleted ON vault_entries(user_id, deleted_at) 
    WHERE deleted_at IS NULL;
```

---

### sessions

Stores active user sessions.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Columns**:
- `id`: Unique session identifier (UUID)
- `user_id`: User ID (foreign key)
- `token`: JWT token (unique)
- `device_info`: User agent string
- `ip_address`: Client IP address
- `created_at`: Session creation timestamp
- `expires_at`: Session expiration timestamp
- `last_activity_at`: Last activity timestamp

**Indexes**:
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

### audit_logs

Stores audit trail of all operations.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: Unique log entry identifier (UUID)
- `user_id`: User ID (foreign key, nullable)
- `action`: Action performed (e.g., LOGIN, CREDENTIAL_CREATED)
- `resource_type`: Type of resource affected
- `resource_id`: ID of affected resource
- `device_info`: User agent string
- `ip_address`: Client IP address
- `success`: Whether operation succeeded
- `error_message`: Error message if failed
- `timestamp`: Event timestamp

**Indexes**:
```sql
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp DESC);
```

---

### folders

Stores folder organization structure.

```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_folder_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES folders(id)
);
```

**Columns**:
- `id`: Unique folder identifier (UUID)
- `user_id`: Owner user ID (foreign key)
- `name`: Folder name
- `parent_id`: Parent folder ID (NULL for root folders)
- `created_at`: Creation timestamp

**Indexes**:
```sql
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

---

### tags

Stores tags for credential organization.

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tag_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);
```

**Columns**:
- `id`: Unique tag identifier (UUID)
- `user_id`: Owner user ID (foreign key)
- `name`: Tag name (unique per user)
- `color`: Hex color code (e.g., #FF5733)
- `created_at`: Creation timestamp

**Indexes**:
```sql
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);
```

---

### secure_notes

Stores encrypted secure notes.

```sql
CREATE TABLE secure_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    auth_tag VARCHAR(255) NOT NULL,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_note_folder FOREIGN KEY (folder_id) REFERENCES folders(id)
);
```

**Columns**:
- `id`: Unique note identifier (UUID)
- `user_id`: Owner user ID (foreign key)
- `encrypted_data`: Base64-encoded encrypted note content
- `iv`: Initialization vector
- `auth_tag`: Authentication tag
- `folder_id`: Folder ID (nullable)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp

**Indexes**:
```sql
CREATE INDEX idx_notes_user_id ON secure_notes(user_id);
CREATE INDEX idx_notes_folder_id ON secure_notes(folder_id);
CREATE INDEX idx_notes_deleted_at ON secure_notes(deleted_at);
```

---

### shared_credentials

Stores shared credential information.

```sql
CREATE TABLE shared_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES vault_entries(id) ON DELETE CASCADE,
    encrypted_data TEXT NOT NULL,
    permissions VARCHAR(255)[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    CONSTRAINT fk_share_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_share_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT fk_share_credential FOREIGN KEY (credential_id) REFERENCES vault_entries(id)
);
```

**Columns**:
- `id`: Unique share identifier (UUID)
- `owner_id`: Owner user ID (foreign key)
- `recipient_id`: Recipient user ID (foreign key)
- `credential_id`: Shared credential ID (foreign key)
- `encrypted_data`: Credential encrypted with recipient's public key
- `permissions`: Array of permissions (READ, COPY, etc.)
- `created_at`: Share creation timestamp
- `revoked_at`: Revocation timestamp (NULL if active)

**Indexes**:
```sql
CREATE INDEX idx_shared_owner_id ON shared_credentials(owner_id);
CREATE INDEX idx_shared_recipient_id ON shared_credentials(recipient_id);
CREATE INDEX idx_shared_credential_id ON shared_credentials(credential_id);
CREATE INDEX idx_shared_revoked_at ON shared_credentials(revoked_at);
```

---

### user_settings

Stores user preferences and settings.

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_timeout INTEGER NOT NULL DEFAULT 15,
    clipboard_timeout INTEGER NOT NULL DEFAULT 60,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    strict_security_mode BOOLEAN DEFAULT FALSE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT check_session_timeout CHECK (session_timeout BETWEEN 1 AND 60),
    CONSTRAINT check_clipboard_timeout CHECK (clipboard_timeout BETWEEN 30 AND 300)
);
```

**Columns**:
- `id`: Unique settings identifier (UUID)
- `user_id`: User ID (foreign key, unique)
- `session_timeout`: Session timeout in minutes (1-60)
- `clipboard_timeout`: Clipboard auto-clear timeout in seconds (30-300)
- `biometric_enabled`: Whether biometric auth is enabled
- `strict_security_mode`: Whether strict security mode is enabled
- `theme`: UI theme (light, dark, auto)
- `language`: UI language code
- `updated_at`: Last update timestamp

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_settings_user_id ON user_settings(user_id);
```

---

### backup_codes

Stores 2FA backup codes.

```sql
CREATE TABLE backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_backup_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Columns**:
- `id`: Unique code identifier (UUID)
- `user_id`: User ID (foreign key)
- `code_hash`: BCrypt hash of backup code
- `used`: Whether code has been used
- `used_at`: Usage timestamp
- `created_at`: Creation timestamp

**Indexes**:
```sql
CREATE INDEX idx_backup_user_id ON backup_codes(user_id);
CREATE INDEX idx_backup_used ON backup_codes(used);
```

---

### sync_history

Stores synchronization history for debugging.

```sql
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    sync_type VARCHAR(50) NOT NULL,
    items_synced INTEGER NOT NULL DEFAULT 0,
    conflicts INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sync_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Columns**:
- `id`: Unique sync identifier (UUID)
- `user_id`: User ID (foreign key)
- `device_id`: Device identifier
- `sync_type`: Type of sync (FULL, DELTA, CONFLICT_RESOLUTION)
- `items_synced`: Number of items synchronized
- `conflicts`: Number of conflicts resolved
- `synced_at`: Sync timestamp

**Indexes**:
```sql
CREATE INDEX idx_sync_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_synced_at ON sync_history(synced_at DESC);
```

---

## Indexes

### Performance Indexes

```sql
-- Composite index for active vault entries
CREATE INDEX idx_vault_user_active ON vault_entries(user_id, updated_at DESC) 
    WHERE deleted_at IS NULL;

-- Composite index for audit log queries
CREATE INDEX idx_audit_user_action_time ON audit_logs(user_id, action, timestamp DESC);

-- Composite index for session cleanup
CREATE INDEX idx_sessions_expires ON sessions(expires_at) 
    WHERE expires_at < CURRENT_TIMESTAMP;

-- Full-text search index (if using PostgreSQL full-text search)
CREATE INDEX idx_vault_search ON vault_entries USING gin(to_tsvector('english', encrypted_data));
```

### Unique Constraints

```sql
-- Ensure email uniqueness
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Ensure tag name uniqueness per user
ALTER TABLE tags ADD CONSTRAINT unique_user_tag UNIQUE (user_id, name);

-- Ensure session token uniqueness
ALTER TABLE sessions ADD CONSTRAINT unique_token UNIQUE (token);
```

## Constraints

### Foreign Key Constraints

All foreign key constraints use `ON DELETE CASCADE` or `ON DELETE SET NULL` to maintain referential integrity:

- `vault_entries.user_id` → `users.id` (CASCADE)
- `sessions.user_id` → `users.id` (CASCADE)
- `audit_logs.user_id` → `users.id` (SET NULL)
- `folders.user_id` → `users.id` (CASCADE)
- `folders.parent_id` → `folders.id` (CASCADE)
- `tags.user_id` → `users.id` (CASCADE)
- `secure_notes.user_id` → `users.id` (CASCADE)
- `secure_notes.folder_id` → `folders.id` (SET NULL)
- `shared_credentials.owner_id` → `users.id` (CASCADE)
- `shared_credentials.recipient_id` → `users.id` (CASCADE)
- `shared_credentials.credential_id` → `vault_entries.id` (CASCADE)
- `user_settings.user_id` → `users.id` (CASCADE)
- `backup_codes.user_id` → `users.id` (CASCADE)
- `sync_history.user_id` → `users.id` (CASCADE)

### Check Constraints

```sql
-- Session timeout bounds (1-60 minutes)
ALTER TABLE user_settings ADD CONSTRAINT check_session_timeout 
    CHECK (session_timeout BETWEEN 1 AND 60);

-- Clipboard timeout bounds (30-300 seconds)
ALTER TABLE user_settings ADD CONSTRAINT check_clipboard_timeout 
    CHECK (clipboard_timeout BETWEEN 30 AND 300);

-- PBKDF2 iterations minimum
ALTER TABLE users ADD CONSTRAINT check_iterations 
    CHECK (iterations >= 100000);

-- Version must be positive
ALTER TABLE vault_entries ADD CONSTRAINT check_version 
    CHECK (version > 0);
```

## Migration Strategy

### Flyway Migrations

Migrations are located in `backend/src/main/resources/db/migration/` and follow the naming convention:

```
V{version}__{description}.sql
```

Example:
```
V1__create_users_table.sql
V2__create_backup_codes_table.sql
V3__create_vault_entries_table.sql
...
```

### Migration Best Practices

1. **Never modify existing migrations**: Create new migrations for changes
2. **Test migrations**: Test on staging before production
3. **Backward compatibility**: Ensure migrations don't break existing code
4. **Rollback plan**: Have a rollback strategy for each migration
5. **Data migrations**: Separate schema and data migrations
6. **Performance**: Consider impact on large tables

### Example Migration

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    auth_key_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    iterations INTEGER NOT NULL DEFAULT 100000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON COLUMN users.auth_key_hash IS 'BCrypt hash of derived authentication key';
```

### Rollback Strategy

For critical migrations, create corresponding rollback scripts:

```sql
-- R__rollback_v15.sql (manual execution only)
-- Rollback for V15__add_two_factor_columns.sql

ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret;
DROP TABLE IF EXISTS backup_codes;
```

## Database Maintenance

### Regular Maintenance Tasks

1. **Vacuum**: Run `VACUUM ANALYZE` weekly
2. **Reindex**: Rebuild indexes monthly
3. **Cleanup**: Delete old audit logs (>90 days)
4. **Backup**: Daily automated backups
5. **Monitoring**: Track query performance

### Cleanup Queries

```sql
-- Delete expired sessions
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;

-- Delete old audit logs (>90 days)
DELETE FROM audit_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Permanently delete soft-deleted credentials (>30 days)
DELETE FROM vault_entries 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### Performance Monitoring

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_tup_read DESC;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Considerations

1. **Encryption at Rest**: Enable PostgreSQL encryption at rest
2. **Encrypted Connections**: Use SSL/TLS for all database connections
3. **Least Privilege**: Application user has minimal required permissions
4. **Audit Logging**: Enable PostgreSQL audit logging
5. **Backup Encryption**: Encrypt database backups
6. **Network Security**: Restrict database access to application servers only

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
