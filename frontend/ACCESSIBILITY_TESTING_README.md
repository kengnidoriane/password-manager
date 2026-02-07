# Accessibility Testing - Complete Guide

This document provides a complete guide for accessibility testing of the Password Manager application, including both automated and manual testing with assistive technologies.

## Table of Contents

1. [Overview](#overview)
2. [Automated Testing](#automated-testing)
3. [Manual Testing](#manual-testing)
4. [Screen Reader Testing](#screen-reader-testing)
5. [Documentation](#documentation)
6. [Issue Tracking](#issue-tracking)
7. [Compliance](#compliance)

## Overview

The Password Manager implements comprehensive accessibility features to ensure compliance with WCAG 2.1 AA standards and Requirements 20.1-20.2:

- **Requirement 20.1**: ARIA labels for all interactive elements
- **Requirement 20.2**: Full keyboard navigation support

### Accessibility Features Implemented

✅ ARIA labels for all interactive elements
✅ Semantic HTML structure
✅ ARIA live regions for dynamic content
✅ Full keyboard navigation
✅ Visible focus indicators
✅ Skip navigation links
✅ Keyboard shortcuts
✅ WCAG 2.1 AA contrast compliance
✅ Accessible forms with proper labels
✅ Multi-modal feedback (visual, textual, auditory)
✅ Screen reader compatibility
✅ Responsive design with appropriate touch targets

## Automated Testing

### Running All Accessibility Tests

```bash
# Run all accessibility tests
npm run test:a11y

# Run with watch mode
npm run test:a11y:watch

# Run specific test
npm test -- aria-labels.property.test.tsx --run
```

### Using Test Scripts

**Linux/macOS:**
```bash
chmod +x scripts/test-accessibility.sh
./scripts/test-accessibility.sh
```

**Windows:**
```cmd
scripts\test-accessibility.bat
```

### Automated Test Coverage

The following property-based tests validate accessibility:

1. **ARIA Labels** (`aria-labels.property.test.tsx`)
   - Verifies all interactive elements have accessible labels
   - Checks semantic HTML usage
   - Validates ARIA live regions

2. **Keyboard Navigation** (`keyboard-navigation.property.test.tsx`)
   - Verifies all elements are keyboard accessible
   - Checks focus indicators are visible
   - Validates tab order
   - Ensures no keyboard traps

3. **WCAG Contrast** (`wcag-contrast.property.test.tsx`)
   - Validates text contrast ratios (4.5:1 for normal text)
   - Checks focus indicator contrast (3:1 minimum)
   - Tests dark mode and high contrast themes

4. **Form Labels** (`form-label-association.property.test.tsx`)
   - Verifies all inputs have associated labels
   - Checks required field indicators
   - Validates error message accessibility

5. **Multi-Modal Feedback** (`multi-modal-feedback.test.tsx`)
   - Tests screen reader announcements
   - Validates visual and textual feedback
   - Checks status indicators

6. **Screen Reader Service** (`screenReaderService.test.ts`)
   - Tests announcement functionality
   - Validates ARIA live region creation
   - Checks message prioritization

7. **Responsive Layout** (`responsive.property.test.tsx`)
   - Validates touch target sizes (44x44 pixels minimum)
   - Checks responsive behavior
   - Tests orientation changes

### Running Individual Tests

```bash
# ARIA labels
npm test -- aria-labels.property.test.tsx --run

# Keyboard navigation
npm test -- keyboard-navigation.property.test.tsx --run

# WCAG contrast
npm test -- wcag-contrast.property.test.tsx --run

# Form labels
npm test -- form-label-association.property.test.tsx --run

# Multi-modal feedback
npm test -- multi-modal-feedback.test.tsx --run

# Screen reader service
npm test -- screenReaderService.test.ts --run

# Responsive layout
npm test -- responsive.property.test.tsx --run
```

## Manual Testing

### Keyboard-Only Testing

Before using screen readers, test with keyboard only:

1. **Tab Navigation**
   - Press `Tab` to navigate forward
   - Press `Shift + Tab` to navigate backward
   - Verify all interactive elements are reachable
   - Check focus indicators are visible

2. **Keyboard Shortcuts**
   - `/` - Focus search
   - `Ctrl + N` - New credential
   - `Ctrl + G` - Open password generator
   - `Ctrl + S` - Open settings
   - `Escape` - Close modal/dialog
   - `?` - Show keyboard shortcuts help

3. **Skip Navigation**
   - Press `Tab` on page load
   - Verify skip links appear
   - Test each skip link

4. **Form Interaction**
   - Navigate through forms with `Tab`
   - Submit with `Enter`
   - Verify validation errors are visible

### Browser Testing

Test in multiple browsers:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Zoom Testing

Test with browser zoom:
- 100% (default)
- 150%
- 200%
- 400%

Verify:
- Content remains readable
- Layout doesn't break
- No horizontal scrolling (except at 400%)
- Interactive elements remain accessible

### High Contrast Mode

**Windows:**
1. Settings → Accessibility → Contrast themes
2. Select a high contrast theme
3. Test application

**macOS:**
1. System Preferences → Accessibility → Display
2. Enable "Increase contrast"
3. Test application

## Screen Reader Testing

### Required Screen Readers

- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

### Quick Start Guides

See [SCREEN_READER_QUICK_REFERENCE.md](./SCREEN_READER_QUICK_REFERENCE.md) for:
- Installation instructions
- Basic keyboard shortcuts
- Common testing patterns
- Quick fixes for common issues

### Comprehensive Testing Guide

See [ASSISTIVE_TECHNOLOGY_TESTING.md](./ASSISTIVE_TECHNOLOGY_TESTING.md) for:
- Detailed testing procedures
- Complete checklists for each page
- Screen reader-specific instructions
- Issue documentation templates

### Testing Workflow

1. **Preparation**
   - Install required screen readers
   - Configure browser settings
   - Prepare test account

2. **Keyboard Testing**
   - Test with keyboard only first
   - Verify all functionality accessible
   - Check focus indicators

3. **Screen Reader Testing**
   - Test with each screen reader
   - Follow comprehensive checklist
   - Document issues found

4. **Documentation**
   - Record test results in [ASSISTIVE_TECHNOLOGY_TEST_RESULTS.md](./ASSISTIVE_TECHNOLOGY_TEST_RESULTS.md)
   - Create issues for problems found
   - Track fixes and re-testing

## Documentation

### Available Documentation

1. **[ACCESSIBILITY.md](./ACCESSIBILITY.md)**
   - ARIA labels implementation
   - Semantic HTML usage
   - ARIA live regions
   - Best practices

2. **[KEYBOARD_NAVIGATION.md](./KEYBOARD_NAVIGATION.md)**
   - Keyboard accessibility features
   - Focus indicators
   - Skip navigation
   - Keyboard shortcuts

3. **[WCAG_CONTRAST_COMPLIANCE.md](./WCAG_CONTRAST_COMPLIANCE.md)**
   - Color system
   - Contrast ratios
   - High contrast mode
   - Testing utilities

4. **[ACCESSIBLE_FORMS.md](./ACCESSIBLE_FORMS.md)**
   - Form accessibility
   - Label association
   - Error handling
   - Validation

5. **[MULTI_MODAL_FEEDBACK.md](./MULTI_MODAL_FEEDBACK.md)**
   - Visual feedback
   - Textual feedback
   - Screen reader announcements
   - Status indicators

6. **[ASSISTIVE_TECHNOLOGY_TESTING.md](./ASSISTIVE_TECHNOLOGY_TESTING.md)**
   - Comprehensive testing guide
   - Screen reader instructions
   - Testing checklists
   - Issue templates

7. **[SCREEN_READER_QUICK_REFERENCE.md](./SCREEN_READER_QUICK_REFERENCE.md)**
   - Quick start guide
   - Keyboard shortcuts
   - Common issues and fixes
   - Testing tips

8. **[ASSISTIVE_TECHNOLOGY_TEST_RESULTS.md](./ASSISTIVE_TECHNOLOGY_TEST_RESULTS.md)**
   - Test results tracking
   - Issue documentation
   - Compliance status
   - Sign-off template

## Issue Tracking

### Creating Accessibility Issues

Use the accessibility issue template:

1. Go to GitHub Issues
2. Click "New Issue"
3. Select "Accessibility Issue" template
4. Fill in all required fields:
   - Screen reader/assistive technology
   - Browser & OS
   - Priority level
   - WCAG criterion
   - Steps to reproduce
   - Expected vs actual behavior

### Issue Priority Levels

- **Critical**: Blocks core functionality, must fix immediately
- **High**: Significantly impacts usability, fix in current sprint
- **Medium**: Impacts usability but has workaround, fix in next sprint
- **Low**: Minor issue or enhancement, fix when possible

### Issue Labels

- `accessibility` - All accessibility issues
- `screen-reader` - Screen reader specific issues
- `keyboard` - Keyboard navigation issues
- `wcag-a` - WCAG Level A violations
- `wcag-aa` - WCAG Level AA violations
- `wcag-aaa` - WCAG Level AAA violations

## Compliance

### WCAG 2.1 AA Requirements

The application aims to meet WCAG 2.1 Level AA compliance:

#### Level A (Must Meet)
- ✅ 1.1.1 Non-text Content
- ✅ 1.3.1 Info and Relationships
- ✅ 2.1.1 Keyboard
- ✅ 2.1.2 No Keyboard Trap
- ✅ 2.4.1 Bypass Blocks
- ✅ 2.4.3 Focus Order
- ✅ 3.3.1 Error Identification
- ✅ 3.3.2 Labels or Instructions
- ✅ 4.1.2 Name, Role, Value

#### Level AA (Must Meet)
- ✅ 1.4.3 Contrast (Minimum)
- ✅ 2.4.7 Focus Visible
- ✅ 3.3.3 Error Suggestion
- ✅ 4.1.3 Status Messages

### Requirements Compliance

- ✅ **Requirement 20.1**: ARIA labels for all interactive elements
- ✅ **Requirement 20.2**: Full keyboard navigation support
- ✅ **Requirement 20.3**: WCAG 2.1 AA contrast ratios
- ✅ **Requirement 20.4**: Multi-modal feedback
- ✅ **Requirement 20.5**: Accessible forms

### Testing Status

| Test Type | Status | Last Tested |
|-----------|--------|-------------|
| Automated Tests | ✅ Passing | [Date] |
| NVDA (Windows) | ⏳ Pending | - |
| JAWS (Windows) | ⏳ Pending | - |
| VoiceOver (macOS) | ⏳ Pending | - |
| VoiceOver (iOS) | ⏳ Pending | - |
| TalkBack (Android) | ⏳ Pending | - |
| Keyboard Only | ⏳ Pending | - |
| Browser Zoom | ⏳ Pending | - |
| High Contrast | ⏳ Pending | - |

## Next Steps

### Immediate Actions

1. ✅ Complete automated testing setup
2. ✅ Create comprehensive documentation
3. ⏳ Conduct NVDA testing (Windows)
4. ⏳ Conduct JAWS testing (Windows)
5. ⏳ Conduct VoiceOver testing (macOS)
6. ⏳ Conduct VoiceOver testing (iOS)
7. ⏳ Conduct TalkBack testing (Android)
8. ⏳ Document all issues found
9. ⏳ Fix critical and high priority issues
10. ⏳ Re-test after fixes
11. ⏳ Obtain final sign-off

### Ongoing Maintenance

- Run automated tests on every commit
- Test new features with screen readers
- Update documentation as needed
- Review accessibility in code reviews
- Conduct periodic accessibility audits

## Resources

### Tools

- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools

### Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Training

- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Deque University](https://dequeuniversity.com/)
- [W3C Web Accessibility Initiative](https://www.w3.org/WAI/)

## Support

For questions or issues related to accessibility testing:

1. Check the documentation in this directory
2. Review existing GitHub issues
3. Create a new issue using the accessibility issue template
4. Contact the development team

---

**Remember**: Accessibility is not a one-time task. It requires ongoing attention and testing throughout the development lifecycle.

**Last Updated**: 2024
