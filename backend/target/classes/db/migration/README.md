# Database Migrations

This directory contains Flyway database migration scripts for the Password Manager application.

## Migration Files

Migrations are executed in version order. Each migration file follows the naming convention:
`V{version}__{description}.sql`

### Current Migrations

1. **V1__create_users_table.sql**
   - Creates the `users` table for authentication and account management
   - Stores email, auth key hash, salt, 2FA settings, and recovery key
   - Requirements: 1.1, 2.1

2. **V2__create_backup_codes_table.sql**
   - Creates the `backup_codes` table for 2FA recovery codes
   - Stores hashed backup codes with usage tracking
   - Requirements: 14.3

3. **V3__create_vault_entries_table.sql**
   - Creates the `vault_entries` table for encrypted credential storage
   - Supports credentials, secure notes, folders, and tags
   - Includes soft delete functionality (30-day trash retention)
   - Requirements: 3.1, 3.2, 3.4

4. **V4__create_audit_logs_table.sql**
   - Creates the `audit_logs` table for security and activity tracking
   - Logs all user actions with IP, device, and timestamp
   - 90-day retention policy
   - Requirements: 18.1, 18.5

5. **V5__create_shared_credentials_table.sql**
   - Creates the `shared_credentials` table for secure credential sharing
   - Supports encrypted sharing with recipient public keys
   - Includes permission management and revocation
   - Requirements: 9.1, 9.2, 9.3, 9.4

6. **V6__create_sessions_table.sql**
   - Creates the `sessions` table for database-backed session storage
   - Serves as fallback when Redis is unavailable
   - Requirements: 2.2, 2.5

7. **V7__create_user_settings_table.sql**
   - Creates the `user_settings` table for user preferences
   - Stores session timeout, clipboard timeout, theme, language, etc.
   - Requirements: 19.1, 19.2, 19.3, 19.4, 19.5

8. **V8__create_additional_indexes.sql**
   - Creates performance indexes for common query patterns
   - Optimizes vault sync, folder hierarchy, audit logs, and sessions

9. **V9__create_functions_and_triggers.sql**
   - Creates database functions and triggers
   - Automatic `updated_at` timestamp updates
   - Default user settings creation on registration
   - Cleanup functions for old data (trash, audit logs, expired sessions)

## Database Schema Overview

### Core Tables

- **users**: User accounts with authentication credentials
- **backup_codes**: 2FA recovery codes
- **user_settings**: User preferences and configuration
- **sessions**: Session management (fallback for Redis)

### Vault Tables

- **vault_entries**: Encrypted credentials, notes, folders, and tags
- **shared_credentials**: Shared credential management

### Audit Tables

- **audit_logs**: Comprehensive activity and security logging

## Key Features

### Zero-Knowledge Architecture
- All sensitive data is encrypted client-side before storage
- Server never has access to unencrypted passwords or master password
- Only encrypted blobs are stored in `vault_entries.encrypted_data`

### Soft Delete
- Vault entries use soft delete with `deleted_at` timestamp
- Items remain in trash for 30 days before permanent deletion
- Cleanup function: `cleanup_old_deleted_entries()`

### Audit Logging
- All user actions are logged with full context
- 90-day retention policy enforced by `cleanup_old_audit_logs()`
- Supports security analysis and compliance requirements

### Performance Optimization
- Strategic indexes for common query patterns
- Partial indexes for filtered queries (e.g., non-deleted entries)
- Composite indexes for multi-column queries

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate data ranges and formats
- Unique constraints prevent duplicate data

## Running Migrations

Migrations run automatically on application startup when Flyway is enabled.

### Configuration (application.yml)

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    validate-on-migrate: true
```

### Manual Migration Commands

```bash
# Run migrations
mvn flyway:migrate

# Validate migrations
mvn flyway:validate

# Show migration info
mvn flyway:info

# Repair migration history (if needed)
mvn flyway:repair
```

## Testing Migrations

### Local Testing with Docker

```bash
# Start PostgreSQL container
docker-compose up -d db

# Run application (migrations execute automatically)
mvn spring-boot:run

# Or run migrations only
mvn flyway:migrate
```

### Test Database

The test profile uses H2 in-memory database for unit tests:

```yaml
spring:
  config:
    activate:
      on-profile: test
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false  # Use JPA schema generation for tests
```

## Maintenance Functions

### Cleanup Functions

These functions should be scheduled to run periodically:

```sql
-- Cleanup soft-deleted entries older than 30 days
SELECT cleanup_old_deleted_entries();

-- Cleanup audit logs older than 90 days
SELECT cleanup_old_audit_logs();

-- Cleanup expired sessions
SELECT cleanup_expired_sessions();
```

### Recommended Schedule

- **cleanup_expired_sessions()**: Every 15 minutes
- **cleanup_old_deleted_entries()**: Daily at 2 AM
- **cleanup_old_audit_logs()**: Daily at 3 AM

## Migration Best Practices

1. **Never modify existing migrations** - Create new migrations instead
2. **Test migrations in development** before applying to production
3. **Backup database** before running migrations in production
4. **Use transactions** - Flyway wraps each migration in a transaction
5. **Keep migrations small** - One logical change per migration
6. **Add comments** - Document purpose and requirements
7. **Backward compatible** - Ensure migrations don't break existing code

## Rollback Strategy

Flyway doesn't support automatic rollback. For rollback:

1. Create a new migration that reverses the changes
2. Or restore from database backup
3. Or manually execute rollback SQL

Example rollback migration:
```sql
-- V10__rollback_feature_x.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE existing_table DROP COLUMN new_column;
```

## Troubleshooting

### Migration Checksum Mismatch

If you see "Migration checksum mismatch" error:

```bash
# Repair migration history
mvn flyway:repair
```

### Migration Failed

If a migration fails:

1. Check application logs for error details
2. Fix the SQL in the migration file
3. Repair Flyway history: `mvn flyway:repair`
4. Re-run migrations: `mvn flyway:migrate`

### Database Connection Issues

Verify database configuration in `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/password_manager
    username: postgres
    password: postgres
```

## Security Considerations

1. **Never store sensitive data unencrypted** in the database
2. **Use parameterized queries** to prevent SQL injection
3. **Limit database user permissions** to minimum required
4. **Enable SSL/TLS** for database connections in production
5. **Encrypt database backups** at rest and in transit
6. **Audit database access** and monitor for suspicious activity

## References

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Spring Boot Flyway Integration](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway)
