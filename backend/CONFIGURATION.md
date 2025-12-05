# Backend Configuration Summary

This document provides a comprehensive overview of the Spring Boot backend configuration for the Password Manager application.

## Configuration Files

### 1. application.yml

Main configuration file with three profiles:

#### Development Profile (`dev`)
- **Database**: PostgreSQL with HikariCP connection pooling
  - Maximum pool size: 10
  - Minimum idle: 5
  - Connection timeout: 30 seconds
  - Leak detection enabled
- **JPA**: Hibernate with validation mode, SQL logging enabled
- **Flyway**: Enabled with baseline-on-migrate
- **Redis**: Local instance with Lettuce connection pooling
- **Session**: Redis-backed session storage
- **Caching**: Redis-based caching with 5-minute TTL
- **Server**: Port 8080, compression enabled, HTTP/2 enabled
- **Logging**: DEBUG level for application code
- **Swagger**: Enabled at `/swagger-ui.html`
- **Actuator**: All endpoints exposed including Prometheus metrics

#### Staging Profile (`staging`)
- **Database**: Larger connection pool (20 max, 10 min idle)
- **Logging**: INFO level
- **Error Details**: Limited (on_param only)
- **Swagger**: Enabled for testing
- **Actuator**: Health, info, metrics, prometheus exposed

#### Production Profile (`prod`)
- **Database**: Largest connection pool (30 max, 15 min idle)
- **Redis**: SSL enabled
- **Logging**: WARN level, file-based logging
- **Error Details**: Disabled for security
- **Swagger**: Completely disabled
- **Actuator**: Minimal exposure (health, metrics, prometheus)
- **Graceful Shutdown**: Enabled

### 2. application-test.yml

Test configuration using H2 in-memory database:
- **Database**: H2 with create-drop mode
- **Flyway**: Disabled (using Hibernate DDL)
- **Caching**: Disabled
- **Rate Limiting**: Disabled
- **Swagger**: Disabled

## Configuration Classes

### 1. CorsConfig.java

Configures Cross-Origin Resource Sharing (CORS) for frontend access.

**Features:**
- Configurable allowed origins (comma-separated)
- Configurable allowed methods
- Configurable allowed and exposed headers
- Credentials support
- Preflight cache control (max-age)

**Properties:**
```yaml
cors:
  allowed-origins: http://localhost:3000,http://localhost:3001
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
  allowed-headers: "*"
  exposed-headers: Authorization,X-Total-Count,X-Page-Number,X-Page-Size
  allow-credentials: true
  max-age: 3600
```

### 2. OpenApiConfig.java

Configures Springdoc OpenAPI (Swagger) documentation.

**Features:**
- API metadata (title, description, version)
- Contact information
- License information
- Multiple server configurations (dev, staging, prod)
- JWT Bearer authentication scheme
- Security requirements for all endpoints

**Endpoints:**
- Swagger UI: `/swagger-ui.html`
- OpenAPI Spec: `/v3/api-docs`

### 3. RedisConfig.java

Configures Redis for session management and caching.

**Features:**
- RedisTemplate with JSON serialization
- RedisCacheManager with 5-minute default TTL
- String serialization for keys
- Jackson JSON serialization for values
- Java 8 time module support
- Polymorphic type handling

**Caching Strategy:**
- Session data: 15 minutes TTL
- Vault metadata: 5 minutes TTL
- Breach check results: 24 hours TTL
- Security reports: 1 hour TTL

### 4. SecurityConfig.java

Configures Spring Security with JWT authentication.

**Features:**
- CSRF disabled (stateless API)
- CORS enabled with custom configuration
- Stateless session management
- BCrypt password encoder (strength 12)
- Public endpoints (auth, health, swagger)
- Protected endpoints (require authentication)

**Public Endpoints:**
- `/api/v1/auth/register`
- `/api/v1/auth/login`
- `/api/v1/auth/recovery`
- `/actuator/health/**`
- `/actuator/info`
- `/v3/api-docs/**`
- `/swagger-ui/**`

### 5. JwtProperties.java

Binds JWT configuration from application.yml.

**Properties:**
```yaml
jwt:
  secret: your-secret-key-change-this-in-production-min-256-bits
  expiration-ms: 900000        # 15 minutes
  refresh-expiration-ms: 86400000  # 24 hours
```

### 6. SessionProperties.java

Binds session configuration from application.yml.

**Properties:**
```yaml
session:
  timeout-minutes: 15
  max-concurrent-sessions: 3
```

### 7. SecurityProperties.java

Binds security configuration from application.yml.

**Properties:**
```yaml
security:
  rate-limit:
    enabled: true
    auth-requests-per-minute: 5
    vault-requests-per-minute: 100
    export-requests-per-hour: 3
  failed-auth:
    max-attempts: 3
    lockout-duration-seconds: 30
    backoff-multiplier: 2
```

## Dependencies

### Core Dependencies
- **spring-boot-starter-web**: REST API support
- **spring-boot-starter-data-jpa**: Database access
- **spring-boot-starter-security**: Authentication and authorization
- **spring-boot-starter-data-redis**: Redis integration
- **spring-boot-starter-validation**: Bean validation
- **spring-boot-starter-actuator**: Health checks and metrics

