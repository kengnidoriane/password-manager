#!/bin/bash

# Accessibility Testing Script for Password Manager
# This script runs all accessibility-related tests and checks

set -e

echo "🔍 Running Accessibility Tests for Password Manager"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_status "$BLUE" "Running: $test_name"
    
    if eval "$test_command"; then
        print_status "$GREEN" "✓ $test_name passed"
        return 0
    else
        print_status "$RED" "✗ $test_name failed"
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: ARIA Labels Property Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "ARIA Labels Property Test" "npm test -- aria-labels.property.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 2: Keyboard Navigation Property Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Keyboard Navigation Property Test" "npm test -- keyboard-navigation.property.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 3: WCAG Contrast Property Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "WCAG Contrast Property Test" "npm test -- wcag-contrast.property.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 4: Form Label Association Property Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Form Label Association Property Test" "npm test -- form-label-association.property.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 5: Multi-Modal Feedback Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Multi-Modal Feedback Test" "npm test -- multi-modal-feedback.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 6: Screen Reader Service Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Screen Reader Service Test" "npm test -- screenReaderService.test.ts --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 7: Responsive Layout Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Responsive Layout Property Test" "npm test -- responsive.property.test.tsx --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Summary
echo ""
echo "=================================================="
print_status "$BLUE" "Accessibility Test Summary"
echo "=================================================="
echo "Total Tests: $TOTAL_TESTS"
print_status "$GREEN" "Passed: $PASSED_TESTS"
if [ $FAILED_TESTS -gt 0 ]; then
    print_status "$RED" "Failed: $FAILED_TESTS"
else
    print_status "$GREEN" "Failed: $FAILED_TESTS"
fi
echo ""

# Manual Testing Reminders
print_status "$YELLOW" "⚠️  Manual Testing Required:"
echo "  1. Test with NVDA screen reader (Windows)"
echo "  2. Test with JAWS screen reader (Windows)"
echo "  3. Test with VoiceOver (macOS/iOS)"
echo "  4. Test with TalkBack (Android)"
echo "  5. Test keyboard-only navigation"
echo "  6. Test with browser zoom at 200%"
echo "  7. Test with high contrast mode"
echo ""
print_status "$BLUE" "📖 See ASSISTIVE_TECHNOLOGY_TESTING.md for detailed instructions"
echo ""

# Documentation Check
print_status "$BLUE" "📄 Accessibility Documentation:"
echo "  - ACCESSIBILITY.md"
echo "  - KEYBOARD_NAVIGATION.md"
echo "  - WCAG_CONTRAST_COMPLIANCE.md"
echo "  - ACCESSIBLE_FORMS.md"
echo "  - MULTI_MODAL_FEEDBACK.md"
echo "  - ASSISTIVE_TECHNOLOGY_TESTING.md"
echo "  - SCREEN_READER_QUICK_REFERENCE.md"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    print_status "$RED" "❌ Some accessibility tests failed"
    exit 1
else
    print_status "$GREEN" "✅ All automated accessibility tests passed!"
    print_status "$YELLOW" "⚠️  Remember to complete manual testing with assistive technologies"
    exit 0
fi
