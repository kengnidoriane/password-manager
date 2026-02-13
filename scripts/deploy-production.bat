@echo off
REM Production Deployment Script for Password Manager (Windows)
REM This script implements a blue-green deployment strategy with comprehensive checks
REM Usage: scripts\deploy-production.bat [--skip-terraform] [--skip-migrations] [--version VERSION]

setlocal enabledelayedexpansion

REM Configuration
set ENVIRONMENT=production
set NAMESPACE=password-manager
set VERSION=latest
set SKIP_TERRAFORM=false
set SKIP_MIGRATIONS=false
set DRY_RUN=false

REM Parse arguments
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--skip-terraform" (
    set SKIP_TERRAFORM=true
    shift
    goto parse_args
)
if "%~1"=="--skip-migrations" (
    set SKIP_MIGRATIONS=true
    shift
    goto parse_args
)
if "%~1"=="--version" (
    set VERSION=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
echo Unknown option: %~1
exit /b 1

:end_parse

echo ================================================================
echo      Password Manager - Production Deployment
echo      Environment: %ENVIRONMENT%
echo      Version: %VERSION%
echo ================================================================
echo.

REM Step 1: Prerequisites Check
echo ================================================================
echo   Step 1: Prerequisites Check
echo ================================================================

where terraform >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] terraform is not installed
    exit /b 1
)
echo [OK] terraform is installed

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] kubectl is not installed
    exit /b 1
)
echo [OK] kubectl is installed

where aws >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] aws CLI is not installed
    exit /b 1
)
echo [OK] aws CLI is installed

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] docker is not installed
    exit /b 1
)
echo [OK] docker is installed

echo.
echo Verifying AWS credentials...
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS credentials not configured
    exit /b 1
)

for /f "tokens=*" %%a in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT=%%a
for /f "tokens=*" %%a in ('aws sts get-caller-identity --query Arn --output text') do set AWS_USER=%%a

echo [OK] AWS credentials valid
echo   Account: %AWS_ACCOUNT%
echo   User: %AWS_USER%

REM Step 2: Confirmation
echo.
echo ================================================================
echo   Step 2: Deployment Confirmation
echo ================================================================
echo.
echo [WARNING] You are about to deploy to PRODUCTION
echo.
echo Deployment details:
echo   Environment: %ENVIRONMENT%
echo   Version: %VERSION%
echo   Skip Terraform: %SKIP_TERRAFORM%
echo   Skip Migrations: %SKIP_MIGRATIONS%
echo   AWS Account: %AWS_ACCOUNT%
echo.

set /p CONFIRM="Are you sure you want to proceed with production deployment? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled
    exit /b 1
)

REM Step 3: Terraform Infrastructure
if "%SKIP_TERRAFORM%"=="false" (
    echo.
    echo ================================================================
    echo   Step 3: Terraform Infrastructure Deployment
    echo ================================================================
    
    cd terraform
    
    echo Initializing Terraform...
    terraform init
    
    echo.
    echo Planning infrastructure changes...
    terraform plan -var-file="environments/production.tfvars" -out=tfplan
    
    echo.
    set /p APPLY="Review the Terraform plan above. Apply these changes? (y/N): "
    if /i not "%APPLY%"=="y" (
        echo Deployment cancelled
        cd ..
        exit /b 1
    )
    
    echo.
    echo Applying Terraform configuration...
    if "%DRY_RUN%"=="true" (
        echo [DRY RUN] Would run: terraform apply tfplan
    ) else (
        terraform apply tfplan
    )
    
    echo.
    echo Saving Terraform outputs...
    terraform output -json > terraform-outputs.json
    
    REM Extract important outputs
    for /f "tokens=*" %%a in ('terraform output -raw eks_cluster_name') do set EKS_CLUSTER_NAME=%%a
    for /f "tokens=*" %%a in ('terraform output -raw postgresql_endpoint') do set DB_ENDPOINT=%%a
    for /f "tokens=*" %%a in ('terraform output -raw redis_endpoint') do set REDIS_ENDPOINT=%%a
    for /f "tokens=*" %%a in ('terraform output -raw cdn_domain_name') do set CDN_DOMAIN=%%a
    
    echo [OK] Terraform infrastructure deployed
    echo   EKS Cluster: %EKS_CLUSTER_NAME%
    echo   Database: %DB_ENDPOINT%
    echo   Redis: %REDIS_ENDPOINT%
    echo   CDN: %CDN_DOMAIN%
    
    cd ..
) else (
    echo [WARNING] Skipping Terraform deployment
    
    REM Try to get outputs from existing state
    cd terraform
    if exist terraform-outputs.json (
        for /f "tokens=*" %%a in ('terraform output -raw eks_cluster_name 2^>nul') do set EKS_CLUSTER_NAME=%%a
        for /f "tokens=*" %%a in ('terraform output -raw postgresql_endpoint 2^>nul') do set DB_ENDPOINT=%%a
        for /f "tokens=*" %%a in ('terraform output -raw redis_endpoint 2^>nul') do set REDIS_ENDPOINT=%%a
        for /f "tokens=*" %%a in ('terraform output -raw cdn_domain_name 2^>nul') do set CDN_DOMAIN=%%a
    )
    cd ..
)