### Database
- **postgresql**: PostgreSQL JDBC driver
- **flyway-core**: Database migrations
- **h2**: In-memory database for testing

### Security
- **jjwt-api**: JWT token generation and validation
- **jjwt-impl**: JWT implementation
- **jjwt-jackson**: JWT JSON processing

### Documentation
- **springdoc-openapi-starter-webmvc-ui**: OpenAPI/Swagger documentation

### Utilities
- **lombok**: Reduce boilerplate code

### Code Quality
- **maven-checkstyle-plugin**: Code style enforcement
- **spotbugs-maven-plugin**: Static code analysis

## Database Configuration

### HikariCP Connection Pool

**Development:**
- Maximum pool size: 10
- Minimum idle: 5
- Connection timeout: 30 seconds
- Idle timeout: 10 minutes
- Max lifetime: 30 minutes
- Leak detection: 60 seconds

**Staging:**
- Maximum pool size: 20
- Minimum idle: 10

**Production:**
- Maximum pool size: 30
- Minimum idle: 15

### JPA/Hibernate

**Settings:**
- DDL auto: validate (Flyway handles schema)
- Batch size: 20
- Order inserts/updates: true
- Open-in-view: false (prevents lazy loading issues)

**Dialect:**
- PostgreSQL dialect for development/staging/production
- H2 dialect for testing

### Flyway Migrations

**Configuration:**
- Enabled in dev/staging/prod
- Disabled in tests
- Baseline on migrate: true
- Validate on migrate: true
- Location: `classpath:db/migration`

## Redis Configuration

### Connection

**Development:**
- Host: localhost
- Port: 6379
- No password
- No SSL

**Production:**
- Host: from environment
- Port: from environment
- Password: from environment
- SSL: enabled

### Connection Pool (Lettuce)

- Max active: 8
- Max idle: 8
- Min idle: 2
- Max wait: unlimited

### Session Storage

- Store type: Redis
- Namespace: `password-manager:session`

## Actuator Configuration

### Endpoints

**Development:**
- health, info, metrics, prometheus
- Show details: always

**Staging:**
- health, info, metrics, prometheus
- Show details: when-authorized

**Production:**
- health, metrics, prometheus
- Show details: never
- Probes enabled (liveness, readiness)

### Metrics

- Prometheus export enabled
- Tags: application name, environment

### Health Checks

- Database health check
- Redis health check
- Custom health indicators (future)

## Logging Configuration

### Levels

**Development:**
- Root: INFO
- Application: DEBUG
- Spring Security: DEBUG
- Spring Web: DEBUG
- Hibernate SQL: DEBUG

**Staging:**
- Root: WARN
- Application: INFO
- Spring Security: INFO

**Production:**
- Root: WARN
- Application: INFO
- Spring Security: WARN
- File output: `/var/log/password-manager/application.log`
- Max file size: 10MB
- Max history: 30 days

### Pattern

**Console:**
```
%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

## Security Configuration

### Password Encoding

- Algorithm: BCrypt
- Strength: 12 rounds
- Used for: Authentication key hashing

### JWT Configuration

- Algorithm: HS256
- Access token: 15 minutes
- Refresh token: 24 hours
- Minimum secret length: 256 bits

### Session Management

- Type: Stateless (JWT-based)
- Redis backing for session data
- Timeout: 15 minutes (configurable)
- Max concurrent sessions: 3 per user

### Rate Limiting

- Authentication: 5 requests/minute
- Vault operations: 100 requests/minute
- Export operations: 3 requests/hour

### Failed Authentication

- Max attempts: 3
- Lockout duration: 30 seconds
- Backoff multiplier: 2 (exponential)

## Environment Variables

All configuration can be overridden via environment variables:

```bash
# Application
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_manager
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
SPRING_REDIS_PASSWORD=
SPRING_REDIS_SSL_ENABLED=false

# JWT
JWT_SECRET=your-secret-key-change-this-in-production-min-256-bits
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=86400000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Session
SESSION_TIMEOUT_MINUTES=15
SESSION_MAX_CONCURRENT=3

# Rate Limiting
RATE_LIMIT_AUTH_RPM=5
RATE_LIMIT_VAULT_RPM=100
RATE_LIMIT_EXPORT_RPH=3

# Actuator
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics,prometheus

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_PASSWORDMANAGER=DEBUG
```

## Next Steps

This configuration provides the foundation for:

1. **Authentication System** (Task 8-14)
   - JWT token generation and validation
   - User registration and login
   - Session management
   - 2FA support

2. **Vault Management** (Task 15-26)
   - Encrypted credential storage
   - CRUD operations
   - Folder and tag organization
   - Search functionality

3. **Security Features** (Task 31-36)
   - Security analysis
   - Breach checking
   - Audit logging
   - Rate limiting

4. **Sync and Offline** (Task 27-30)
   - Bidirectional sync
   - Conflict resolution
   - Offline queue

All configuration is production-ready and follows Spring Boot best practices.
