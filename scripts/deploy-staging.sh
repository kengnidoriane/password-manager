#!/bin/bash

# Password Manager - Staging Deployment Script
# This script automates the complete deployment to staging environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="staging"
AWS_REGION="us-east-1"
TERRAFORM_DIR="../terraform"
K8S_DIR="../k8s"
NAMESPACE="password-manager"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check required tools
    local tools=("terraform" "kubectl" "aws" "docker")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed"
            exit 1
        fi
        print_info "✓ $tool found"
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    print_info "✓ AWS credentials configured"
    
    # Check Terraform state
    if [ ! -d "$TERRAFORM_DIR/.terraform" ]; then
        print_warning "Terraform not initialized. Run 'terraform init' first."
    fi
    
    print_info "Prerequisites check completed"
}

apply_terraform() {
    print_step "Applying Terraform configuration..."
    
    cd $TERRAFORM_DIR
    
    # Initialize if needed
    if [ ! -d ".terraform" ]; then
        print_info "Initializing Terraform..."
        terraform init
    fi
    
    # Validate configuration
    print_info "Validating Terraform configuration..."
    terraform validate
    
    # Plan deployment
    print_info "Planning infrastructure changes..."
    terraform plan -var-file="environments/staging.tfvars" -out=tfplan
    
    # Ask for confirmation
    echo ""
    read -p "Do you want to apply these changes? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Apply configuration
    print_info "Applying Terraform configuration..."
    terraform apply tfplan
    
    # Save outputs
    print_info "Saving Terraform outputs..."
    terraform output > outputs.txt
    terraform output -json > outputs.json
    
    print_info "Terraform configuration applied successfully"
    
    cd - > /dev/null
}

configure_kubectl() {
    print_step "Configuring kubectl..."
    
    cd $TERRAFORM_DIR
    
    # Get cluster name from Terraform outputs
    CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")
    
    if [ -z "$CLUSTER_NAME" ]; then
        print_error "Could not get EKS cluster name from Terraform outputs"
        exit 1
    fi
    
    print_info "Configuring kubectl for cluster: $CLUSTER_NAME"
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    # Verify connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_info "kubectl configured successfully"
    print_info "Cluster nodes:"
    kubectl get nodes
    
    cd - > /dev/null
}

run_database_migrations() {
    print_step "Running database migrations..."
    
    cd $TERRAFORM_DIR
    
    # Get database endpoint
    DB_ENDPOINT=$(terraform output -raw postgresql_endpoint 2>/dev/null || echo "")
    DB_NAME=$(terraform output -raw postgresql_database_name 2>/dev/null || echo "")
    DB_USER=$(terraform output -raw postgresql_master_username 2>/dev/null || echo "")
    DB_PASSWORD=$(terraform output -raw postgresql_master_password 2>/dev/null || echo "")
    
    if [ -z "$DB_ENDPOINT" ]; then
        print_error "Could not get database endpoint from Terraform outputs"
        exit 1
    fi
    
    print_info "Database endpoint: $DB_ENDPOINT"
    
    # Check if backend image exists
    if ! docker images | grep -q "password-manager-backend"; then
        print_warning "Backend image not found locally. Building..."
        cd ../backend
        docker build -t password-manager-backend:staging .
        cd - > /dev/null
    fi
    
    # Run migrations using Flyway in backend container
    print_info "Running Flyway migrations..."
    docker run --rm \
        -e SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_ENDPOINT/$DB_NAME" \
        -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
        -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
        -e SPRING_FLYWAY_ENABLED=true \
        password-manager-backend:staging \
        java -jar app.jar --spring.flyway.migrate || {
        print_error "Database migrations failed"
        exit 1
    }
    
    print_info "Database migrations completed successfully"
    
    cd - > /dev/null
}

deploy_to_kubernetes() {
    print_step "Deploying to Kubernetes..."
    
    cd $K8S_DIR
    
    # Deploy using staging overlay
    print_info "Applying Kubernetes manifests for staging..."
    kubectl apply -k overlays/staging/
    
    # Wait for deployments to be ready
    print_info "Waiting for backend deployment..."
    kubectl wait --for=condition=available deployment/backend -n $NAMESPACE --timeout=300s || {
        print_error "Backend deployment failed"
        kubectl logs -l component=backend -n $NAMESPACE --tail=50
        exit 1
    }
    
    print_info "Waiting for frontend deployment..."
    kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=300s || {
        print_error "Frontend deployment failed"
        kubectl logs -l component=frontend -n $NAMESPACE --tail=50
        exit 1
    }
    
    print_info "Kubernetes deployment completed successfully"
    
    cd - > /dev/null
}

configure_monitoring() {
    print_step "Configuring monitoring and logging..."
    
    cd $TERRAFORM_DIR
    
    # Get Grafana credentials
    GRAFANA_PASSWORD=$(terraform output -raw grafana_admin_password 2>/dev/null || echo "")
    
    if [ -n "$GRAFANA_PASSWORD" ]; then
        print_info "Grafana admin password: $GRAFANA_PASSWORD"
        print_info "Access Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
    fi
    
    # Deploy ServiceMonitor if Prometheus Operator is available
    if kubectl get crd servicemonitors.monitoring.coreos.com &> /dev/null; then
        print_info "Deploying ServiceMonitor for Prometheus..."
        kubectl apply -f $K8S_DIR/servicemonitor.yaml || print_warning "ServiceMonitor deployment failed"
    else
        print_warning "Prometheus Operator not found. Skipping ServiceMonitor deployment."
    fi
    
    print_info "Monitoring configuration completed"
    
    cd - > /dev/null
}

