# Password Manager Backend

Spring Boot backend for the Password Manager application with zero-knowledge encryption architecture.

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database access
- **PostgreSQL** - Primary database
- **Redis** - Session management and caching
- **JWT** - Token-based authentication
- **Flyway** - Database migrations
- **Springdoc OpenAPI** - API documentation (Swagger)
- **HikariCP** - Connection pooling
- **BCrypt** - Password hashing

## Prerequisites

- Java 17 or higher
- Maven 3.6+ or use Docker
- PostgreSQL 14+
- Redis 7+

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

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

# JWT (Generate secure key for production)
JWT_SECRET=your-secret-key-change-this-in-production-min-256-bits
JWT_EXPIRATION_MS=900000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Session
SESSION_TIMEOUT_MINUTES=15
```

### Profiles

The application supports three profiles:

1. **dev** - Development environment with debug logging and Swagger enabled
2. **staging** - Staging environment with reduced logging
3. **prod** - Production environment with minimal logging and Swagger disabled

## Running the Application

### Using Maven

```bash
# Compile
mvn clean compile

# Run tests
mvn test

# Run application
mvn spring-boot:run

# Package
mvn clean package
java -jar target/password-manager-backend-0.0.1-SNAPSHOT.jar
```

### Using Docker

```bash
# Build image
docker build -t password-manager-backend .

# Run container
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/password_manager \
  password-manager-backend
```

### Using Docker Compose

```bash
# Start all services (backend, database, redis)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Documentation

When running in `dev` or `staging` profile, Swagger UI is available at:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## Health Checks

- **Application Health**: http://localhost:8080/api/v1/health
- **Actuator Health**: http://localhost:8080/actuator/health
- **Actuator Metrics**: http://localhost:8080/actuator/metrics
- **Prometheus Metrics**: http://localhost:8080/actuator/prometheus

## Database Migrations

Database migrations are managed by Flyway and run automatically on application startup.

Migration files are located in: `src/main/resources/db/migration/`

Naming convention: `V{version}__{description}.sql`

Example: `V1__create_users_table.sql`

## Security Configuration

### CORS

CORS is configured to allow requests from the frontend application. Configure allowed origins in `application.yml` or via environment variables.

### JWT Authentication

JWT tokens are used for stateless authentication:
- Access token expiration: 15 minutes (configurable)
- Refresh token expiration: 24 hours (configurable)
- Tokens are signed with HS256 algorithm

### Rate Limiting

Rate limiting is configured for:
- Authentication endpoints: 5 requests/minute
- Vault operations: 100 requests/minute
- Export operations: 3 requests/hour

### Password Hashing

- BCrypt with strength 12 is used for hashing authentication keys
- PBKDF2 with 100,000+ iterations is used client-side for key derivation

## Redis Configuration

Redis is used for:
- Session management
- Caching (vault metadata, breach check results, security reports)
- Rate limiting

Connection pooling is configured with Lettuce client.

## Monitoring

### Actuator Endpoints

Available in all profiles:
- `/actuator/health` - Health status
- `/actuator/info` - Application information
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus-compatible metrics

### Logging

Structured logging is configured with different levels per profile:
- **dev**: DEBUG level for application code
- **staging**: INFO level
- **prod**: WARN level with file output

## Code Quality

### Checkstyle

Code style is enforced with Checkstyle:

```bash
mvn checkstyle:check
```

Configuration: `checkstyle.xml`

### SpotBugs

Static analysis with SpotBugs:

```bash
mvn spotbugs:check
```

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
mvn verify
```

### Test Configuration

Tests use H2 in-memory database and mock Redis connections.

Test profile: `application-test.yml`

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/passwordmanager/backend/
│   │   │       ├── config/          # Configuration classes
│   │   │       ├── controller/      # REST controllers
│   │   │       ├── service/         # Business logic
│   │   │       ├── repository/      # Data access
│   │   │       ├── entity/          # JPA entities
│   │   │       ├── dto/             # Data transfer objects
│   │   │       ├── security/        # Security components
│   │   │       └── exception/       # Exception handling
│   │   └── resources/
│   │       ├── application.yml      # Application configuration
│   │       └── db/migration/        # Flyway migrations
│   └── test/
│       ├── java/                    # Test classes
│       └── resources/
│           └── application-test.yml # Test configuration
├── .env.example                     # Environment variables template
├── checkstyle.xml                   # Checkstyle configuration
├── Dockerfile                       # Docker image definition
├── pom.xml                          # Maven dependencies
└── README.md                        # This file
```

## Configuration Classes

### CorsConfig
Configures CORS settings for frontend access with customizable origins, methods, and headers.

### OpenApiConfig
Configures Swagger/OpenAPI documentation with JWT security scheme and server definitions.

### RedisConfig
Configures Redis templates and cache manager with proper JSON serialization.

### SecurityConfig
Configures Spring Security with JWT authentication, CORS, and session management.

## Development Guidelines

### Adding New Endpoints

1. Create controller in `controller/` package
2. Add Swagger annotations (`@Operation`, `@ApiResponse`)
3. Implement service layer in `service/` package
4. Add repository if needed in `repository/` package
5. Write unit tests
6. Update API documentation

### Database Changes

1. Create new Flyway migration in `db/migration/`
2. Follow naming convention: `V{version}__{description}.sql`
3. Test migration locally
4. Ensure backward compatibility

### Adding Dependencies

1. Add dependency to `pom.xml`
2. Document purpose in comments
3. Update this README if it affects configuration

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env`
- Verify database exists: `psql -l`

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping`
- Check Redis host and port in `.env`
- Verify Redis password if configured

### Port Already in Use

Change the port in `.env`:
```bash
SERVER_PORT=8081
```

### Flyway Migration Errors

Reset Flyway baseline:
```bash
mvn flyway:clean
mvn flyway:migrate
```

## Support

For issues and questions, please refer to the main project documentation.
