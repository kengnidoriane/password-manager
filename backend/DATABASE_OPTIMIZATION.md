# Database Query Optimization Guide

This document describes the database query optimizations implemented in the Password Manager backend.

## Overview

The following optimizations have been implemented to improve database performance:
1. Additional database indexes for common query patterns
2. Pagination for large result sets
3. JOIN FETCH to avoid N+1 query problems
4. Optimized HikariCP connection pooling
5. Query performance logging and monitoring

## Database Indexes

### New Indexes (V14 Migration)

#### VaultEntry Optimizations
- `idx_vault_recently_used`: Optimizes queries for recently used credentials
- `idx_vault_modified_since`: Optimizes sync operations finding modified entries
- `idx_vault_folder_contents`: Optimizes folder content queries with entry type filtering
- `idx_vault_version_check`: Speeds up version conflict detection
- `idx_vault_trash_cleanup`: Optimizes trash cleanup operations

#### AuditLog Optimizations
- `idx_audit_user_action_time`: Composite index for user audit queries with action filtering
- `idx_audit_ip_tracking`: Optimizes IP address tracking queries
- `idx_audit_resource`: Speeds up resource-specific audit queries
- `idx_audit_failed_ops`: Optimizes queries for failed operations (suspicious activity)
- `idx_audit_retention`: Speeds up retention policy cleanup

#### SharedCredential Optimizations
- `idx_shared_recipient`: Optimizes queries for credentials shared with a user
- `idx_shared_owner`: Optimizes queries for credentials shared by a user
- `idx_shared_vault_entry`: Speeds up queries for shares of a specific vault entry
- `idx_shared_last_accessed`: Optimizes recently accessed shares queries
- `idx_shared_check_exists`: Speeds up duplicate share detection

#### Session Optimizations
- `idx_sessions_user_active`: Optimizes active session queries per user
- `idx_sessions_token`: Speeds up session token lookups

#### Other Entity Optimizations
- `idx_users_email_lower`: Case-insensitive email lookup
- `idx_folders_parent`: Parent-child folder relationships
- `idx_folders_root`: Root folder queries
- `idx_tags_user`: User's tags with name filtering
- `idx_notes_user`: User's secure notes
- `idx_notes_folder`: Folder-based note queries

## JOIN FETCH Optimizations

### N+1 Query Problem

The N+1 query problem occurs when:
1. A query fetches N parent entities
2. For each parent, a separate query fetches related child entities
3. This results in 1 + N queries instead of 1 query

### Solution: JOIN FETCH

We use `JOIN FETCH` in JPQL queries to eagerly load related entities in a single query.



#### VaultRepository Optimizations

**Before:**
```java
@Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL")
List<VaultEntry> findActiveByUserId(@Param("userId") UUID userId);
```

**After:**
```java
@Query("SELECT DISTINCT v FROM VaultEntry v " +
       "LEFT JOIN FETCH v.user " +
       "LEFT JOIN FETCH v.folder " +
       "WHERE v.user.id = :userId AND v.deletedAt IS NULL")
List<VaultEntry> findActiveByUserId(@Param("userId") UUID userId);
```

**Impact:** Reduces queries from 1 + N (users) + M (folders) to 1 query.

#### SharedCredentialRepository Optimizations

**Before:**
```java
@Query("SELECT sc FROM SharedCredential sc WHERE sc.recipient.id = :recipientId AND sc.revokedAt IS NULL")
List<SharedCredential> findActiveByRecipient(@Param("recipientId") UUID recipientId);
```

**After:**
```java
@Query("SELECT DISTINCT sc FROM SharedCredential sc " +
       "LEFT JOIN FETCH sc.owner " +
       "LEFT JOIN FETCH sc.recipient " +
       "LEFT JOIN FETCH sc.vaultEntry " +
       "WHERE sc.recipient.id = :recipientId AND sc.revokedAt IS NULL")
List<SharedCredential> findActiveByRecipient(@Param("recipientId") UUID recipientId);
```

**Impact:** Reduces queries from 1 + N (owners) + N (recipients) + N (vault entries) to 1 query.

#### AuditLogRepository Optimizations

All paginated queries now use JOIN FETCH with separate count queries:

```java
@Query(value = "SELECT DISTINCT a FROM AuditLog a " +
       "LEFT JOIN FETCH a.user " +
       "WHERE a.user = :user ORDER BY a.timestamp DESC",
       countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE a.user = :user")
Page<AuditLog> findByUserOrderByTimestampDesc(UserAccount user, Pageable pageable);
```

## Pagination

All repository methods that return lists now have paginated versions to handle large result sets efficiently.

### Example Usage

