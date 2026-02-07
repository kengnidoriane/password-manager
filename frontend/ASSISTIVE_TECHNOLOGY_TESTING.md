# Assistive Technology Testing Guide

This document provides comprehensive guidance for testing the Password Manager application with assistive technologies to ensure compliance with WCAG 2.1 AA standards (Requirements 20.1, 20.2).

## Overview

Assistive technology testing validates that the application is usable by people with disabilities who rely on:
- Screen readers (NVDA, JAWS, VoiceOver, TalkBack)
- Keyboard-only navigation
- Voice control software
- Screen magnification
- High contrast modes

## Testing Environments

### Windows Testing

**Screen Readers:**
- **NVDA (NonVisual Desktop Access)** - Free, open-source
- **JAWS (Job Access With Speech)** - Commercial, industry standard

**Browsers:**
- Chrome (latest)
- Firefox (latest)
- Edge (latest)

### macOS Testing

**Screen Reader:**
- **VoiceOver** - Built-in to macOS

**Browsers:**
- Safari (latest)
- Chrome (latest)
- Firefox (latest)

### iOS Testing

**Screen Reader:**
- **VoiceOver** - Built-in to iOS

**Browser:**
- Safari (iOS)

### Android Testing

**Screen Reader:**
- **TalkBack** - Built-in to Android

**Browser:**
- Chrome (Android)

## NVDA Testing (Windows)

### Installation

1. Download NVDA from https://www.nvaccess.org/download/
2. Install and restart computer
3. NVDA will start automatically

### Basic Controls

| Action | Shortcut |
|--------|----------|
| Start/Stop NVDA | `Ctrl + Alt + N` |
| Stop speech | `Ctrl` |
| Read next item | `↓` |
| Read previous item | `↑` |
| Read all | `Insert + ↓` |
| Navigate by heading | `H` |
| Navigate by link | `K` |
| Navigate by button | `B` |
| Navigate by form field | `F` |
| Navigate by landmark | `D` |
| List all links | `Insert + F7` |
| List all headings | `Insert + F7` (then select Headings) |

### Testing Checklist

#### Authentication Pages

**Login Page** (`/login`):
- [ ] Page title is announced: "Login - Password Manager"
- [ ] All form fields have labels announced
- [ ] Email field: "Email, edit, required"
- [ ] Password field: "Password, edit, required"
- [ ] "Show password" button is announced with state
- [ ] Submit button: "Login, button"
- [ ] Error messages are announced immediately
- [ ] Success message announced on successful login
- [ ] Tab order is logical: Email → Password → Show Password → Login

**Register Page** (`/register`):
- [ ] Page title is announced: "Register - Password Manager"
- [ ] All form fields have labels
- [ ] Password strength meter is announced
- [ ] Recovery key is announced and emphasized
- [ ] "Copy recovery key" button is accessible
- [ ] Validation errors are announced inline
- [ ] Success message on registration

#### Vault Pages

**Vault List** (`/vault`):
- [ ] Page title: "Vault - Password Manager"
- [ ] Search field: "Search credentials and secure notes, edit"
- [ ] "New credential" button is announced
- [ ] Each credential card is navigable
- [ ] Credential title, username, URL are announced
- [ ] "Copy username" button: "Copy username, button"
- [ ] "Copy password" button: "Copy password, button"
- [ ] "Edit" and "Delete" buttons are announced
- [ ] Folder tree is navigable with arrow keys
- [ ] Tags are announced and clickable

**Credential Form** (`/vault` - add/edit):
- [ ] Form title: "Add Credential" or "Edit Credential"
- [ ] All fields have labels
- [ ] Password generator controls are accessible
- [ ] Character type checkboxes are announced with state
- [ ] Length slider: "Password length: 16 characters, slider"
- [ ] Generated password is announced
- [ ] "Generate" button triggers announcement
- [ ] Save/Cancel buttons are accessible

#### Password Generator

**Generator Page** (`/generator`):
- [ ] Page title: "Password Generator - Password Manager"
- [ ] All controls are labeled
- [ ] Length slider announces current value
- [ ] Checkboxes announce state (checked/unchecked)
- [ ] Generated password is announced
- [ ] Strength meter is announced: "Password strength: Strong"
- [ ] "Copy" button provides feedback
- [ ] "Save to vault" button is accessible

