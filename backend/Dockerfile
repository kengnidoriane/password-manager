# ============================================
# Multi-stage Dockerfile for Backend
# Optimized for production with minimal image size
# ============================================

# Stage 1: Dependencies cache layer
FROM maven:3.9-eclipse-temurin-17-alpine AS dependencies
WORKDIR /app
# Copy only pom.xml to cache dependencies separately
COPY pom.xml .
# Download dependencies (this layer will be cached unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Stage 2: Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
# Copy cached dependencies from previous stage
COPY --from=dependencies /root/.m2 /root/.m2
# Copy source code
COPY pom.xml .
COPY src ./src
COPY checkstyle.xml .
COPY owasp-suppressions.xml .
# Build the application (skip tests for faster builds, tests run in CI)
RUN mvn clean package -DskipTests -DskipCheckstyle -Dspotbugs.skip=true -Ddependency-check.skip=true -B && \
    # Extract the built JAR name for verification
    ls -lh /app/target/*.jar

# Stage 3: Runtime stage (minimal JRE image)
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy the built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimization flags for containerized environments
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:InitialRAMPercentage=50.0 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -XX:+OptimizeStringConcat \
    -Djava.security.egd=file:/dev/./urandom"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Labels for metadata
LABEL maintainer="Password Manager Team"
LABEL description="Password Manager Backend - Spring Boot Application"
LABEL version="1.0.0"
