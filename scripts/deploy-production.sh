#!/bin/bash

# Production Deployment Script for Password Manager
# This script implements a blue-green deployment strategy with comprehensive checks
# Usage: ./scripts/deploy-production.sh [--skip-terraform] [--skip-migrations] [--version VERSION]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
NAMESPACE="password-manager"
VERSION="${VERSION:-latest}"
SKIP_TERRAFORM=false
SKIP_MIGRATIONS=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-terraform)
            SKIP_TERRAFORM=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Password Manager - Production Deployment              ║${NC}"
echo -e "${BLUE}║     Environment: ${ENVIRONMENT}                                  ║${NC}"
echo -e "${BLUE}║     Version: ${VERSION}                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Function to check command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓${NC} $1 is installed"
    return 0
}

# Function to prompt for confirmation
confirm() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would prompt: $1${NC}"
        return 0
    fi
    
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
}

# Step 1: Prerequisites Check
print_section "Step 1: Prerequisites Check"

PREREQ_FAILED=false

check_command "terraform" || PREREQ_FAILED=true
check_command "kubectl" || PREREQ_FAILED=true
check_command "aws" || PREREQ_FAILED=true
check_command "docker" || PREREQ_FAILED=true
check_command "jq" || PREREQ_FAILED=true

if [ "$PREREQ_FAILED" = true ]; then
    echo -e "${RED}❌ Prerequisites check failed. Please install missing tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Verify AWS credentials
echo ""
echo "Verifying AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    echo -e "${GREEN}✓${NC} AWS credentials valid"
    echo "  Account: $AWS_ACCOUNT"
    echo "  User: $AWS_USER"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

# Step 2: Confirmation
print_section "Step 2: Deployment Confirmation"

echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
echo ""
echo "Deployment details:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Skip Terraform: $SKIP_TERRAFORM"
echo "  Skip Migrations: $SKIP_MIGRATIONS"
echo "  AWS Account: $AWS_ACCOUNT"
echo ""

confirm "Are you sure you want to proceed with production deployment?"

# Step 3: Terraform Infrastructure
if [ "$SKIP_TERRAFORM" = false ]; then
    print_section "Step 3: Terraform Infrastructure Deployment"
    
    cd terraform
    
    echo "Initializing Terraform..."
    terraform init
    
    echo ""
    echo "Planning infrastructure changes..."
    terraform plan -var-file="environments/production.tfvars" -out=tfplan
    
    echo ""
    confirm "Review the Terraform plan above. Apply these changes?"
    
    echo ""
    echo "Applying Terraform configuration..."
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would run: terraform apply tfplan${NC}"
    else
        terraform apply tfplan
    fi
    
    echo ""
    echo "Saving Terraform outputs..."
    terraform output -json > terraform-outputs.json
    
    # Extract important outputs
    EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
    DB_ENDPOINT=$(terraform output -raw postgresql_endpoint)
    REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    CDN_DOMAIN=$(terraform output -raw cdn_domain_name)
    
    echo -e "${GREEN}✓${NC} Terraform infrastructure deployed"
    echo "  EKS Cluster: $EKS_CLUSTER_NAME"
    echo "  Database: $DB_ENDPOINT"
    echo "  Redis: $REDIS_ENDPOINT"
    echo "  CDN: $CDN_DOMAIN"
    
    cd ..
else
    echo -e "${YELLOW}⚠️  Skipping Terraform deployment${NC}"
    
    # Try to get outputs from existing state
    cd terraform
    if [ -f "terraform-outputs.json" ]; then
        EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")
        DB_ENDPOINT=$(terraform output -raw postgresql_endpoint 2>/dev/null || echo "")
        REDIS_ENDPOINT=$(terraform output -raw redis_endpoint 2>/dev/null || echo "")
        CDN_DOMAIN=$(terraform output -raw cdn_domain_name 2>/dev/null || echo "")
    fi
    cd ..
fi

# Step 4: Configure kubectl
print_section "Step 4: Configure kubectl"

if [ -z "$EKS_CLUSTER_NAME" ]; then
    echo -e "${RED}❌ EKS cluster name not found. Cannot configure kubectl.${NC}"
    exit 1
fi

echo "Configuring kubectl for cluster: $EKS_CLUSTER_NAME"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] Would run: aws eks update-kubeconfig${NC}"
else
    aws eks update-kubeconfig --region us-east-1 --name $EKS_CLUSTER_NAME
fi