run_smoke_tests() {
    print_step "Running smoke tests..."
    
    cd $TERRAFORM_DIR
    
    # Get application URL
    APP_URL=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
    
    if [ -z "$APP_URL" ]; then
        print_warning "Could not get application URL from Terraform outputs"
        print_info "Checking Ingress..."
        APP_URL=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
    fi
    
    if [ -z "$APP_URL" ]; then
        print_error "Could not determine application URL"
        exit 1
    fi
    
    print_info "Application URL: https://$APP_URL"
    
    # Wait for DNS propagation
    print_info "Waiting for DNS propagation (30 seconds)..."
    sleep 30
    
    # Test backend health endpoint
    print_info "Testing backend health endpoint..."
    if curl -f -s -o /dev/null -w "%{http_code}" "https://$APP_URL/api/v1/health" | grep -q "200"; then
        print_info "✓ Backend health check passed"
    else
        print_error "✗ Backend health check failed"
        exit 1
    fi
    
    # Test frontend
    print_info "Testing frontend..."
    if curl -f -s -o /dev/null -w "%{http_code}" "https://$APP_URL/" | grep -q "200"; then
        print_info "✓ Frontend check passed"
    else
        print_error "✗ Frontend check failed"
        exit 1
    fi
    
    # Test backend actuator endpoints
    print_info "Testing backend actuator endpoints..."
    if curl -f -s "https://$APP_URL/actuator/health" | grep -q "UP"; then
        print_info "✓ Actuator health endpoint passed"
    else
        print_warning "✗ Actuator health endpoint check failed"
    fi
    
    # Test database connectivity
    print_info "Testing database connectivity..."
    if curl -f -s "https://$APP_URL/actuator/health" | grep -q "db"; then
        print_info "✓ Database connectivity check passed"
    else
        print_warning "✗ Database connectivity check failed"
    fi
    
    # Test Redis connectivity
    print_info "Testing Redis connectivity..."
    if curl -f -s "https://$APP_URL/actuator/health" | grep -q "redis"; then
        print_info "✓ Redis connectivity check passed"
    else
        print_warning "✗ Redis connectivity check failed"
    fi
    
    print_info "Smoke tests completed successfully"
    
    cd - > /dev/null
}

verify_deployment() {
    print_step "Verifying deployment..."
    
    echo ""
    print_info "=== Infrastructure Status ==="
    cd $TERRAFORM_DIR
    terraform output
    cd - > /dev/null
    
    echo ""
    print_info "=== Kubernetes Pods ==="
    kubectl get pods -n $NAMESPACE
    
    echo ""
    print_info "=== Kubernetes Services ==="
    kubectl get svc -n $NAMESPACE
    
    echo ""
    print_info "=== Kubernetes Ingress ==="
    kubectl get ingress -n $NAMESPACE
    
    echo ""
    print_info "=== HPA Status ==="
    kubectl get hpa -n $NAMESPACE
    
    echo ""
    print_info "=== Resource Usage ==="
    kubectl top pods -n $NAMESPACE 2>/dev/null || print_warning "Metrics not available yet"
    
    echo ""
    print_info "=== Recent Events ==="
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10
}

print_summary() {
    echo ""
    print_info "========================================="
    print_info "Staging Deployment Completed Successfully!"
    print_info "========================================="
    echo ""
    
    cd $TERRAFORM_DIR
    APP_URL=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
    cd - > /dev/null
    
    if [ -n "$APP_URL" ]; then
        print_info "Application URL: https://$APP_URL"
        print_info "Backend API: https://$APP_URL/api/v1/health"
        print_info "Swagger UI: https://$APP_URL/swagger-ui.html"
    fi
    
    echo ""
    print_info "Useful commands:"
    echo "  - View logs: kubectl logs -f deployment/backend -n $NAMESPACE"
    echo "  - View pods: kubectl get pods -n $NAMESPACE"
    echo "  - Port forward: kubectl port-forward svc/backend-service 8080:8080 -n $NAMESPACE"
    echo "  - Rollback: cd k8s && ./rollback.sh"
    echo ""
    print_info "Next steps:"
    echo "  1. Verify all features work correctly"
    echo "  2. Run end-to-end tests"
    echo "  3. Monitor application logs and metrics"
    echo "  4. Update DNS if needed"
    echo ""
}

# Main deployment flow
main() {
    print_info "Starting Password Manager deployment to staging environment..."
    echo ""
    
    check_prerequisites
    
    # Ask which steps to run
    echo ""
    print_info "Select deployment steps:"
    echo "1. Apply Terraform configuration"
    echo "2. Configure kubectl"
    echo "3. Run database migrations"
    echo "4. Deploy to Kubernetes"
    echo "5. Configure monitoring"
    echo "6. Run smoke tests"
    echo "7. Verify deployment"
    echo "8. All of the above"
    echo ""
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            apply_terraform
            ;;
        2)
            configure_kubectl
            ;;
        3)
            run_database_migrations
            ;;
        4)
            deploy_to_kubernetes
            ;;
        5)
            configure_monitoring
            ;;
        6)
            run_smoke_tests
            ;;
        7)
            verify_deployment
            ;;
        8)
            apply_terraform
            configure_kubectl
            run_database_migrations
            deploy_to_kubernetes
            configure_monitoring
            run_smoke_tests
            verify_deployment
            print_summary
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_info "Deployment step(s) completed!"
}

# Run main function
main
