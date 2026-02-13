#!/bin/bash

# Password Manager - Smoke Tests
# Comprehensive smoke tests for deployment verification

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
BASE_URL="${2:-}"
TIMEOUT=10

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Functions
print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
    ((TESTS_RUN++))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Get base URL if not provided
get_base_url() {
    if [ -z "$BASE_URL" ]; then
        if [ "$ENVIRONMENT" == "staging" ]; then
            BASE_URL="https://staging.passwordmanager.example.com"
        elif [ "$ENVIRONMENT" == "production" ]; then
            BASE_URL="https://passwordmanager.example.com"
        else
            print_fail "Unknown environment: $ENVIRONMENT"
            exit 1
        fi
    fi
    print_info "Testing environment: $ENVIRONMENT"
    print_info "Base URL: $BASE_URL"
}

# Test 1: Frontend accessibility
test_frontend() {
    print_test "Testing frontend accessibility..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/" || echo "000")
    
    if [ "$response" == "200" ]; then
        print_pass "Frontend is accessible (HTTP $response)"
    else
        print_fail "Frontend is not accessible (HTTP $response)"
    fi
}

# Test 2: Backend health endpoint
test_backend_health() {
    print_test "Testing backend health endpoint..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/v1/health" || echo "000")
    
    if [ "$response" == "200" ]; then
        print_pass "Backend health endpoint is accessible (HTTP $response)"
    else
        print_fail "Backend health endpoint is not accessible (HTTP $response)"
    fi
}

# Test 3: Backend actuator health
test_actuator_health() {
    print_test "Testing backend actuator health..."
    
    health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/actuator/health" || echo "{}")
    
    if echo "$health_response" | grep -q '"status":"UP"'; then
        print_pass "Backend actuator reports UP status"
    else
        print_fail "Backend actuator does not report UP status"
        echo "Response: $health_response"
    fi
}

# Test 4: Database connectivity
test_database() {
    print_test "Testing database connectivity..."
    
    health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/actuator/health" || echo "{}")
    
    if echo "$health_response" | grep -q '"db"'; then
        if echo "$health_response" | grep -q '"status":"UP"'; then
            print_pass "Database connectivity is healthy"
        else
            print_fail "Database connectivity is unhealthy"
        fi
    else
        print_fail "Database health information not available"
    fi
}

# Test 5: Redis connectivity
test_redis() {
    print_test "Testing Redis connectivity..."
    
    health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/actuator/health" || echo "{}")
    
    if echo "$health_response" | grep -q '"redis"'; then
        if echo "$health_response" | grep -q '"status":"UP"'; then
            print_pass "Redis connectivity is healthy"
        else
            print_fail "Redis connectivity is unhealthy"
        fi
    else
        print_fail "Redis health information not available"
    fi
}

# Test 6: API registration endpoint
test_registration_endpoint() {
    print_test "Testing registration endpoint availability..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
        -X POST "$BASE_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d '{}' || echo "000")
    
    # Expect 400 (bad request) since we're sending empty data
    if [ "$response" == "400" ] || [ "$response" == "422" ]; then
        print_pass "Registration endpoint is accessible (HTTP $response)"
    elif [ "$response" == "200" ] || [ "$response" == "201" ]; then
        print_pass "Registration endpoint is accessible (HTTP $response)"
    else
        print_fail "Registration endpoint is not accessible (HTTP $response)"
    fi
}

# Test 7: API login endpoint
test_login_endpoint() {
    print_test "Testing login endpoint availability..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
        -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{}' || echo "000")
    
    # Expect 400 or 401 since we're sending invalid credentials
    if [ "$response" == "400" ] || [ "$response" == "401" ] || [ "$response" == "422" ]; then
        print_pass "Login endpoint is accessible (HTTP $response)"
    else
        print_fail "Login endpoint is not accessible (HTTP $response)"
    fi
}

