# Accessibility Manual Testing Checklist

This comprehensive checklist covers all manual accessibility testing requirements for the Password Manager application.

**Requirements:** 20.1, 20.2, 20.3

## Testing Overview

- **Automated Tests**: Run via `npm run test:a11y`
- **Manual Tests**: Follow this checklist
- **Tools Required**: Screen readers, keyboard, browser zoom
- **Estimated Time**: 2-3 hours for complete testing

---

## 1. Keyboard Navigation Testing

### General Navigation
- [ ] All interactive elements are reachable via Tab key
- [ ] Tab order is logical and follows visual layout
- [ ] Shift+Tab moves focus backwards correctly
- [ ] Focus indicators are clearly visible on all elements
- [ ] No keyboard traps (can always move focus away)
- [ ] Skip navigation links work correctly

### Specific Components
- [ ] **Login Form**: Tab through email → password → submit
- [ ] **Registration Form**: Tab through all fields in logical order
- [ ] **Vault List**: Navigate through credentials with Tab
- [ ] **Credential Card**: Access all actions (view, edit, delete, copy)
- [ ] **Modal Dialogs**: Focus trapped within modal, Escape closes
- [ ] **Dropdown Menus**: Arrow keys navigate, Enter selects
- [ ] **Search Bar**: Focus, type, and navigate results
- [ ] **Folder Tree**: Arrow keys expand/collapse, Enter selects

### Keyboard Shortcuts
- [ ] Document all keyboard shortcuts
- [ ] Shortcuts don't conflict with browser/screen reader shortcuts
- [ ] Shortcuts are discoverable (help menu or tooltip)
- [ ] Shortcuts work consistently across pages

### Focus Management
- [ ] Focus moves to appropriate element after actions
- [ ] Focus returns to trigger element after closing modals
- [ ] Focus is set on first error in forms
- [ ] Focus is visible at all times
- [ ] Focus outline has sufficient contrast (3:1 minimum)

---

## 2. Screen Reader Testing

### NVDA (Windows) - Free
Download: https://www.nvaccess.org/download/

#### Setup
- [ ] Install NVDA
- [ ] Start NVDA (Ctrl+Alt+N)
- [ ] Open application in browser
- [ ] Use NVDA+Q to quit when done

#### Testing Tasks
- [ ] **Navigate by headings** (H key): All headings announced correctly
- [ ] **Navigate by landmarks** (D key): Main regions identified
- [ ] **Navigate by forms** (F key): All form fields found
- [ ] **Navigate by buttons** (B key): All buttons announced with labels
- [ ] **Navigate by links** (K key): All links have descriptive text
- [ ] **Read page content** (Down arrow): All content readable
- [ ] **Form fields**: Labels announced before input
- [ ] **Error messages**: Errors announced when they appear
- [ ] **Dynamic content**: Updates announced via ARIA live regions
- [ ] **Tables**: Table structure announced correctly
- [ ] **Lists**: Lists and list items announced
- [ ] **Images**: Alt text announced for all images

### JAWS (Windows) - Commercial
Trial: https://www.freedomscientific.com/downloads/jaws

#### Testing Tasks
- [ ] Same tasks as NVDA above
- [ ] Verify consistent behavior between NVDA and JAWS
- [ ] Test forms mode (Enter/Exit with Enter key)
- [ ] Test virtual cursor navigation

### VoiceOver (macOS) - Built-in

#### Setup
- [ ] Enable VoiceOver (Cmd+F5)
- [ ] Open application in Safari
- [ ] Use Cmd+F5 to quit when done

#### Testing Tasks
- [ ] **Navigate by headings** (VO+Cmd+H): All headings announced
- [ ] **Navigate by landmarks** (VO+U, then arrows): Regions identified
- [ ] **Navigate by forms** (VO+Cmd+J): All form fields found
- [ ] **Rotor navigation** (VO+U): All element types accessible
- [ ] **Form fields**: Labels announced correctly
- [ ] **Buttons**: All buttons have accessible names
- [ ] **Links**: Link purpose is clear
- [ ] **Dynamic content**: Updates announced
- [ ] **Gestures** (on iOS): Swipe navigation works

### TalkBack (Android) - Built-in

#### Setup
- [ ] Enable TalkBack in Settings → Accessibility
- [ ] Open application in Chrome
- [ ] Use volume keys to navigate

#### Testing Tasks
- [ ] **Swipe navigation**: All elements accessible
- [ ] **Headings**: Navigate by headings
- [ ] **Links and buttons**: All interactive elements accessible
- [ ] **Form fields**: Labels announced
- [ ] **Gestures**: Double-tap to activate works
- [ ] **Reading order**: Logical reading order

---

## 3. Color Contrast Testing

### Automated Tools
- [ ] Run axe DevTools browser extension
- [ ] Run WAVE browser extension
- [ ] Check contrast ratios in DevTools

### Manual Verification
- [ ] **Normal text** (< 18pt): 4.5:1 contrast minimum
- [ ] **Large text** (≥ 18pt or 14pt bold): 3:1 contrast minimum
- [ ] **UI components**: 3:1 contrast for borders, icons
- [ ] **Focus indicators**: 3:1 contrast against background
- [ ] **Disabled elements**: Clearly distinguishable
- [ ] **Error states**: Sufficient contrast for error text
- [ ] **Success states**: Sufficient contrast for success text
- [ ] **Links**: Distinguishable from surrounding text

### Color Blindness Testing
- [ ] Test with color blindness simulator
- [ ] Verify information not conveyed by color alone
- [ ] Test with grayscale mode
- [ ] Verify status indicators use icons + text

