#!/bin/bash

# Password Manager - Deployment Verification Script
# Verifies all features work correctly after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="${1:-password-manager}"
ENVIRONMENT="${2:-staging}"

# Verification counters
CHECKS_RUN=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
print_check() {
    echo -e "${YELLOW}[CHECK]${NC} $1"
    ((CHECKS_RUN++))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check 1: All pods are running
check_pods() {
    print_check "Verifying all pods are running..."
    
    not_running=$(kubectl get pods -n $NAMESPACE --no-headers | grep -v "Running" | wc -l)
    
    if [ "$not_running" -eq 0 ]; then
        print_pass "All pods are running"
        kubectl get pods -n $NAMESPACE
    else
        print_fail "$not_running pods are not running"
        kubectl get pods -n $NAMESPACE
    fi
}

# Check 2: All deployments are available
check_deployments() {
    print_check "Verifying all deployments are available..."
    
    deployments=$(kubectl get deployments -n $NAMESPACE -o json | jq -r '.items[] | select(.status.availableReplicas != .status.replicas) | .metadata.name')
    
    if [ -z "$deployments" ]; then
        print_pass "All deployments are available"
    else
        print_fail "Some deployments are not fully available: $deployments"
    fi
}

# Check 3: Services have endpoints
check_services() {
    print_check "Verifying services have endpoints..."
    
    services=$(kubectl get svc -n $NAMESPACE -o json | jq -r '.items[].metadata.name')
    
    for svc in $services; do
        endpoints=$(kubectl get endpoints $svc -n $NAMESPACE -o json | jq -r '.subsets[].addresses | length')
        if [ "$endpoints" -gt 0 ] 2>/dev/null; then
            print_pass "Service $svc has $endpoints endpoint(s)"
        else
            print_fail "Service $svc has no endpoints"
        fi
    done
}

# Check 4: Ingress is configured
check_ingress() {
    print_check "Verifying ingress configuration..."
    
    ingress_count=$(kubectl get ingress -n $NAMESPACE --no-headers | wc -l)
    
    if [ "$ingress_count" -gt 0 ]; then
        print_pass "Ingress is configured"
        kubectl get ingress -n $NAMESPACE
    else
        print_fail "No ingress found"
    fi
}

# Check 5: TLS secrets exist
check_tls_secrets() {
    print_check "Verifying TLS secrets..."
    
    tls_secrets=$(kubectl get secrets -n $NAMESPACE -o json | jq -r '.items[] | select(.type=="kubernetes.io/tls") | .metadata.name')
    
    if [ -n "$tls_secrets" ]; then
        print_pass "TLS secrets found: $tls_secrets"
    else
        print_fail "No TLS secrets found"
    fi
}

# Check 6: ConfigMaps exist
check_configmaps() {
    print_check "Verifying ConfigMaps..."
    
    configmaps=$(kubectl get configmaps -n $NAMESPACE --no-headers | wc -l)
    
    if [ "$configmaps" -gt 0 ]; then
        print_pass "$configmaps ConfigMap(s) found"
    else
        print_fail "No ConfigMaps found"
    fi
}

# Check 7: Secrets exist
check_secrets() {
    print_check "Verifying Secrets..."
    
    secrets=$(kubectl get secrets -n $NAMESPACE --no-headers | grep -v "default-token" | wc -l)
    
    if [ "$secrets" -gt 0 ]; then
        print_pass "$secrets Secret(s) found"
    else
        print_fail "No Secrets found"
    fi
}

# Check 8: HPA is configured
check_hpa() {
    print_check "Verifying HorizontalPodAutoscalers..."
    
    hpa_count=$(kubectl get hpa -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    
    if [ "$hpa_count" -gt 0 ]; then
        print_pass "$hpa_count HPA(s) configured"
        kubectl get hpa -n $NAMESPACE
    else
        print_fail "No HPAs found"
    fi
}

# Check 9: PDB is configured
check_pdb() {
    print_check "Verifying PodDisruptionBudgets..."
    
    pdb_count=$(kubectl get pdb -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    
    if [ "$pdb_count" -gt 0 ]; then
        print_pass "$pdb_count PDB(s) configured"
    else
        print_fail "No PDBs found"
    fi
}

# Check 10: Resource limits are set
check_resource_limits() {
    print_check "Verifying resource limits..."
    
    pods_without_limits=$(kubectl get pods -n $NAMESPACE -o json | jq -r '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name')
    
    if [ -z "$pods_without_limits" ]; then
        print_pass "All pods have resource limits"
    else
        print_fail "Some pods don't have resource limits: $pods_without_limits"
    fi
}

# Check 11: Persistent volumes are bound
check_pvs() {
    print_check "Verifying persistent volumes..."
    
    pvcs=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    
    if [ "$pvcs" -gt 0 ]; then
        unbound=$(kubectl get pvc -n $NAMESPACE --no-headers | grep -v "Bound" | wc -l)
        if [ "$unbound" -eq 0 ]; then
            print_pass "All $pvcs PVC(s) are bound"
        else
            print_fail "$unbound PVC(s) are not bound"
        fi
    else
        print_pass "No PVCs (stateless deployment)"
    fi
}

# Check 12: No pods are restarting frequently
check_restarts() {
    print_check "Checking for frequent pod restarts..."
    
    high_restarts=$(kubectl get pods -n $NAMESPACE --no-headers | awk '{if ($4 > 5) print $1}')
    
    if [ -z "$high_restarts" ]; then
        print_pass "No pods with excessive restarts"
    else
        print_fail "Pods with high restart count: $high_restarts"
    fi
}

# Check 13: Check pod logs for errors
check_logs() {
    print_check "Checking recent logs for errors..."
    
    pods=$(kubectl get pods -n $NAMESPACE -o json | jq -r '.items[].metadata.name')
    
    error_count=0
    for pod in $pods; do
        errors=$(kubectl logs --tail=100 $pod -n $NAMESPACE 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l)
        if [ "$errors" -gt 10 ]; then
            print_fail "Pod $pod has $errors error messages in recent logs"
            ((error_count++))
        fi
    done
    
    if [ "$error_count" -eq 0 ]; then
        print_pass "No excessive errors in pod logs"
    fi
}

# Check 14: Network policies
check_network_policies() {
    print_check "Verifying network policies..."
    
    netpol_count=$(kubectl get networkpolicies -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    
    if [ "$netpol_count" -gt 0 ]; then
        print_pass "$netpol_count network policy(ies) configured"
    else
        print_fail "No network policies found"
    fi
}

# Check 15: Resource quotas
check_resource_quotas() {
    print_check "Verifying resource quotas..."
    
    quota_count=$(kubectl get resourcequotas -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    
    if [ "$quota_count" -gt 0 ]; then
        print_pass "$quota_count resource quota(s) configured"
        kubectl describe resourcequotas -n $NAMESPACE
    else
        print_fail "No resource quotas found"
    fi
}

# Check 16: Monitoring (ServiceMonitor)
check_monitoring() {
    print_check "Verifying monitoring configuration..."
    
    if kubectl get crd servicemonitors.monitoring.coreos.com &> /dev/null; then
        sm_count=$(kubectl get servicemonitors -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
        if [ "$sm_count" -gt 0 ]; then
            print_pass "$sm_count ServiceMonitor(s) configured"
        else
            print_fail "No ServiceMonitors found"
        fi
    else
        print_pass "Prometheus Operator not installed (monitoring optional)"
    fi
}

# Check 17: Database connectivity from backend
check_database_connectivity() {
    print_check "Verifying database connectivity from backend..."
    
    backend_pod=$(kubectl get pods -n $NAMESPACE -l component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$backend_pod" ]; then
        db_check=$(kubectl exec $backend_pod -n $NAMESPACE -- curl -s http://localhost:8080/actuator/health 2>/dev/null | grep -o '"db":{"status":"UP"')
        if [ -n "$db_check" ]; then
            print_pass "Backend can connect to database"
        else
            print_fail "Backend cannot connect to database"
        fi
    else
        print_fail "Backend pod not found"
    fi
}

# Check 18: Redis connectivity from backend
check_redis_connectivity() {
    print_check "Verifying Redis connectivity from backend..."
    
    backend_pod=$(kubectl get pods -n $NAMESPACE -l component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$backend_pod" ]; then
        redis_check=$(kubectl exec $backend_pod -n $NAMESPACE -- curl -s http://localhost:8080/actuator/health 2>/dev/null | grep -o '"redis":{"status":"UP"')
        if [ -n "$redis_check" ]; then
            print_pass "Backend can connect to Redis"
        else
            print_fail "Backend cannot connect to Redis"
        fi
    else
        print_fail "Backend pod not found"
    fi
}

# Check 19: Frontend can reach backend
check_frontend_backend() {
    print_check "Verifying frontend can reach backend..."
    
    frontend_pod=$(kubectl get pods -n $NAMESPACE -l component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$frontend_pod" ]; then
        backend_svc=$(kubectl get svc -n $NAMESPACE -l component=backend -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$backend_svc" ]; then
            backend_check=$(kubectl exec $frontend_pod -n $NAMESPACE -- wget -q -O- http://$backend_svc:8080/actuator/health 2>/dev/null | grep -o '"status":"UP"')
            if [ -n "$backend_check" ]; then
                print_pass "Frontend can reach backend service"
            else
                print_fail "Frontend cannot reach backend service"
            fi
        fi
    else
        print_fail "Frontend pod not found"
    fi
}

# Check 20: Resource usage
check_resource_usage() {
    print_check "Checking resource usage..."
    
    if kubectl top pods -n $NAMESPACE &> /dev/null; then
        print_pass "Resource metrics available"
        kubectl top pods -n $NAMESPACE
    else
        print_fail "Resource metrics not available (metrics-server may not be installed)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "========================================="
    echo "Deployment Verification Summary"
    echo "========================================="
    echo "Namespace: $NAMESPACE"
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "Checks Run: $CHECKS_RUN"
    echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
    echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All verification checks passed!${NC}"
        echo "Deployment is healthy and ready for use."
        exit 0
    else
        echo -e "${RED}Some verification checks failed!${NC}"
        echo "Please review the failed checks and take corrective action."
        exit 1
    fi
}

# Main execution
main() {
    echo "========================================="
    echo "Password Manager - Deployment Verification"
    echo "========================================="
    echo ""
    
    print_info "Verifying deployment in namespace: $NAMESPACE"
    print_info "Environment: $ENVIRONMENT"
    echo ""
    
    # Run all checks
    check_pods
    check_deployments
    check_services
    check_ingress
    check_tls_secrets
    check_configmaps
    check_secrets
    check_hpa
    check_pdb
    check_resource_limits
    check_pvs
    check_restarts
    check_logs
    check_network_policies
    check_resource_quotas
    check_monitoring
    check_database_connectivity
    check_redis_connectivity
    check_frontend_backend
    check_resource_usage
    
    print_summary
}

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} kubectl is not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} jq is not installed"
    exit 1
fi

# Run main
main
