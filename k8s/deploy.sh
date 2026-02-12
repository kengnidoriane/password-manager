#!/bin/bash

# Kubernetes Deployment Script for Password Manager
# This script automates the deployment of all Kubernetes resources

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="password-manager"
TIMEOUT="300s"

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

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if metrics-server is installed (for HPA)
    if ! kubectl get deployment metrics-server -n kube-system &> /dev/null; then
        print_warning "Metrics server not found. HPA may not work properly."
        print_info "Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    fi
    
    print_info "Prerequisites check completed"
}

create_namespace() {
    print_info "Creating namespace: $NAMESPACE"
    kubectl apply -f namespace.yaml
}

deploy_secrets_and_configs() {
    print_info "Deploying secrets and configmaps..."
    
    # Check if secrets contain default values
    if grep -q "CHANGE_ME" secret.yaml; then
        print_error "Secrets contain default values. Please update secret.yaml with secure values before deployment."
        print_info "Generate secure passwords with: openssl rand -base64 32"
        exit 1
    fi
    
    kubectl apply -f secret.yaml
    kubectl apply -f configmap-backend.yaml
    kubectl apply -f configmap-frontend.yaml
    
    print_info "Secrets and configmaps deployed"
}

deploy_databases() {
    print_info "Deploying PostgreSQL..."
    kubectl apply -f postgres-statefulset.yaml
    
    print_info "Deploying Redis..."
    kubectl apply -f redis-statefulset.yaml
    
    print_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l component=postgres -n $NAMESPACE --timeout=$TIMEOUT || {
        print_error "PostgreSQL failed to start"
        kubectl logs -l component=postgres -n $NAMESPACE --tail=50
        exit 1
    }
    
    kubectl wait --for=condition=ready pod -l component=redis -n $NAMESPACE --timeout=$TIMEOUT || {
        print_error "Redis failed to start"
        kubectl logs -l component=redis -n $NAMESPACE --tail=50
        exit 1
    }
    
    print_info "Databases are ready"
}

deploy_backend() {
    print_info "Deploying backend..."
    kubectl apply -f backend-deployment.yaml
    kubectl apply -f backend-service.yaml
    
    print_info "Waiting for backend to be ready..."
    kubectl wait --for=condition=available deployment/backend -n $NAMESPACE --timeout=$TIMEOUT || {
        print_error "Backend failed to start"
        kubectl logs -l component=backend -n $NAMESPACE --tail=50
        exit 1
    }
    
    print_info "Backend is ready"
}

deploy_frontend() {
    print_info "Deploying frontend..."
    kubectl apply -f frontend-deployment.yaml
    kubectl apply -f frontend-service.yaml
    
    print_info "Waiting for frontend to be ready..."
    kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=$TIMEOUT || {
        print_error "Frontend failed to start"
        kubectl logs -l component=frontend -n $NAMESPACE --tail=50
        exit 1
    }
    
    print_info "Frontend is ready"
}

deploy_ingress() {
    print_info "Deploying ingress..."
    
    # Check if TLS secret exists
    if ! kubectl get secret password-manager-tls -n $NAMESPACE &> /dev/null; then
        print_warning "TLS secret 'password-manager-tls' not found"
        print_info "Create it with: kubectl create secret tls password-manager-tls --cert=tls.crt --key=tls.key -n $NAMESPACE"
        print_info "Or configure cert-manager for automatic certificate management"
    fi
    
    kubectl apply -f ingress.yaml
    
    print_info "Ingress deployed"
    print_info "Getting ingress details..."
    kubectl get ingress -n $NAMESPACE
}

deploy_autoscaling() {
    print_info "Deploying HorizontalPodAutoscalers..."
    kubectl apply -f hpa-backend.yaml
    kubectl apply -f hpa-frontend.yaml
    
    print_info "Deploying PodDisruptionBudgets..."
    kubectl apply -f pdb-backend.yaml
    kubectl apply -f pdb-frontend.yaml
    
    print_info "Auto-scaling configured"
}

deploy_policies() {
    print_info "Deploying network policies..."
    kubectl apply -f networkpolicy.yaml
    
    print_info "Deploying resource quotas..."
    kubectl apply -f resourcequota.yaml
    
    print_info "Policies deployed"
}

deploy_monitoring() {
    if [ -f "servicemonitor.yaml" ]; then
        print_info "Deploying ServiceMonitor for Prometheus..."
        kubectl apply -f servicemonitor.yaml || {
            print_warning "Failed to deploy ServiceMonitor. Prometheus Operator may not be installed."
        }
    fi
}

verify_deployment() {
    print_info "Verifying deployment..."
    
    echo ""
    print_info "=== Pods Status ==="
    kubectl get pods -n $NAMESPACE
    
    echo ""
    print_info "=== Services ==="
    kubectl get svc -n $NAMESPACE
    
    echo ""
    print_info "=== Ingress ==="
    kubectl get ingress -n $NAMESPACE
    
    echo ""
    print_info "=== HPA Status ==="
    kubectl get hpa -n $NAMESPACE
    
    echo ""
    print_info "=== PDB Status ==="
    kubectl get pdb -n $NAMESPACE
    
    echo ""
    print_info "=== Resource Usage ==="
    kubectl top pods -n $NAMESPACE 2>/dev/null || print_warning "Metrics not available yet"
}

print_next_steps() {
    echo ""
    print_info "========================================="
    print_info "Deployment completed successfully!"
    print_info "========================================="
    echo ""
    print_info "Next steps:"
    echo "1. Update your DNS records to point to the ingress IP/hostname"
    echo "2. Verify the application is accessible:"
    echo "   - Frontend: https://passwordmanager.example.com"
    echo "   - Backend API: https://api.passwordmanager.example.com/actuator/health"
    echo "3. Monitor the deployment:"
    echo "   kubectl get pods -n $NAMESPACE -w"
    echo "4. Check logs if needed:"
    echo "   kubectl logs -f deployment/backend -n $NAMESPACE"
    echo "   kubectl logs -f deployment/frontend -n $NAMESPACE"
    echo ""
    print_info "To access the application, ensure your DNS is configured correctly."
}

# Main deployment flow
main() {
    print_info "Starting Password Manager deployment to Kubernetes..."
    echo ""
    
    check_prerequisites
    create_namespace
    deploy_secrets_and_configs
    deploy_databases
    deploy_backend
    deploy_frontend
    deploy_ingress
    deploy_autoscaling
    deploy_policies
    deploy_monitoring
    
    echo ""
    verify_deployment
    print_next_steps
}

# Run main function
main