### High Contrast Mode
- [ ] Test in Windows High Contrast mode
- [ ] Test in macOS Increase Contrast mode
- [ ] Verify all content remains visible
- [ ] Verify focus indicators remain visible

---

## 4. Browser Zoom Testing

### 200% Zoom Testing
- [ ] **Chrome**: Test at 200% zoom (Ctrl/Cmd + +)
- [ ] **Firefox**: Test at 200% zoom
- [ ] **Safari**: Test at 200% zoom
- [ ] **Edge**: Test at 200% zoom

### Verification at 200% Zoom
- [ ] No horizontal scrolling required
- [ ] All text is readable
- [ ] No content overlap
- [ ] All buttons are clickable
- [ ] Forms are usable
- [ ] Navigation works correctly
- [ ] Modals display properly
- [ ] Touch targets remain adequate (44x44px minimum)

### Pages to Test
- [ ] Login page
- [ ] Registration page
- [ ] Vault list
- [ ] Credential form
- [ ] Password generator
- [ ] Security dashboard
- [ ] Settings page
- [ ] Audit log

---

## 5. ARIA Implementation Testing

### ARIA Labels
- [ ] All buttons have accessible names
- [ ] All icons have aria-label or aria-labelledby
- [ ] All form inputs have labels
- [ ] All images have alt text or aria-label
- [ ] All links have descriptive text

### ARIA Roles
- [ ] Semantic HTML used where possible
- [ ] ARIA roles used only when necessary
- [ ] Roles match component behavior
- [ ] No conflicting roles

### ARIA States and Properties
- [ ] aria-expanded on expandable elements
- [ ] aria-selected on selectable items
- [ ] aria-checked on checkboxes
- [ ] aria-pressed on toggle buttons
- [ ] aria-current on current page/item
- [ ] aria-disabled on disabled elements
- [ ] aria-hidden used appropriately
- [ ] aria-live for dynamic content

### ARIA Live Regions
- [ ] Success messages announced
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Search results announced
- [ ] Form validation announced
- [ ] Notifications announced

---

## 6. Form Accessibility Testing

### Labels and Instructions
- [ ] All inputs have associated labels
- [ ] Labels use `for` attribute or wrap input
- [ ] Required fields marked with aria-required
- [ ] Instructions provided before form
- [ ] Field format explained (e.g., date format)

### Error Handling
- [ ] Errors announced to screen readers
- [ ] Error messages associated with fields (aria-describedby)
- [ ] aria-invalid set on fields with errors
- [ ] Error summary at top of form
- [ ] Errors persist until corrected
- [ ] Focus moves to first error

### Validation
- [ ] Inline validation provides feedback
- [ ] Validation doesn't remove focus
- [ ] Success states announced
- [ ] Clear error recovery instructions

---

## 7. Responsive Design Testing

### Mobile Devices
- [ ] Test on iPhone (Safari)
- [ ] Test on Android phone (Chrome)
- [ ] Test on iPad (Safari)
- [ ] Test on Android tablet (Chrome)

### Touch Targets
- [ ] All touch targets at least 44x44px
- [ ] Adequate spacing between targets
- [ ] Swipe gestures work correctly
- [ ] Pinch-to-zoom enabled

### Orientation
- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Content adapts to orientation change
- [ ] No data loss on orientation change

---

## 8. Additional Accessibility Checks

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmarks used (header, nav, main, footer)
- [ ] Lists used for list content
- [ ] Tables used for tabular data
- [ ] Buttons for actions, links for navigation

### Content Structure
- [ ] Page has descriptive title
- [ ] Language attribute set on html element
- [ ] Skip links provided
- [ ] Breadcrumbs (if applicable)
- [ ] Clear page structure

### Multimedia
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Auto-play disabled or controllable
- [ ] Media controls are keyboard accessible

### Timing
- [ ] No time limits or limits are adjustable
- [ ] Session timeout warnings provided
- [ ] User can extend timeout
- [ ] Auto-refresh can be disabled

---

## 9. Testing Tools

### Browser Extensions
- [ ] **axe DevTools**: Automated scanning
- [ ] **WAVE**: Visual accessibility evaluation
- [ ] **Lighthouse**: Accessibility audit
- [ ] **Color Contrast Analyzer**: Contrast checking

### Online Tools
- [ ] **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- [ ] **WAVE**: https://wave.webaim.org/
- [ ] **Color Blindness Simulator**: https://www.color-blindness.com/coblis-color-blindness-simulator/

### Desktop Tools
- [ ] **NVDA**: Windows screen reader
- [ ] **JAWS**: Windows screen reader (trial)
- [ ] **Colour Contrast Analyser**: Desktop app

---

## 10. Documentation

### Test Results
- [ ] Document all issues found
- [ ] Prioritize issues (critical, major, minor)
- [ ] Create tickets for each issue
- [ ] Assign severity levels
- [ ] Track remediation progress

### Accessibility Statement
- [ ] Create accessibility statement page
- [ ] Document known issues
- [ ] Provide contact for accessibility concerns
- [ ] List supported assistive technologies
- [ ] Document keyboard shortcuts

---

## Testing Sign-off

### Completion Criteria
- [ ] All automated tests pass
- [ ] All manual tests completed
- [ ] All critical issues resolved
- [ ] All major issues resolved or documented
- [ ] Accessibility statement published
- [ ] Team trained on accessibility

### Sign-off
- **Tester Name**: ___________________________
- **Date**: ___________________________
- **Status**: ☐ Pass ☐ Pass with minor issues ☐ Fail
- **Notes**: ___________________________

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)

---

**Last Updated:** ${new Date().toISOString().split('T')[0]}
