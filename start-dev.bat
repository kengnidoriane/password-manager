@echo off
REM Start development environment for Password Manager

echo.
echo Starting Password Manager Development Environment
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

echo Starting PostgreSQL and Redis...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo Database services are running!
echo.
echo Next steps:
echo    1. Backend: cd backend ^&^& mvn spring-boot:run
echo    2. Frontend: cd frontend ^&^& npm run dev
echo.
echo Access points:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:8080
echo    - Swagger UI: http://localhost:8080/swagger-ui.html
echo    - PostgreSQL: localhost:5432 (user: postgres, password: postgres)
echo    - Redis: localhost:6379
echo.
echo To stop services: docker-compose -f docker-compose.dev.yml down
echo.