#### Security Dashboard

**Security Page** (`/security`):
- [ ] Page title: "Security Dashboard - Password Manager"
- [ ] Overall security score is announced
- [ ] Weak passwords list is navigable
- [ ] Reused passwords list is navigable
- [ ] Breached passwords list is navigable
- [ ] Each issue has actionable buttons
- [ ] Recommendations are announced

#### Settings

**Settings Page** (`/settings`):
- [ ] Page title: "Settings - Password Manager"
- [ ] Tab navigation is announced
- [ ] All form controls are labeled
- [ ] Sliders announce current values
- [ ] Checkboxes announce state
- [ ] Save button provides feedback

### Common Issues to Check

1. **Missing Labels**: All form inputs must have labels
2. **Button Purpose**: Buttons must describe their action
3. **Dynamic Content**: Updates must be announced via ARIA live regions
4. **Focus Management**: Focus must be visible and logical
5. **Error Messages**: Errors must be announced immediately
6. **Loading States**: Loading indicators must be announced
7. **Modal Dialogs**: Focus must trap within modal
8. **Keyboard Traps**: User must be able to escape all components

## JAWS Testing (Windows)

### Installation

1. Purchase license from https://www.freedomscientific.com/products/software/jaws/
2. Download and install
3. Restart computer

### Basic Controls

| Action | Shortcut |
|--------|----------|
| Start/Stop JAWS | `Insert + F4` |
| Stop speech | `Ctrl` |
| Read next item | `↓` |
| Read previous item | `↑` |
| Read all | `Insert + ↓` |
| Navigate by heading | `H` |
| Navigate by link | `Tab` (in virtual cursor mode) |
| Navigate by button | `B` |
| Navigate by form field | `F` |
| List all links | `Insert + F7` |
| List all headings | `Insert + F6` |
| Forms mode | `Enter` (on form field) |

### Testing Checklist

Use the same checklist as NVDA, but verify:
- [ ] JAWS announces all elements correctly
- [ ] Forms mode activates automatically on form fields
- [ ] Virtual cursor navigation works smoothly
- [ ] All ARIA attributes are recognized
- [ ] Live regions announce updates
- [ ] Table navigation works (if applicable)

### JAWS-Specific Checks

- [ ] Verify JAWS verbosity settings don't hide important info
- [ ] Test with both virtual cursor and forms mode
- [ ] Check that JAWS scripts don't conflict with app
- [ ] Verify pronunciation of technical terms

## VoiceOver Testing (macOS)

### Activation

1. System Preferences → Accessibility → VoiceOver
2. Enable VoiceOver
3. Or use shortcut: `Cmd + F5`

### Basic Controls

| Action | Shortcut |
|--------|----------|
| Start/Stop VoiceOver | `Cmd + F5` |
| Stop speech | `Ctrl` |
| Read next item | `VO + →` (VO = Ctrl + Option) |
| Read previous item | `VO + ←` |
| Read all | `VO + A` |
| Navigate by heading | `VO + Cmd + H` |
| Navigate by link | `VO + Cmd + L` |
| Navigate by form control | `VO + Cmd + J` |
| Interact with element | `VO + Space` |
| Web rotor | `VO + U` |

### Testing Checklist

Use the same checklist as NVDA, but verify:
- [ ] VoiceOver announces all elements correctly
- [ ] Web rotor shows all headings, links, form controls
- [ ] Interaction with complex widgets works
- [ ] All ARIA attributes are recognized
- [ ] Live regions announce updates
- [ ] Safari-specific features work correctly

### VoiceOver-Specific Checks

- [ ] Test with Safari (primary browser for VoiceOver)
- [ ] Verify rotor navigation is complete
- [ ] Check that custom controls are recognized
- [ ] Test trackpad commander gestures (if applicable)

## VoiceOver Testing (iOS)

### Activation

1. Settings → Accessibility → VoiceOver
2. Enable VoiceOver
3. Or use Siri: "Hey Siri, turn on VoiceOver"
4. Triple-click home/side button (if configured)

### Basic Gestures