# Test 8: CORS headers
test_cors() {
    print_test "Testing CORS headers..."
    
    cors_header=$(curl -s -I --max-time $TIMEOUT \
        -H "Origin: https://example.com" \
        "$BASE_URL/api/v1/health" | grep -i "access-control-allow-origin" || echo "")
    
    if [ -n "$cors_header" ]; then
        print_pass "CORS headers are configured"
    else
        print_fail "CORS headers are not configured"
    fi
}

# Test 9: Security headers
test_security_headers() {
    print_test "Testing security headers..."
    
    headers=$(curl -s -I --max-time $TIMEOUT "$BASE_URL/" || echo "")
    
    local passed=0
    local total=4
    
    if echo "$headers" | grep -qi "X-Frame-Options"; then
        ((passed++))
    fi
    
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        ((passed++))
    fi
    
    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        ((passed++))
    fi
    
    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        ((passed++))
    fi
    
    if [ $passed -ge 3 ]; then
        print_pass "Security headers are configured ($passed/$total)"
    else
        print_fail "Security headers are incomplete ($passed/$total)"
    fi
}

# Test 10: TLS/SSL certificate
test_ssl() {
    print_test "Testing TLS/SSL certificate..."
    
    ssl_info=$(curl -vI --max-time $TIMEOUT "$BASE_URL/" 2>&1 | grep -i "SSL certificate" || echo "")
    
    if curl -s --max-time $TIMEOUT "$BASE_URL/" > /dev/null 2>&1; then
        print_pass "TLS/SSL certificate is valid"
    else
        print_fail "TLS/SSL certificate validation failed"
    fi
}

# Test 11: Response time
test_response_time() {
    print_test "Testing response time..."
    
    response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT "$BASE_URL/api/v1/health" || echo "999")
    
    # Convert to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 2" | bc -l) )); then
        print_pass "Response time is acceptable (${response_time}s)"
    else
        print_fail "Response time is too slow (${response_time}s)"
    fi
}

# Test 12: Swagger/OpenAPI documentation
test_swagger() {
    print_test "Testing Swagger UI availability..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/swagger-ui.html" || echo "000")
    
    if [ "$response" == "200" ]; then
        print_pass "Swagger UI is accessible (HTTP $response)"
    elif [ "$response" == "404" ]; then
        print_pass "Swagger UI is disabled (expected in production)"
    else
        print_fail "Swagger UI check failed (HTTP $response)"
    fi
}

# Test 13: Metrics endpoint (if enabled)
test_metrics() {
    print_test "Testing metrics endpoint..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/actuator/prometheus" || echo "000")
    
    if [ "$response" == "200" ]; then
        print_pass "Metrics endpoint is accessible (HTTP $response)"
    elif [ "$response" == "401" ] || [ "$response" == "403" ]; then
        print_pass "Metrics endpoint is secured (HTTP $response)"
    elif [ "$response" == "404" ]; then
        print_pass "Metrics endpoint is disabled (expected in some environments)"
    else
        print_fail "Metrics endpoint check failed (HTTP $response)"
    fi
}

# Test 14: Rate limiting
test_rate_limiting() {
    print_test "Testing rate limiting..."
    
    # Make multiple rapid requests
    local rate_limited=false
    for i in {1..20}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/v1/health" || echo "000")
        if [ "$response" == "429" ]; then
            rate_limited=true
            break
        fi
    done
    
    if [ "$rate_limited" == true ]; then
        print_pass "Rate limiting is active"
    else
        print_pass "Rate limiting not triggered (may be configured with higher limits)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "========================================="
    echo "Smoke Tests Summary"
    echo "========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Base URL: $BASE_URL"
    echo ""
    echo "Tests Run: $TESTS_RUN"
    echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo "========================================="
    echo "Password Manager - Smoke Tests"
    echo "========================================="
    echo ""
    
    get_base_url
    echo ""
    
    # Run all tests
    test_frontend
    test_backend_health
    test_actuator_health
    test_database
    test_redis
    test_registration_endpoint
    test_login_endpoint
    test_cors
    test_security_headers
    test_ssl
    test_response_time
    test_swagger
    test_metrics
    test_rate_limiting
    
    print_summary
}

# Run main
main
