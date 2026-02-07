@echo off
REM Accessibility Testing Script for Password Manager (Windows)
REM This script runs all accessibility-related tests and checks

setlocal enabledelayedexpansion

echo.
echo Running Accessibility Tests for Password Manager
echo ==================================================
echo.

set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

REM Test 1: ARIA Labels Property Test
set /a TOTAL_TESTS+=1
echo [34mRunning: ARIA Labels Property Test[0m
call npm test -- aria-labels.property.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ ARIA Labels Property Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ ARIA Labels Property Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 2: Keyboard Navigation Property Test
set /a TOTAL_TESTS+=1
echo [34mRunning: Keyboard Navigation Property Test[0m
call npm test -- keyboard-navigation.property.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Keyboard Navigation Property Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Keyboard Navigation Property Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 3: WCAG Contrast Property Test
set /a TOTAL_TESTS+=1
echo [34mRunning: WCAG Contrast Property Test[0m
call npm test -- wcag-contrast.property.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ WCAG Contrast Property Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ WCAG Contrast Property Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 4: Form Label Association Property Test
set /a TOTAL_TESTS+=1
echo [34mRunning: Form Label Association Property Test[0m
call npm test -- form-label-association.property.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Form Label Association Property Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Form Label Association Property Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 5: Multi-Modal Feedback Test
set /a TOTAL_TESTS+=1
echo [34mRunning: Multi-Modal Feedback Test[0m
call npm test -- multi-modal-feedback.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Multi-Modal Feedback Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Multi-Modal Feedback Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 6: Screen Reader Service Test
set /a TOTAL_TESTS+=1
echo [34mRunning: Screen Reader Service Test[0m
call npm test -- screenReaderService.test.ts --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Screen Reader Service Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Screen Reader Service Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Test 7: Responsive Layout Test
set /a TOTAL_TESTS+=1
echo [34mRunning: Responsive Layout Property Test[0m
call npm test -- responsive.property.test.tsx --run
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Responsive Layout Property Test passed[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Responsive Layout Property Test failed[0m
    set /a FAILED_TESTS+=1
)
echo.

REM Summary
echo.
echo ==================================================
echo Accessibility Test Summary
echo ==================================================
echo Total Tests: %TOTAL_TESTS%
echo Passed: %PASSED_TESTS%
echo Failed: %FAILED_TESTS%
echo.

REM Manual Testing Reminders
echo [33m⚠️  Manual Testing Required:[0m
echo   1. Test with NVDA screen reader (Windows)
echo   2. Test with JAWS screen reader (Windows)
echo   3. Test with VoiceOver (macOS/iOS)
echo   4. Test with TalkBack (Android)
echo   5. Test keyboard-only navigation
echo   6. Test with browser zoom at 200%%
echo   7. Test with high contrast mode
echo.
echo [34m📖 See ASSISTIVE_TECHNOLOGY_TESTING.md for detailed instructions[0m
echo.

REM Documentation Check
echo [34m📄 Accessibility Documentation:[0m
echo   - ACCESSIBILITY.md
echo   - KEYBOARD_NAVIGATION.md
echo   - WCAG_CONTRAST_COMPLIANCE.md
echo   - ACCESSIBLE_FORMS.md
echo   - MULTI_MODAL_FEEDBACK.md
echo   - ASSISTIVE_TECHNOLOGY_TESTING.md
echo   - SCREEN_READER_QUICK_REFERENCE.md
echo.

REM Exit with appropriate code
if %FAILED_TESTS% GTR 0 (
    echo [31m❌ Some accessibility tests failed[0m
    exit /b 1
) else (
    echo [32m✅ All automated accessibility tests passed![0m
    echo [33m⚠️  Remember to complete manual testing with assistive technologies[0m
    exit /b 0
)