| Action | Gesture |
|--------|---------|
| Read next item | Swipe right |
| Read previous item | Swipe left |
| Activate item | Double-tap |
| Scroll | Three-finger swipe up/down |
| Rotor | Two-finger rotate |
| Read all | Two-finger swipe down |
| Stop speech | Two-finger tap |

### Testing Checklist

**PWA Installation:**
- [ ] Install PWA from Safari
- [ ] Launch PWA from home screen
- [ ] Verify splash screen is accessible

**Touch Targets:**
- [ ] All buttons are at least 44x44 pixels
- [ ] Touch targets don't overlap
- [ ] Swipe gestures work correctly

**Mobile-Specific Features:**
- [ ] Pull-to-refresh is announced
- [ ] Swipe actions (delete, edit) are accessible
- [ ] Bottom navigation is accessible
- [ ] Modal sheets are accessible
- [ ] Form inputs trigger correct keyboards

**General Checklist:**
- [ ] All pages are navigable with swipe gestures
- [ ] All interactive elements are accessible
- [ ] Form fields have labels
- [ ] Buttons describe their action
- [ ] Dynamic content is announced
- [ ] Loading states are announced
- [ ] Error messages are announced

### iOS-Specific Checks

- [ ] Test in both portrait and orientation
- [ ] Verify keyboard dismissal is accessible
- [ ] Check that focus doesn't get lost on keyboard show/hide
- [ ] Test with different text sizes (Settings → Display & Brightness → Text Size)
- [ ] Verify with Reduce Motion enabled

## TalkBack Testing (Android)

### Activation

1. Settings → Accessibility → TalkBack
2. Enable TalkBack
3. Or use volume key shortcut (if configured)

### Basic Gestures

| Action | Gesture |
|--------|---------|
| Read next item | Swipe right |
| Read previous item | Swipe left |
| Activate item | Double-tap |
| Scroll | Two-finger swipe up/down |
| Local context menu | Swipe up then right |
| Global context menu | Swipe down then right |
| Read from top | Swipe down then left |
| Stop speech | Two-finger tap |

### Testing Checklist

**PWA Installation:**
- [ ] Install PWA from Chrome
- [ ] Launch PWA from home screen
- [ ] Verify splash screen is accessible

**Touch Targets:**
- [ ] All buttons are at least 48x48 dp
- [ ] Touch targets don't overlap
- [ ] Swipe gestures work correctly

**Mobile-Specific Features:**
- [ ] Pull-to-refresh is announced
- [ ] Swipe actions (delete, edit) are accessible
- [ ] Bottom navigation is accessible
- [ ] Modal sheets are accessible
- [ ] Form inputs trigger correct keyboards

**General Checklist:**
- [ ] All pages are navigable with swipe gestures
- [ ] All interactive elements are accessible
- [ ] Form fields have labels
- [ ] Buttons describe their action
- [ ] Dynamic content is announced
- [ ] Loading states are announced
- [ ] Error messages are announced

### Android-Specific Checks

- [ ] Test with different Android versions (10+)
- [ ] Verify with different manufacturers (Samsung, Google, etc.)
- [ ] Check that focus doesn't get lost on keyboard show/hide
- [ ] Test with different font sizes
- [ ] Verify with animation disabled

## Common Accessibility Issues

### Issue 1: Missing Labels

**Problem:** Form inputs without labels
```tsx
// ❌ Bad
<input type="text" placeholder="Email" />
```

**Solution:**
```tsx
// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />
```

### Issue 2: Non-Descriptive Buttons

**Problem:** Buttons with generic text
```tsx
// ❌ Bad
<button>Click here</button>
```

**Solution:**
```tsx
// ✅ Good
<button aria-label="Copy password to clipboard">Copy</button>
```

### Issue 3: Missing Live Regions

**Problem:** Dynamic content not announced
```tsx
// ❌ Bad
<div>{statusMessage}</div>
```

**Solution:**
```tsx
// ✅ Good
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### Issue 4: Keyboard Traps

**Problem:** User can't escape modal with keyboard
```tsx
// ❌ Bad - no escape handler
<div className="modal">
  <button onClick={close}>Close</button>