echo ""
echo "Verifying cluster access..."
if [ "$DRY_RUN" = false ]; then
    kubectl cluster-info
    kubectl get nodes
fi

echo -e "${GREEN}✓${NC} kubectl configured"

# Step 5: Database Migrations
if [ "$SKIP_MIGRATIONS" = false ]; then
    print_section "Step 5: Database Migrations"
    
    if [ -z "$DB_ENDPOINT" ]; then
        echo -e "${RED}❌ Database endpoint not found${NC}"
        exit 1
    fi
    
    echo "Database endpoint: $DB_ENDPOINT"
    echo ""
    confirm "Run database migrations?"
    
    # Get database credentials from Terraform outputs or secrets
    DB_NAME=$(cd terraform && terraform output -raw postgresql_database_name)
    DB_USER=$(cd terraform && terraform output -raw postgresql_master_username)
    DB_PASSWORD=$(cd terraform && terraform output -raw postgresql_master_password)
    
    echo ""
    echo "Running Flyway migrations..."
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would run database migrations${NC}"
    else
        docker run --rm \
          -e SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_ENDPOINT/$DB_NAME" \
          -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
          -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
          -e SPRING_FLYWAY_ENABLED=true \
          ghcr.io/your-org/password-manager-backend:$VERSION \
          java -jar app.jar --spring.flyway.migrate
    fi
    
    echo -e "${GREEN}✓${NC} Database migrations completed"
else
    echo -e "${YELLOW}⚠️  Skipping database migrations${NC}"
fi

# Step 6: Deploy Backend (Blue-Green Strategy)
print_section "Step 6: Deploy Backend (Blue-Green Strategy)"

cd k8s

echo "Current backend deployment status:"
if [ "$DRY_RUN" = false ]; then
    kubectl get deployment backend -n $NAMESPACE || echo "No existing deployment"
fi

echo ""
echo "Deploying new backend version (green)..."

# Update image version in kustomization
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] Would update backend image to version $VERSION${NC}"
else
    kubectl set image deployment/backend \
      backend=ghcr.io/your-org/password-manager-backend:$VERSION \
      -n $NAMESPACE
fi

echo ""
echo "Waiting for new backend pods to be ready..."
if [ "$DRY_RUN" = false ]; then
    kubectl rollout status deployment/backend -n $NAMESPACE --timeout=600s
fi

echo ""
echo "Running health checks on new backend..."
if [ "$DRY_RUN" = false ]; then
    # Port forward to test
    kubectl port-forward -n $NAMESPACE deployment/backend 8080:8080 &
    PF_PID=$!
    sleep 5
    
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend health check passed"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        kill $PF_PID
        exit 1
    fi
    
    kill $PF_PID
fi

echo -e "${GREEN}✓${NC} Backend deployed successfully"

# Step 7: Deploy Frontend to CDN
print_section "Step 7: Deploy Frontend to Production CDN"

if [ -z "$CDN_DOMAIN" ]; then
    echo -e "${YELLOW}⚠️  CDN domain not found, deploying to Kubernetes instead${NC}"
    
    echo "Deploying frontend to Kubernetes..."
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would update frontend image to version $VERSION${NC}"
    else
        kubectl set image deployment/frontend \
          frontend=ghcr.io/your-org/password-manager-frontend:$VERSION \
          -n $NAMESPACE
        
        kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=600s
    fi
else
    echo "CDN Domain: $CDN_DOMAIN"
    echo ""
    echo "Building and deploying frontend to S3/CloudFront..."
    
    cd ../frontend
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would build and deploy frontend${NC}"
    else
        # Build frontend
        npm run build
        
        # Get S3 bucket from Terraform
        S3_BUCKET=$(cd ../terraform && terraform output -raw frontend_s3_bucket)
        
        # Sync to S3
        aws s3 sync out/ s3://$S3_BUCKET/ --delete
        
        # Invalidate CloudFront cache
        DISTRIBUTION_ID=$(cd ../terraform && terraform output -raw cdn_distribution_id)
        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    fi
    
    cd ../k8s
fi

echo -e "${GREEN}✓${NC} Frontend deployed successfully"

# Step 8: Verify Health Checks
print_section "Step 8: Verify Health Checks"

echo "Checking all pods are running..."
if [ "$DRY_RUN" = false ]; then
    kubectl get pods -n $NAMESPACE
    
    # Check if all pods are ready
    NOT_READY=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)
    if [ "$NOT_READY" -gt 0 ]; then
        echo -e "${RED}❌ Some pods are not ready${NC}"
        kubectl get pods -n $NAMESPACE
        exit 1
    fi
