#!/bin/bash

# Kubernetes Rollback Script for Password Manager
# This script helps rollback deployments to previous versions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NAMESPACE="password-manager"

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_rollout_history() {
    local component=$1
    print_info "Rollout history for $component:"
    kubectl rollout history deployment/$component -n $NAMESPACE
}

rollback_component() {
    local component=$1
    local revision=$2
    
    print_info "Rolling back $component..."
    
    if [ -z "$revision" ]; then
        # Rollback to previous revision
        kubectl rollout undo deployment/$component -n $NAMESPACE
    else
        # Rollback to specific revision
        kubectl rollout undo deployment/$component --to-revision=$revision -n $NAMESPACE
    fi
    
    print_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/$component -n $NAMESPACE
    
    print_info "$component rolled back successfully"
}

show_menu() {
    echo ""
    print_info "========================================="
    print_info "Password Manager Rollback Menu"
    print_info "========================================="
    echo "1. Show backend rollout history"
    echo "2. Show frontend rollout history"
    echo "3. Rollback backend to previous version"
    echo "4. Rollback frontend to previous version"
    echo "5. Rollback backend to specific revision"
    echo "6. Rollback frontend to specific revision"
    echo "7. Rollback both backend and frontend"
    echo "8. Show current deployment status"
    echo "9. Exit"
    echo ""
}

main() {
    while true; do
        show_menu
        read -p "Select an option (1-9): " choice
        
        case $choice in
            1)
                show_rollout_history "backend"
                ;;
            2)
                show_rollout_history "frontend"
                ;;
            3)
                rollback_component "backend"
                ;;
            4)
                rollback_component "frontend"
                ;;
            5)
                show_rollout_history "backend"
                read -p "Enter revision number: " revision
                rollback_component "backend" "$revision"
                ;;
            6)
                show_rollout_history "frontend"
                read -p "Enter revision number: " revision
                rollback_component "frontend" "$revision"
                ;;
            7)
                print_warning "This will rollback both backend and frontend to previous versions"
                read -p "Are you sure? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    rollback_component "backend"
                    rollback_component "frontend"
                else
                    print_info "Rollback cancelled"
                fi
                ;;
            8)
                print_info "Current deployment status:"
                kubectl get deployments -n $NAMESPACE
                echo ""
                kubectl get pods -n $NAMESPACE
                ;;
            9)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-9."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

main