</div>
```

**Solution:**
```tsx
// ✅ Good - escape key closes modal
<div className="modal" onKeyDown={(e) => e.key === 'Escape' && close()}>
  <button onClick={close}>Close</button>
</div>
```

### Issue 5: Missing Focus Management

**Problem:** Focus not moved to modal when opened
```tsx
// ❌ Bad
<Modal isOpen={isOpen}>
  <h2>Title</h2>
</Modal>
```

**Solution:**
```tsx
// ✅ Good
<Modal isOpen={isOpen} onOpen={() => focusFirst()}>
  <h2 ref={titleRef} tabIndex={-1}>Title</h2>
</Modal>
```

## Testing Workflow

### 1. Preparation

- [ ] Install required screen readers
- [ ] Configure browser settings
- [ ] Clear browser cache
- [ ] Disable browser extensions (except accessibility tools)
- [ ] Prepare test account credentials

### 2. Initial Testing

- [ ] Test with keyboard only (no screen reader)
- [ ] Verify all functionality is accessible
- [ ] Check focus indicators are visible
- [ ] Verify tab order is logical

### 3. Screen Reader Testing

For each screen reader:
- [ ] Test authentication flow
- [ ] Test vault operations
- [ ] Test password generator
- [ ] Test security dashboard
- [ ] Test settings
- [ ] Test PWA features

### 4. Documentation

For each issue found:
- [ ] Document the issue
- [ ] Note which screen reader(s) affected
- [ ] Provide steps to reproduce
- [ ] Suggest fix
- [ ] Assign priority (Critical, High, Medium, Low)

### 5. Verification

After fixes:
- [ ] Re-test with all screen readers
- [ ] Verify issue is resolved
- [ ] Check for regressions
- [ ] Update documentation

## Issue Tracking Template

```markdown
### Issue: [Brief Description]

**Screen Reader:** NVDA / JAWS / VoiceOver / TalkBack
**Browser:** Chrome / Firefox / Safari / Edge
**OS:** Windows / macOS / iOS / Android
**Priority:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Navigate to [page]
2. [Action]
3. [Expected vs Actual]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Suggested Fix:**
[How to fix the issue]

**WCAG Criterion:**
[Which WCAG criterion is violated]
```

## Automated Testing

While manual testing is essential, automated tools can catch many issues:

### axe DevTools

1. Install axe DevTools browser extension
2. Open DevTools → axe DevTools tab
3. Click "Scan ALL of my page"
4. Review and fix issues

### Lighthouse

1. Open DevTools → Lighthouse tab
2. Select "Accessibility" category
3. Click "Generate report"
4. Review and fix issues

### WAVE

1. Install WAVE browser extension
2. Click WAVE icon
3. Review errors, alerts, and features
4. Fix issues

## Resources

### Screen Readers

- [NVDA Download](https://www.nvaccess.org/download/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [TalkBack Help](https://support.google.com/accessibility/android/answer/6283677)

### Testing Guides

- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Keyboard Shortcuts](https://www.freedomscientific.com/training/jaws/hotkeys/)
- [VoiceOver Commands](https://support.apple.com/guide/voiceover/keyboard-shortcuts-vo27972/mac)

### Standards

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Compliance Checklist

### Requirements 20.1 & 20.2

- [ ] All interactive elements have descriptive ARIA labels
- [ ] Semantic HTML is used throughout
- [ ] ARIA live regions announce dynamic content
- [ ] All functionality is keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] Skip navigation links are present
- [ ] No keyboard traps exist
- [ ] Screen readers announce all content correctly
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Loading states are announced
- [ ] Form validation is accessible
- [ ] Modal dialogs are accessible
- [ ] All images have alt text
- [ ] All icons have text alternatives

## Sign-Off

After completing all testing:

**Tested By:** [Name]
**Date:** [Date]
**Screen Readers Tested:**
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS)
- [ ] VoiceOver (iOS)
- [ ] TalkBack (Android)

**Critical Issues Found:** [Number]
**High Priority Issues Found:** [Number]
**Medium Priority Issues Found:** [Number]
**Low Priority Issues Found:** [Number]

**Overall Assessment:** Pass / Fail / Pass with Minor Issues

**Notes:**
[Any additional notes or observations]

---

Last Updated: 2024
