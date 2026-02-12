@echo off
REM ============================================
REM Docker Image Build Script for Windows
REM Builds optimized Docker images for backend and frontend
REM ============================================

setlocal enabledelayedexpansion

REM Configuration
if "%VERSION%"=="" set VERSION=latest
if "%REGISTRY%"=="" set REGISTRY=ghcr.io
if "%REPOSITORY%"=="" set REPOSITORY=password-manager
if "%BUILD_BACKEND%"=="" set BUILD_BACKEND=true
if "%BUILD_FRONTEND%"=="" set BUILD_FRONTEND=true
if "%PUSH_IMAGES%"=="" set PUSH_IMAGES=false

REM Colors (limited support in Windows)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

echo %INFO% Starting Docker image build process...
echo %INFO% Version: %VERSION%
echo %INFO% Registry: %REGISTRY%
echo %INFO% Repository: %REPOSITORY%
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not running. Please start Docker and try again.
    exit /b 1
)
echo %SUCCESS% Docker is running
echo.

REM Build backend image
if "%BUILD_BACKEND%"=="true" (
    echo %INFO% Building backend image...
    cd backend
    
    docker build ^
        --tag "%REGISTRY%/%REPOSITORY%-backend:%VERSION%" ^
        --tag "%REGISTRY%/%REPOSITORY%-backend:latest" ^
        --build-arg BUILDKIT_INLINE_CACHE=1 ^
        --file Dockerfile ^
        .
    
    if errorlevel 1 (
        echo %ERROR% Backend build failed
        cd ..
        exit /b 1
    )
    
    cd ..
    echo %SUCCESS% Backend image built successfully
    
    REM Display image size
    for /f "tokens=*" %%i in ('docker images "%REGISTRY%/%REPOSITORY%-backend:%VERSION%" --format "{{.Size}}"') do set IMAGE_SIZE=%%i
    echo %INFO% Backend image size: !IMAGE_SIZE!
    echo.
)

REM Build frontend image
if "%BUILD_FRONTEND%"=="true" (
    echo %INFO% Building frontend image...
    cd frontend
    
    docker build ^
        --tag "%REGISTRY%/%REPOSITORY%-frontend:%VERSION%" ^
        --tag "%REGISTRY%/%REPOSITORY%-frontend:latest" ^
        --build-arg BUILDKIT_INLINE_CACHE=1 ^
        --file Dockerfile ^
        .
    
    if errorlevel 1 (
        echo %ERROR% Frontend build failed
        cd ..
        exit /b 1
    )
    
    cd ..
    echo %SUCCESS% Frontend image built successfully
    
    REM Display image size
    for /f "tokens=*" %%i in ('docker images "%REGISTRY%/%REPOSITORY%-frontend:%VERSION%" --format "{{.Size}}"') do set IMAGE_SIZE=%%i
    echo %INFO% Frontend image size: !IMAGE_SIZE!
    echo.
)

REM Test images
echo %INFO% Testing images...
if "%BUILD_BACKEND%"=="true" (
    echo %INFO% Testing backend image...
    docker run --rm "%REGISTRY%/%REPOSITORY%-backend:%VERSION%" java -version
    if errorlevel 1 (
        echo %ERROR% Backend image test failed
        exit /b 1
    )
    echo %SUCCESS% Backend image test passed
)

if "%BUILD_FRONTEND%"=="true" (
    echo %INFO% Testing frontend image...
    docker run --rm "%REGISTRY%/%REPOSITORY%-frontend:%VERSION%" node --version
    if errorlevel 1 (
        echo %ERROR% Frontend image test failed
        exit /b 1
    )
    echo %SUCCESS% Frontend image test passed
)
echo.

REM Push images to registry
if "%PUSH_IMAGES%"=="true" (
    echo %INFO% Pushing images to registry...
    
    if "%BUILD_BACKEND%"=="true" (
        docker push "%REGISTRY%/%REPOSITORY%-backend:%VERSION%"
        docker push "%REGISTRY%/%REPOSITORY%-backend:latest"
        echo %SUCCESS% Backend image pushed
    )
    
    if "%BUILD_FRONTEND%"=="true" (
        docker push "%REGISTRY%/%REPOSITORY%-frontend:%VERSION%"
        docker push "%REGISTRY%/%REPOSITORY%-frontend:latest"
        echo %SUCCESS% Frontend image pushed
    )
) else (
    echo %WARNING% Skipping image push (set PUSH_IMAGES=true to enable)
)
echo.

echo %SUCCESS% Build process completed successfully!
echo.
echo %INFO% Built images:
if "%BUILD_BACKEND%"=="true" (
    echo   - %REGISTRY%/%REPOSITORY%-backend:%VERSION%
)
if "%BUILD_FRONTEND%"=="true" (
    echo   - %REGISTRY%/%REPOSITORY%-frontend:%VERSION%
)

endlocal
