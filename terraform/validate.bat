@echo off
REM Terraform Configuration Validation Script for Windows
REM This script validates the Terraform configuration without requiring Terraform to be installed

setlocal enabledelayedexpansion

echo === Terraform Configuration Validation ===
echo.

echo Checking for required files...
set "error=0"

call :check_file "main.tf"
call :check_file "variables.tf"
call :check_file "outputs.tf"
call :check_file "terraform.tfvars.example"

echo.
echo Checking module structure...

set modules=vpc eks-cluster postgresql redis alb cdn route53 acm monitoring s3 iam

for %%m in (%modules%) do (
    echo Checking module: %%m
    
    if not exist "modules\%%m" (
        echo   X Module directory missing
        set "error=1"
    ) else (
        call :check_module_file "modules\%%m\main.tf"
        call :check_module_file "modules\%%m\variables.tf"
        call :check_module_file "modules\%%m\outputs.tf"
        if !error! equ 0 (
            echo   √ Module structure valid
        )
    )
)

echo.
echo Checking environment configurations...

call :check_file "environments\dev.tfvars"
call :check_file "environments\staging.tfvars"
call :check_file "environments\production.tfvars"

echo.
echo Checking documentation...

call :check_file "README.md"
call :check_file "DEPLOYMENT_GUIDE.md"
call :check_file ".gitignore"

echo.
echo Checking EKS policy files...

call :check_file "modules\eks-cluster\policies\aws-load-balancer-controller-policy.json"
call :check_file "modules\eks-cluster\policies\ebs-csi-driver-policy.json"

echo.
if !error! equ 0 (
    echo === All validation checks passed! ===
    echo.
    echo Next steps:
    echo 1. Install Terraform: https://www.terraform.io/downloads
    echo 2. Run: terraform init
    echo 3. Run: terraform validate
    echo 4. Run: terraform fmt -recursive
    echo 5. Create terraform.tfvars from terraform.tfvars.example
    echo 6. Run: terraform plan
    exit /b 0
) else (
    echo === Validation failed! ===
    exit /b 1
)

:check_file
if exist "%~1" (
    echo √ %~1 exists
) else (
    echo X %~1 missing
    set "error=1"
)
exit /b

:check_module_file
if exist "%~1" (
    REM File exists, no output
) else (
    echo   X %~1 missing
    set "error=1"
)
exit /b
