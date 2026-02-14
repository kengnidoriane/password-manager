# ============================================
# Dockerfile Simplifié pour Production
# ============================================

FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven curl

# Copy project files
COPY pom.xml .
COPY checkstyle.xml .
COPY owasp-suppressions.xml .

# Copy ONLY source code (not tests)
COPY src/main ./src/main

# Build application (skip tests completely)
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -DskipCheckstyle -Dspotbugs.skip=true -Ddependency-check.skip=true -B

# Verify JAR was created
RUN ls -lh /app/target/*.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run application
CMD ["java", "-jar", "/app/target/password-manager-backend-0.0.1-SNAPSHOT.jar"]

# Labels
LABEL maintainer="Password Manager Team"
LABEL description="Password Manager Backend - Spring Boot Application"
LABEL version="1.0.0"