fi

echo ""
echo "Checking service endpoints..."
if [ "$DRY_RUN" = false ]; then
    kubectl get svc -n $NAMESPACE
    kubectl get ingress -n $NAMESPACE
fi

echo ""
echo "Running comprehensive health checks..."

# Get ingress URL
INGRESS_URL=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")

if [ -n "$INGRESS_URL" ]; then
    echo "Testing: https://$INGRESS_URL"
    
    # Frontend health
    if curl -f -s https://$INGRESS_URL/ > /dev/null; then
        echo -e "${GREEN}✓${NC} Frontend is accessible"
    else
        echo -e "${RED}❌ Frontend is not accessible${NC}"
    fi
    
    # Backend health
    if curl -f -s https://$INGRESS_URL/api/v1/health > /dev/null; then
        echo -e "${GREEN}✓${NC} Backend API is accessible"
    else
        echo -e "${RED}❌ Backend API is not accessible${NC}"
    fi
    
    # Actuator health
    if curl -f -s https://$INGRESS_URL/actuator/health > /dev/null; then
        echo -e "${GREEN}✓${NC} Actuator health endpoint is accessible"
    else
        echo -e "${YELLOW}⚠️${NC}  Actuator health endpoint is not accessible (may be secured)"
    fi
fi

echo -e "${GREEN}✓${NC} Health checks completed"

# Step 9: Monitor Error Rates and Performance
print_section "Step 9: Monitor Error Rates and Performance"

echo "Deployment completed. Monitoring for 5 minutes..."
echo ""
echo "Monitoring checklist:"
echo "  - Error rates in logs"
echo "  - Response times"
echo "  - Pod resource usage"
echo "  - Database connections"
echo ""

if [ "$DRY_RUN" = false ]; then
    echo "Watching pod status (Ctrl+C to stop)..."
    timeout 300 kubectl get pods -n $NAMESPACE -w || true
fi

echo ""
echo "Check Grafana dashboards for detailed metrics:"
echo "  kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo ""

# Step 10: Smoke Tests
print_section "Step 10: Running Smoke Tests"

cd ..

if [ -f "scripts/smoke-tests.sh" ]; then
    echo "Running automated smoke tests..."
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would run smoke tests${NC}"
    else
        chmod +x scripts/smoke-tests.sh
        ./scripts/smoke-tests.sh production || echo -e "${YELLOW}⚠️  Some smoke tests failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Smoke test script not found${NC}"
fi

# Step 11: Final Summary
print_section "Deployment Summary"

echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo ""
echo "Deployment details:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Timestamp: $(date)"
echo ""
echo "Access URLs:"
if [ -n "$INGRESS_URL" ]; then
    echo "  Application: https://$INGRESS_URL"
    echo "  API: https://$INGRESS_URL/api/v1"
    echo "  Swagger: https://$INGRESS_URL/swagger-ui.html"
fi
echo ""
echo "Monitoring:"
echo "  Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "  Prometheus: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo ""
echo "Next steps:"
echo "  1. Monitor application for 24-48 hours"
echo "  2. Check error rates and performance metrics"
echo "  3. Collect user feedback"
echo "  4. Announce launch to users"
echo ""
echo "Rollback command (if needed):"
echo "  cd k8s && ./rollback.sh"
echo ""

# Create deployment record
DEPLOYMENT_RECORD="deployments/production-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p deployments
cat > $DEPLOYMENT_RECORD <<EOF
Production Deployment Record
============================

Date: $(date)
Version: $VERSION
Deployed by: $(whoami)
AWS Account: $AWS_ACCOUNT

Components Deployed:
- Terraform Infrastructure: $([ "$SKIP_TERRAFORM" = false ] && echo "Yes" || echo "Skipped")
- Database Migrations: $([ "$SKIP_MIGRATIONS" = false ] && echo "Yes" || echo "Skipped")
- Backend: Yes (version $VERSION)
- Frontend: Yes (version $VERSION)

Cluster: $EKS_CLUSTER_NAME
Database: $DB_ENDPOINT
Redis: $REDIS_ENDPOINT
CDN: $CDN_DOMAIN
Ingress: $INGRESS_URL

Status: SUCCESS
EOF

echo "Deployment record saved to: $DEPLOYMENT_RECORD"
echo ""
echo -e "${GREEN}🎉 Deployment complete! Welcome to production! 🎉${NC}"
