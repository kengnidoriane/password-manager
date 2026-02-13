#!/bin/bash

# Test Alerting System Script
# This script tests various alert scenarios to verify the monitoring setup

set -e

NAMESPACE="monitoring"
APP_NAMESPACE="password-manager"
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Password Manager - Alerting System Test"
echo "========================================="
echo ""

# Function to print colored output
print_status() {
    if [ "$1" == "success" ]; then
        echo -e "${GREEN}✓ $2${NC}"
    elif [ "$1" == "error" ]; then
        echo -e "${RED}✗ $2${NC}"
    elif [ "$1" == "warning" ]; then
        echo -e "${YELLOW}⚠ $2${NC}"
    else
        echo "$2"
    fi
}

# Function to check if a pod is running
check_pod() {
    local app=$1
    local namespace=$2
    
    if kubectl get pods -n "$namespace" -l app="$app" | grep -q Running; then
        print_status "success" "$app is running"
        return 0
    else
        print_status "error" "$app is not running"
        return 1
    fi
}

# Function to wait for alert to fire
wait_for_alert() {
    local alert_name=$1
    local max_wait=$2
    local waited=0
    
    echo "Waiting for alert '$alert_name' to fire (max ${max_wait}s)..."
    
    while [ $waited -lt $max_wait ]; do
        if curl -s "$ALERTMANAGER_URL/api/v2/alerts" | grep -q "$alert_name"; then
            print_status "success" "Alert '$alert_name' fired"
            return 0
        fi
        sleep 5
        waited=$((waited + 5))
        echo -n "."
    done
    
    echo ""
    print_status "warning" "Alert '$alert_name' did not fire within ${max_wait}s"
    return 1
}

# Test 1: Check Monitoring Stack Components
echo "Test 1: Checking Monitoring Stack Components"
echo "---------------------------------------------"

check_pod "prometheus" "$NAMESPACE"
check_pod "grafana" "$NAMESPACE"
check_pod "alertmanager" "$NAMESPACE"
check_pod "elasticsearch" "$NAMESPACE"
check_pod "logstash" "$NAMESPACE"
check_pod "kibana" "$NAMESPACE"
check_pod "blackbox-exporter" "$NAMESPACE"

echo ""

# Test 2: Check Prometheus Targets
echo "Test 2: Checking Prometheus Targets"
echo "------------------------------------"

# Port forward Prometheus
kubectl port-forward -n "$NAMESPACE" svc/prometheus 9090:9090 > /dev/null 2>&1 &
PF_PROM_PID=$!
sleep 3

# Check if Prometheus is accessible
if curl -s "$PROMETHEUS_URL/-/healthy" > /dev/null; then
    print_status "success" "Prometheus is healthy"
    
    # Check targets
    targets=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | grep -o '"health":"up"' | wc -l)
    print_status "success" "Found $targets healthy targets"
else
    print_status "error" "Prometheus is not accessible"
fi

echo ""

# Test 3: Check Alertmanager
echo "Test 3: Checking Alertmanager"
echo "------------------------------"

# Port forward Alertmanager
kubectl port-forward -n "$NAMESPACE" svc/alertmanager 9093:9093 > /dev/null 2>&1 &
PF_AM_PID=$!
sleep 3

if curl -s "$ALERTMANAGER_URL/-/healthy" > /dev/null; then
    print_status "success" "Alertmanager is healthy"
    
    # Check alert receivers
    receivers=$(curl -s "$ALERTMANAGER_URL/api/v2/receivers" | grep -o '"name"' | wc -l)
    print_status "success" "Found $receivers alert receivers configured"
else
    print_status "error" "Alertmanager is not accessible"
fi

echo ""

# Test 4: Trigger Test Alerts
echo "Test 4: Triggering Test Alerts"
echo "-------------------------------"

# Test 4.1: Pod Not Ready Alert
echo "4.1: Testing PodNotReady alert..."
kubectl run test-alert-pod --image=busybox --restart=Never -n "$APP_NAMESPACE" -- sleep 10 > /dev/null 2>&1 || true
sleep 5
kubectl delete pod test-alert-pod -n "$APP_NAMESPACE" --force --grace-period=0 > /dev/null 2>&1 || true
print_status "success" "Triggered pod deletion (should fire PodNotReady alert)"

# Test 4.2: High Error Rate Alert (simulate)
echo "4.2: Testing HighErrorRate alert..."
print_status "warning" "Manual test required: Generate 500 errors via API to trigger alert"

# Test 4.3: High Response Time Alert (simulate)
echo "4.3: Testing HighResponseTime alert..."
print_status "warning" "Manual test required: Generate slow requests to trigger alert"

echo ""

# Test 5: Check Alert Rules
echo "Test 5: Checking Alert Rules"
echo "-----------------------------"

rules=$(curl -s "$PROMETHEUS_URL/api/v1/rules" | grep -o '"name"' | wc -l)
print_status "success" "Found $rules alert rules configured"