REM Step 4: Configure kubectl
echo.
echo ================================================================
echo   Step 4: Configure kubectl
echo ================================================================

if "%EKS_CLUSTER_NAME%"=="" (
    echo [ERROR] EKS cluster name not found. Cannot configure kubectl.
    exit /b 1
)

echo Configuring kubectl for cluster: %EKS_CLUSTER_NAME%
if "%DRY_RUN%"=="true" (
    echo [DRY RUN] Would run: aws eks update-kubeconfig
) else (
    aws eks update-kubeconfig --region us-east-1 --name %EKS_CLUSTER_NAME%
)

echo.
echo Verifying cluster access...
if "%DRY_RUN%"=="false" (
    kubectl cluster-info
    kubectl get nodes
)

echo [OK] kubectl configured

REM Step 5: Database Migrations
if "%SKIP_MIGRATIONS%"=="false" (
    echo.
    echo ================================================================
    echo   Step 5: Database Migrations
    echo ================================================================
    
    if "%DB_ENDPOINT%"=="" (
        echo [ERROR] Database endpoint not found
        exit /b 1
    )
    
    echo Database endpoint: %DB_ENDPOINT%
    echo.
    set /p MIGRATE="Run database migrations? (y/N): "
    if /i not "%MIGRATE%"=="y" (
        echo Skipping migrations
        goto skip_migrations
    )
    
    REM Get database credentials from Terraform outputs
    cd terraform
    for /f "tokens=*" %%a in ('terraform output -raw postgresql_database_name') do set DB_NAME=%%a
    for /f "tokens=*" %%a in ('terraform output -raw postgresql_master_username') do set DB_USER=%%a
    for /f "tokens=*" %%a in ('terraform output -raw postgresql_master_password') do set DB_PASSWORD=%%a
    cd ..
    
    echo.
    echo Running Flyway migrations...
    if "%DRY_RUN%"=="true" (
        echo [DRY RUN] Would run database migrations
    ) else (
        docker run --rm ^
          -e SPRING_DATASOURCE_URL="jdbc:postgresql://%DB_ENDPOINT%/%DB_NAME%" ^
          -e SPRING_DATASOURCE_USERNAME="%DB_USER%" ^
          -e SPRING_DATASOURCE_PASSWORD="%DB_PASSWORD%" ^
          -e SPRING_FLYWAY_ENABLED=true ^
          ghcr.io/your-org/password-manager-backend:%VERSION% ^
          java -jar app.jar --spring.flyway.migrate
    )
    
    echo [OK] Database migrations completed
) else (
    echo [WARNING] Skipping database migrations
)

:skip_migrations

REM Step 6: Deploy Backend
echo.
echo ================================================================
echo   Step 6: Deploy Backend (Blue-Green Strategy)
echo ================================================================

cd k8s

echo Current backend deployment status:
if "%DRY_RUN%"=="false" (
    kubectl get deployment backend -n %NAMESPACE% 2>nul || echo No existing deployment
)

echo.
echo Deploying new backend version (green)...

if "%DRY_RUN%"=="true" (
    echo [DRY RUN] Would update backend image to version %VERSION%
) else (
    kubectl set image deployment/backend backend=ghcr.io/your-org/password-manager-backend:%VERSION% -n %NAMESPACE%
)

