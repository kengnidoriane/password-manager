#!/bin/bash

# Terraform Configuration Validation Script
# This script validates the Terraform configuration without requiring Terraform to be installed

set -e

echo "=== Terraform Configuration Validation ==="
echo ""

# Check for required files
echo "Checking for required files..."
required_files=(
    "main.tf"
    "variables.tf"
    "outputs.tf"
    "terraform.tfvars.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
        exit 1
    fi
done

echo ""
echo "Checking module structure..."

# Check each module
modules=(
    "vpc"
    "eks-cluster"
    "postgresql"
    "redis"
    "alb"
    "cdn"
    "route53"
    "acm"
    "monitoring"
    "s3"
    "iam"
)

for module in "${modules[@]}"; do
    echo "Checking module: $module"
    
    if [ ! -d "modules/$module" ]; then
        echo "  ✗ Module directory missing"
        exit 1
    fi
    
    if [ ! -f "modules/$module/main.tf" ]; then
        echo "  ✗ main.tf missing"
        exit 1
    fi
    
    if [ ! -f "modules/$module/variables.tf" ]; then
        echo "  ✗ variables.tf missing"
        exit 1
    fi
    
    if [ ! -f "modules/$module/outputs.tf" ]; then
        echo "  ✗ outputs.tf missing"
        exit 1
    fi
    
    echo "  ✓ Module structure valid"
done

echo ""
echo "Checking environment configurations..."

env_files=(
    "environments/dev.tfvars"
    "environments/staging.tfvars"
    "environments/production.tfvars"
)

for env_file in "${env_files[@]}"; do
    if [ -f "$env_file" ]; then
        echo "✓ $env_file exists"
    else
        echo "✗ $env_file missing"
        exit 1
    fi
done

echo ""
echo "Checking documentation..."

doc_files=(
    "README.md"
    "DEPLOYMENT_GUIDE.md"
    ".gitignore"
)

for doc_file in "${doc_files[@]}"; do
    if [ -f "$doc_file" ]; then
        echo "✓ $doc_file exists"
    else
        echo "✗ $doc_file missing"
        exit 1
    fi
done

echo ""
echo "Checking EKS policy files..."

policy_files=(
    "modules/eks-cluster/policies/aws-load-balancer-controller-policy.json"
    "modules/eks-cluster/policies/ebs-csi-driver-policy.json"
)

for policy_file in "${policy_files[@]}"; do
    if [ -f "$policy_file" ]; then
        echo "✓ $policy_file exists"
        # Validate JSON
        if command -v jq &> /dev/null; then
            if jq empty "$policy_file" 2>/dev/null; then
                echo "  ✓ Valid JSON"
            else
                echo "  ✗ Invalid JSON"
                exit 1
            fi
        fi
    else
        echo "✗ $policy_file missing"
        exit 1
    fi
done

echo ""
echo "=== All validation checks passed! ==="
echo ""
echo "Next steps:"
echo "1. Install Terraform: https://www.terraform.io/downloads"
echo "2. Run: terraform init"
echo "3. Run: terraform validate"
echo "4. Run: terraform fmt -recursive"
echo "5. Create terraform.tfvars from terraform.tfvars.example"
echo "6. Run: terraform plan"
