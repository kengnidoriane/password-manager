# Docker Images Documentation

This document provides comprehensive information about building, optimizing, and deploying Docker images for the Password Manager application.

## Table of Contents

- [Overview](#overview)
- [Image Architecture](#image-architecture)
- [Building Images](#building-images)
- [Image Optimization](#image-optimization)
- [Health Checks](#health-checks)
- [Security Considerations](#security-considerations)
- [Testing Images](#testing-images)
- [Pushing to Registry](#pushing-to-registry)
- [Troubleshooting](#troubleshooting)

## Overview

The Password Manager uses multi-stage Docker builds to create optimized, production-ready container images for both backend and frontend components.

### Key Features

- **Multi-stage builds** for minimal image sizes
- **Layer caching** for faster builds
- **Non-root users** for enhanced security
- **Health checks** for container orchestration
- **JVM optimization** for containerized environments
- **Alpine Linux** base images for minimal footprint

## Image Architecture

### Backend Image

```
Stage 1: Dependencies (maven:3.9-eclipse-temurin-17-alpine)
  └─> Cache Maven dependencies separately

Stage 2: Build (maven:3.9-eclipse-temurin-17-alpine)
  └─> Compile and package Spring Boot application

Stage 3: Runtime (eclipse-temurin:17-jre-alpine)
  └─> Minimal JRE with application JAR
```

**Final Image Size:** ~200-250 MB

### Frontend Image

```
Stage 1: Dependencies (node:20-alpine)
  └─> Install npm dependencies

Stage 2: Build (node:20-alpine)
  └─> Build Next.js application

Stage 3: Runtime (node:20-alpine)
  └─> Minimal Node.js with standalone output
```

**Final Image Size:** ~150-200 MB

## Building Images

### Quick Start

Build all images with default settings:

```bash
# Linux/Mac
./scripts/build-images.sh

# Windows
scripts\build-images.bat
```

### Build Options

#### Using Build Script

```bash
# Build with version tag
./scripts/build-images.sh --version v1.0.0

# Build only backend
./scripts/build-images.sh --backend-only

# Build only frontend
./scripts/build-images.sh --frontend-only

# Build and push to registry
./scripts/build-images.sh --version v1.0.0 --push

# Build with custom registry
./scripts/build-images.sh --registry docker.io --repository myuser/password-manager
```

#### Using Docker Directly

**Backend:**
```bash
cd backend
docker build -t password-manager-backend:latest .
```

**Frontend:**
```bash
cd frontend
docker build -t password-manager-frontend:latest .
```

### Environment Variables

Configure builds using environment variables:

```bash
export VERSION=v1.0.0
export REGISTRY=ghcr.io
export REPOSITORY=myorg/password-manager
export BUILD_BACKEND=true
export BUILD_FRONTEND=true
export PUSH_IMAGES=false

./scripts/build-images.sh
```

## Image Optimization

### Backend Optimizations

1. **Dependency Caching**
   - Separate stage for downloading Maven dependencies
   - Dependencies cached unless `pom.xml` changes

2. **Alpine Linux Base**
   - Minimal OS footprint (~5 MB vs ~100+ MB for full Linux)
   - Reduced attack surface

3. **JRE Instead of JDK**
   - Runtime-only Java environment
   - ~50% smaller than full JDK

4. **JVM Container Optimization**
   ```
   -XX:+UseContainerSupport
   -XX:MaxRAMPercentage=75.0
   -XX:InitialRAMPercentage=50.0
   -XX:+UseG1GC
   ```

5. **Skip Tests in Build**
   - Tests run in CI pipeline
   - Faster Docker builds

### Frontend Optimizations

1. **Production Dependencies Only**
   - Separate production and dev dependencies
   - Only production deps in final image

2. **Next.js Standalone Output**
   - Minimal output with only required files
   - Automatic tree-shaking

3. **Multi-stage Build**
   - Build artifacts separated from source
   - No dev dependencies in final image

4. **Static Asset Optimization**
   - Pre-compressed assets
   - Optimized images and fonts

### .dockerignore Files

Both backend and frontend include comprehensive `.dockerignore` files to exclude unnecessary files from build context:

- Test files
- Documentation
- IDE configurations
- Git files
- Build artifacts
- Node modules (rebuilt in container)

## Health Checks

### Backend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1
```

**Endpoints:**
- `/actuator/health` - Spring Boot Actuator health endpoint
- Checks database and Redis connectivity
- Returns 200 OK when healthy

### Frontend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1
```

**Behavior:**
- Checks if Next.js server is responding
- Returns 200 OK when healthy

### Health Check Parameters

- **interval:** Time between health checks (30s)
- **timeout:** Maximum time for check to complete (10s)
- **start-period:** Grace period before first check (40s)
- **retries:** Number of consecutive failures before unhealthy (3)

## Security Considerations

### Non-Root Users

Both images run as non-root users:

**Backend:**
```dockerfile
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser
USER appuser
```

**Frontend:**
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs
USER nextjs
```

### Security Best Practices

1. **Minimal Base Images**
   - Alpine Linux reduces attack surface
   - Fewer packages = fewer vulnerabilities

2. **No Secrets in Images**
   - Environment variables provided at runtime
   - No hardcoded credentials

3. **Read-Only Filesystem**
   - Application doesn't write to filesystem
   - Logs sent to stdout/stderr

4. **Regular Updates**
   - Base images updated regularly
   - Dependency scanning in CI

5. **Image Scanning**
   - Scan images for vulnerabilities
   - Use tools like Trivy or Snyk

## Testing Images

### Local Testing

**Test Backend:**
```bash
# Run backend container
docker run -d \
  --name test-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/password_manager \
  password-manager-backend:latest

# Check health
curl http://localhost:8080/actuator/health

# View logs
docker logs test-backend

# Stop and remove
docker stop test-backend && docker rm test-backend
```

**Test Frontend:**
```bash
# Run frontend container
docker run -d \
  --name test-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 \
  password-manager-frontend:latest

# Check health
curl http://localhost:3000

# View logs
docker logs test-frontend

# Stop and remove
docker stop test-frontend && docker rm test-frontend
```

### Integration Testing

Use Docker Compose for full stack testing:

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Image Size Verification

```bash
# List images with sizes
docker images | grep password-manager

# Inspect image layers
docker history password-manager-backend:latest
docker history password-manager-frontend:latest

# Analyze image contents
docker run --rm -it password-manager-backend:latest sh
```

## Pushing to Registry

### GitHub Container Registry (GHCR)

1. **Authenticate:**
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

2. **Tag Images:**
```bash
docker tag password-manager-backend:latest ghcr.io/USERNAME/password-manager-backend:v1.0.0
docker tag password-manager-frontend:latest ghcr.io/USERNAME/password-manager-frontend:v1.0.0
```

3. **Push Images:**
```bash
docker push ghcr.io/USERNAME/password-manager-backend:v1.0.0
docker push ghcr.io/USERNAME/password-manager-frontend:v1.0.0
```

### Docker Hub

1. **Authenticate:**
```bash
docker login
```

2. **Tag Images:**
```bash
docker tag password-manager-backend:latest USERNAME/password-manager-backend:v1.0.0
docker tag password-manager-frontend:latest USERNAME/password-manager-frontend:v1.0.0
```

3. **Push Images:**
```bash
docker push USERNAME/password-manager-backend:v1.0.0
docker push USERNAME/password-manager-frontend:v1.0.0
```

### Automated Pushing

Use the build script with `--push` flag:

```bash
# Set registry credentials
export REGISTRY=ghcr.io
export REPOSITORY=myorg/password-manager

# Build and push
./scripts/build-images.sh --version v1.0.0 --push
```

## Troubleshooting

### Build Failures

**Problem:** Maven build fails
```
Solution: Check pom.xml for errors, ensure dependencies are available
```

**Problem:** npm install fails
```
Solution: Clear npm cache, check package.json, verify Node version
```

**Problem:** Out of disk space
```
Solution: Clean up old images and containers
docker system prune -a
```

### Runtime Issues

**Problem:** Container exits immediately
```
Solution: Check logs for errors
docker logs <container-name>
```

**Problem:** Health check failing
```
Solution: Verify application is starting correctly
- Check environment variables
- Verify database/Redis connectivity
- Increase start-period in health check
```

**Problem:** Permission denied errors
```
Solution: Verify file ownership and permissions
- Check USER directive in Dockerfile
- Ensure files are owned by correct user
```

### Performance Issues

**Problem:** Slow startup
```
Solution: 
- Increase JVM heap size
- Optimize application configuration
- Use faster storage for volumes
```

**Problem:** High memory usage
```
Solution:
- Adjust JVM MaxRAMPercentage
- Set container memory limits
- Profile application for memory leaks
```

### Network Issues

**Problem:** Cannot connect to database
```
Solution:
- Verify network configuration
- Check database host and port
- Ensure database is running
- Use host.docker.internal for local development
```

**Problem:** CORS errors
```
Solution:
- Configure CORS_ALLOWED_ORIGINS
- Verify frontend URL in backend config
```

## Best Practices

1. **Version Tagging**
   - Always tag images with version numbers
   - Use semantic versioning (v1.0.0)
   - Keep `latest` tag for most recent stable version

2. **Build Caching**
   - Order Dockerfile commands from least to most frequently changing
   - Copy dependency files before source code
   - Use `--build-arg BUILDKIT_INLINE_CACHE=1`

3. **Image Scanning**
   - Scan images before pushing to registry
   - Set up automated scanning in CI/CD
   - Address critical vulnerabilities promptly

4. **Resource Limits**
   - Set memory and CPU limits in production
   - Monitor resource usage
   - Adjust limits based on actual usage

5. **Logging**
   - Log to stdout/stderr (not files)
   - Use structured logging (JSON)
   - Aggregate logs with centralized logging system

## Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Spring Boot Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