# List some key rules
echo "Key alert rules:"
curl -s "$PROMETHEUS_URL/api/v1/rules" | grep -o '"alert":"[^"]*"' | head -10

echo ""

# Test 6: Check Grafana Dashboards
echo "Test 6: Checking Grafana Dashboards"
echo "------------------------------------"

# Port forward Grafana
kubectl port-forward -n "$NAMESPACE" svc/grafana 3000:3000 > /dev/null 2>&1 &
PF_GRAFANA_PID=$!
sleep 3

if curl -s http://localhost:3000/api/health > /dev/null; then
    print_status "success" "Grafana is healthy"
    
    # Note: Checking dashboards requires authentication
    print_status "warning" "Dashboard check requires manual verification at http://localhost:3000"
else
    print_status "error" "Grafana is not accessible"
fi

echo ""

# Test 7: Check Elasticsearch
echo "Test 7: Checking Elasticsearch"
echo "-------------------------------"

# Port forward Elasticsearch
kubectl port-forward -n "$NAMESPACE" svc/elasticsearch-client 9200:9200 > /dev/null 2>&1 &
PF_ES_PID=$!
sleep 3

if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    health=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$health" == "green" ] || [ "$health" == "yellow" ]; then
        print_status "success" "Elasticsearch cluster health: $health"
    else
        print_status "error" "Elasticsearch cluster health: $health"
    fi
    
    # Check indices
    indices=$(curl -s http://localhost:9200/_cat/indices | grep password-manager | wc -l)
    print_status "success" "Found $indices password-manager indices"
else
    print_status "error" "Elasticsearch is not accessible"
fi

echo ""

# Test 8: Check Uptime Monitoring
echo "Test 8: Checking Uptime Monitoring"
echo "-----------------------------------"

if kubectl get probe -n "$NAMESPACE" > /dev/null 2>&1; then
    probes=$(kubectl get probe -n "$NAMESPACE" | grep -v NAME | wc -l)
    print_status "success" "Found $probes uptime monitoring probes"
else
    print_status "warning" "Probe CRD not found (requires Prometheus Operator)"
fi

echo ""

# Test 9: Check Exporters
echo "Test 9: Checking Exporters"
echo "--------------------------"

check_pod "postgres-exporter" "$NAMESPACE"
check_pod "redis-exporter" "$NAMESPACE"
check_pod "node-exporter" "$NAMESPACE"

echo ""

# Test 10: Verify Sentry Configuration
echo "Test 10: Checking Sentry Configuration"
echo "---------------------------------------"

if kubectl get configmap sentry-config-backend -n "$APP_NAMESPACE" > /dev/null 2>&1; then
    print_status "success" "Sentry backend configuration found"
else
    print_status "warning" "Sentry backend configuration not found"
fi

if kubectl get configmap sentry-config-frontend -n "$APP_NAMESPACE" > /dev/null 2>&1; then
    print_status "success" "Sentry frontend configuration found"
else
    print_status "warning" "Sentry frontend configuration not found"
fi

if kubectl get secret sentry-dsn -n "$APP_NAMESPACE" > /dev/null 2>&1; then
    print_status "success" "Sentry DSN secret found"
else
    print_status "warning" "Sentry DSN secret not found"
fi

echo ""

# Test 11: Check Active Alerts
echo "Test 11: Checking Active Alerts"
echo "--------------------------------"

active_alerts=$(curl -s "$ALERTMANAGER_URL/api/v2/alerts" | grep -o '"status":"firing"' | wc -l)

if [ "$active_alerts" -gt 0 ]; then
    print_status "warning" "Found $active_alerts active alerts"
    echo "Active alerts:"
    curl -s "$ALERTMANAGER_URL/api/v2/alerts" | grep -o '"alertname":"[^"]*"' | head -5
else
    print_status "success" "No active alerts (system healthy)"
fi

echo ""

# Test 12: Test Alert Silencing
echo "Test 12: Testing Alert Silencing"
echo "---------------------------------"

print_status "warning" "Manual test required: Create a silence in Alertmanager UI"
print_status "warning" "Visit: http://localhost:9093/#/silences"

echo ""

# Cleanup
echo "Cleaning up port forwards..."
kill $PF_PROM_PID $PF_AM_PID $PF_GRAFANA_PID $PF_ES_PID 2>/dev/null || true

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "Monitoring stack components are deployed and running."
echo ""
echo "Manual verification required:"
echo "1. Check Grafana dashboards: http://localhost:3000"
echo "2. Verify alert notifications (email, Slack, PagerDuty)"
echo "3. Test alert silencing in Alertmanager"
echo "4. Verify logs in Kibana: http://localhost:5601"
echo "5. Check Sentry error tracking in Sentry dashboard"
echo ""
echo "To access services:"
echo "  Prometheus:    kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "  Grafana:       kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "  Alertmanager:  kubectl port-forward -n monitoring svc/alertmanager 9093:9093"
echo "  Kibana:        kubectl port-forward -n monitoring svc/kibana 5601:5601"
echo ""
print_status "success" "Alerting system test completed!"
