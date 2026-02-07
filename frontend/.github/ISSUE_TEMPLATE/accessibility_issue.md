---
name: Accessibility Issue
about: Report an accessibility issue found during assistive technology testing
title: '[A11Y] '
labels: accessibility, bug
assignees: ''
---

## Accessibility Issue

### Screen Reader / Assistive Technology
<!-- Which assistive technology was used when the issue was found? -->
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS)
- [ ] VoiceOver (iOS)
- [ ] TalkBack (Android)
- [ ] Keyboard-only navigation
- [ ] Other: ___________

### Browser & OS
**Browser:** <!-- e.g., Chrome 120, Firefox 121, Safari 17 -->
**OS:** <!-- e.g., Windows 11, macOS 14, iOS 17, Android 13 -->
**Screen Reader Version:** <!-- if applicable -->

### Priority
<!-- Select one -->
- [ ] Critical - Blocks core functionality
- [ ] High - Significantly impacts usability
- [ ] Medium - Impacts usability but has workaround
- [ ] Low - Minor issue or enhancement

### WCAG Criterion
<!-- Which WCAG 2.1 success criterion is violated? -->
**Criterion:** <!-- e.g., 2.1.1 Keyboard, 4.1.2 Name, Role, Value -->
**Level:** <!-- A, AA, or AAA -->

### Page/Component
**URL/Route:** <!-- e.g., /login, /vault, /settings -->
**Component:** <!-- e.g., LoginForm, CredentialCard, SearchBar -->

### Description
<!-- Clear description of the accessibility issue -->

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
<!-- What should happen? -->

### Actual Behavior
<!-- What actually happens? -->

### Screen Reader Output
<!-- If applicable, what does the screen reader announce? -->
```
[Paste screen reader output here]
```

### Screenshots/Videos
<!-- If applicable, add screenshots or screen recordings -->

### Suggested Fix
<!-- If you have a suggestion for how to fix this issue -->

### Related Requirements
<!-- Which requirements from the spec does this relate to? -->
- Requirement: <!-- e.g., 20.1, 20.2 -->

### Additional Context
<!-- Any other context about the problem -->

---

### For Developers

**Acceptance Criteria for Fix:**
- [ ] Issue is resolved
- [ ] Re-tested with affected screen reader(s)
- [ ] No regressions introduced
- [ ] Automated test added (if applicable)
- [ ] Documentation updated (if needed)

**Testing Checklist:**
- [ ] Tested with NVDA (if Windows issue)
- [ ] Tested with JAWS (if Windows issue)
- [ ] Tested with VoiceOver (if macOS/iOS issue)
- [ ] Tested with TalkBack (if Android issue)
- [ ] Tested with keyboard-only navigation
- [ ] Ran automated accessibility tests
- [ ] Verified WCAG compliance