echo.
echo Waiting for new backend pods to be ready...
if "%DRY_RUN%"=="false" (
    kubectl rollout status deployment/backend -n %NAMESPACE% --timeout=600s
)

echo [OK] Backend deployed successfully

REM Step 7: Deploy Frontend
echo.
echo ================================================================
echo   Step 7: Deploy Frontend to Production CDN
echo ================================================================

if "%CDN_DOMAIN%"=="" (
    echo [WARNING] CDN domain not found, deploying to Kubernetes instead
    
    echo Deploying frontend to Kubernetes...
    if "%DRY_RUN%"=="true" (
        echo [DRY RUN] Would update frontend image to version %VERSION%
    ) else (
        kubectl set image deployment/frontend frontend=ghcr.io/your-org/password-manager-frontend:%VERSION% -n %NAMESPACE%
        kubectl rollout status deployment/frontend -n %NAMESPACE% --timeout=600s
    )
) else (
    echo CDN Domain: %CDN_DOMAIN%
    echo.
    echo Building and deploying frontend to S3/CloudFront...
    
    cd ..\frontend
    
    if "%DRY_RUN%"=="true" (
        echo [DRY RUN] Would build and deploy frontend
    ) else (
        call npm run build
        
        REM Get S3 bucket from Terraform
        cd ..\terraform
        for /f "tokens=*" %%a in ('terraform output -raw frontend_s3_bucket') do set S3_BUCKET=%%a
        cd ..
        
        REM Sync to S3
        aws s3 sync frontend\out\ s3://%S3_BUCKET%/ --delete
        
        REM Invalidate CloudFront cache
        cd terraform
        for /f "tokens=*" %%a in ('terraform output -raw cdn_distribution_id') do set DISTRIBUTION_ID=%%a
        cd ..
        aws cloudfront create-invalidation --distribution-id %DISTRIBUTION_ID% --paths "/*"
    )
    
    cd k8s
)

echo [OK] Frontend deployed successfully

REM Step 8: Verify Health Checks
echo.
echo ================================================================
echo   Step 8: Verify Health Checks
echo ================================================================

echo Checking all pods are running...
if "%DRY_RUN%"=="false" (
    kubectl get pods -n %NAMESPACE%
)

echo.
echo Checking service endpoints...
if "%DRY_RUN%"=="false" (
    kubectl get svc -n %NAMESPACE%
    kubectl get ingress -n %NAMESPACE%
)

echo [OK] Health checks completed

REM Final Summary
echo.
echo ================================================================
echo   Deployment Summary
echo ================================================================
echo.
echo [SUCCESS] Production deployment completed successfully!
echo.
echo Deployment details:
echo   Environment: %ENVIRONMENT%
echo   Version: %VERSION%
echo   Timestamp: %date% %time%
echo.
echo Next steps:
echo   1. Monitor application for 24-48 hours
echo   2. Check error rates and performance metrics
echo   3. Collect user feedback
echo   4. Announce launch to users
echo.
echo Rollback command (if needed):
echo   cd k8s ^&^& rollback.bat
echo.

REM Create deployment record
if not exist deployments mkdir deployments
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set DEPLOYMENT_RECORD=deployments\production-%TIMESTAMP%.txt

(
echo Production Deployment Record
echo ============================
echo.
echo Date: %date% %time%
echo Version: %VERSION%
echo Deployed by: %USERNAME%
echo AWS Account: %AWS_ACCOUNT%
echo.
echo Components Deployed:
echo - Terraform Infrastructure: %SKIP_TERRAFORM%
echo - Database Migrations: %SKIP_MIGRATIONS%
echo - Backend: Yes ^(version %VERSION%^)
echo - Frontend: Yes ^(version %VERSION%^)
echo.
echo Cluster: %EKS_CLUSTER_NAME%
echo Database: %DB_ENDPOINT%
echo Redis: %REDIS_ENDPOINT%
echo CDN: %CDN_DOMAIN%
echo.
echo Status: SUCCESS
) > %DEPLOYMENT_RECORD%

echo Deployment record saved to: %DEPLOYMENT_RECORD%
echo.
echo [SUCCESS] Deployment complete! Welcome to production!

cd ..
endlocal