```java
// Without pagination (loads all results)
List<VaultEntry> allEntries = vaultRepository.findActiveByUserId(userId);

// With pagination (loads page by page)
Pageable pageable = PageRequest.of(0, 20, Sort.by("updatedAt").descending());
Page<VaultEntry> page = vaultRepository.findActiveByUserId(userId, pageable);
```

### Benefits
- Reduces memory consumption
- Improves response times
- Better user experience with incremental loading

## HikariCP Connection Pooling

### Configuration

#### Development Profile
- Maximum pool size: 10
- Minimum idle: 5
- Connection timeout: 30 seconds
- Idle timeout: 10 minutes
- Max lifetime: 30 minutes
- Leak detection: 60 seconds

#### Staging Profile
- Maximum pool size: 20
- Minimum idle: 10
- Other settings same as dev

#### Production Profile
- Maximum pool size: 30
- Minimum idle: 15
- Other settings optimized for production load

### Key Settings

- `pool-name`: Named pools for easier monitoring
- `auto-commit`: true (default, explicit for clarity)
- `connection-init-sql`: SELECT 1 (validates connections)
- `validation-timeout`: 5 seconds
- `register-mbeans`: true (enables JMX monitoring)

## Hibernate Optimizations

### Batch Processing

```yaml
hibernate:
  jdbc:
    batch_size: 20-30 (depending on profile)
    fetch_size: 50-100 (depending on profile)
  order_inserts: true
  order_updates: true
  default_batch_fetch_size: 10-16 (depending on profile)
```

### Benefits
- Reduces round trips to database
- Improves bulk operation performance
- Optimizes memory usage

## Query Performance Monitoring

### QueryPerformanceAspect

Automatically monitors all repository method executions:

- **DEBUG**: All queries with execution time
- **WARN**: Queries > 500ms (slow queries)
- **ERROR**: Queries > 1000ms (very slow queries)

### Metrics

All queries are recorded with Micrometer metrics:
- `repository.query.duration`: Timer for query execution time
- Tagged with: method name, repository name, exception (if failed)

### Hibernate Statistics

Logged every 5 minutes (dev/staging only):
- Query execution count
- Cache hit/miss ratios
- Session statistics
- Transaction statistics
- Optimistic lock failures

### HikariCP Statistics

Logged every 5 minutes (dev/staging only):
- Active connections
- Idle connections
- Total connections
- Threads awaiting connection

## Performance Best Practices

### 1. Use Pagination
Always use pagination for queries that might return large result sets.

### 2. Use JOIN FETCH
Use JOIN FETCH for queries that access related entities to avoid N+1 problems.

### 3. Use Indexes
Ensure queries use appropriate indexes. Check with EXPLAIN ANALYZE in PostgreSQL.

### 4. Batch Operations
Use batch operations for bulk inserts/updates.

### 5. Monitor Slow Queries
Review slow query logs regularly and optimize problematic queries.

### 6. Connection Pool Sizing
Monitor connection pool usage and adjust sizing based on actual load.

### 7. Query Optimization Checklist
- [ ] Does the query use appropriate indexes?
- [ ] Does the query use JOIN FETCH for related entities?
- [ ] Is pagination used for large result sets?
- [ ] Are there any N+1 query problems?
- [ ] Is the query execution time acceptable (<500ms)?

## Monitoring and Troubleshooting

### Check Slow Queries

```bash
# View slow query logs
tail -f /var/log/password-manager/application.log | grep "SLOW QUERY"
```

### Check Hibernate Statistics

```bash
# View Hibernate statistics in logs
tail -f /var/log/password-manager/application.log | grep "Hibernate Statistics"
```

### Check HikariCP Pool

```bash
# View HikariCP statistics in logs
tail -f /var/log/password-manager/application.log | grep "HikariCP Pool Statistics"
```

### Prometheus Metrics

Query performance metrics are available at `/actuator/prometheus`:
- `repository_query_duration_seconds`
- `hikari_connections_active`
- `hikari_connections_idle`
- `hibernate_query_execution_count`

## Testing Query Performance

### 1. Load Testing
Use tools like JMeter or Gatling to simulate high load and measure query performance.

### 2. Database Profiling
Use PostgreSQL's EXPLAIN ANALYZE to profile query execution plans:

```sql
EXPLAIN ANALYZE SELECT v.* FROM vault_entries v 
WHERE v.user_id = 'uuid' AND v.deleted_at IS NULL;
```

### 3. Monitor Metrics
Use Grafana dashboards to visualize query performance metrics over time.

## Future Optimizations

Potential future optimizations to consider:
1. Query result caching with Redis
2. Read replicas for read-heavy operations
3. Database partitioning for large tables
4. Materialized views for complex aggregations
5. Connection pooling with PgBouncer for very high loads
