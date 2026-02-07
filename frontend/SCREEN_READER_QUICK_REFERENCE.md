# Screen Reader Quick Reference Guide

Quick reference for testing the Password Manager with screen readers during development.

## Quick Start

### NVDA (Windows) - Free
1. Download: https://www.nvaccess.org/download/
2. Install and restart
3. Start: `Ctrl + Alt + N`
4. Stop speech: `Ctrl`
5. Navigate: `↑` / `↓` arrow keys
6. Activate: `Enter` or `Space`

### VoiceOver (macOS) - Built-in
1. Enable: `Cmd + F5`
2. Stop speech: `Ctrl`
3. Navigate: `Ctrl + Option + →` / `←`
4. Activate: `Ctrl + Option + Space`
5. Web rotor: `Ctrl + Option + U`

### VoiceOver (iOS) - Built-in
1. Enable: Settings → Accessibility → VoiceOver
2. Navigate: Swipe right/left
3. Activate: Double-tap
4. Rotor: Two-finger rotate

### TalkBack (Android) - Built-in
1. Enable: Settings → Accessibility → TalkBack
2. Navigate: Swipe right/left
3. Activate: Double-tap
4. Stop speech: Two-finger tap

## Common Keyboard Shortcuts

### NVDA

| Action | Shortcut |
|--------|----------|
| Start/Stop | `Ctrl + Alt + N` |
| Stop speech | `Ctrl` |
| Next item | `↓` |
| Previous item | `↑` |
| Read all | `Insert + ↓` |
| Next heading | `H` |
| Next link | `K` |
| Next button | `B` |
| Next form field | `F` |
| Next landmark | `D` |
| Elements list | `Insert + F7` |

### VoiceOver (macOS)

| Action | Shortcut |
|--------|----------|
| Start/Stop | `Cmd + F5` |
| Stop speech | `Ctrl` |
| Next item | `VO + →` (VO = Ctrl + Option) |
| Previous item | `VO + ←` |
| Read all | `VO + A` |
| Next heading | `VO + Cmd + H` |
| Next link | `VO + Cmd + L` |
| Next form control | `VO + Cmd + J` |
| Interact | `VO + Shift + ↓` |
| Stop interacting | `VO + Shift + ↑` |
| Web rotor | `VO + U` |

## Testing Checklist (Quick)

### Every Page
- [ ] Page title announced
- [ ] Main heading (h1) present
- [ ] Skip navigation works
- [ ] All interactive elements accessible
- [ ] Tab order logical

### Forms
- [ ] All inputs have labels
- [ ] Required fields marked
- [ ] Error messages announced
- [ ] Success messages announced

### Buttons
- [ ] Purpose is clear
- [ ] State announced (pressed, expanded)
- [ ] Disabled state announced

### Dynamic Content
- [ ] Updates announced via ARIA live regions
- [ ] Loading states announced
- [ ] Error states announced

## Common Issues & Fixes

### Issue: Input has no label
```tsx
// ❌ Bad
<input type="text" placeholder="Email" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />
```

### Issue: Button purpose unclear
```tsx
// ❌ Bad
<button>×</button>

// ✅ Good
<button aria-label="Close dialog">×</button>
```

### Issue: Dynamic content not announced
```tsx
// ❌ Bad
<div>{message}</div>

// ✅ Good
<div role="status" aria-live="polite">{message}</div>
```

### Issue: Icon without text
```tsx
// ❌ Bad
<button><Icon /></button>

// ✅ Good
<button aria-label="Save password">
  <Icon aria-hidden="true" />
</button>
```

## ARIA Live Regions

### Polite (non-interrupting)
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

Use for:
- Status updates
- Search results count
- Form validation (non-critical)
- Progress updates

### Assertive (interrupting)
```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

Use for:
- Errors
- Critical warnings
- Time-sensitive alerts

## Testing Workflow

1. **Keyboard First**
   - Test with keyboard only (no screen reader)
   - Verify all functionality accessible
   - Check focus indicators visible

2. **Screen Reader**
   - Start screen reader
   - Navigate through page
   - Verify all content announced
   - Test interactive elements

3. **Forms**
   - Fill out form with screen reader
   - Trigger validation errors
   - Verify error announcements
   - Submit form

4. **Dynamic Content**
   - Trigger updates (save, delete, etc.)
   - Verify announcements
   - Check loading states

## Quick Test Script

```bash
# Run accessibility tests
npm test -- aria-labels.property.test.tsx
npm test -- keyboard-navigation.property.test.tsx
npm test -- form-label-association.property.test.tsx
npm test -- multi-modal-feedback.test.tsx

# Run axe-core
npm run test:a11y

# Run Lighthouse
npm run lighthouse
```

## Resources

- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver Commands](https://support.apple.com/guide/voiceover/keyboard-shortcuts-vo27972/mac)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Tips

1. **Test Early and Often** - Don't wait until the end
2. **Use Real Screen Readers** - Automated tools miss many issues
3. **Test with Keyboard First** - If it doesn't work with keyboard, it won't work with screen reader
4. **Listen to the Experience** - Close your eyes and listen
5. **Test on Multiple Screen Readers** - They behave differently
6. **Document Issues** - Keep track of what needs fixing

## Common Mistakes

❌ Using `<div>` with `onClick` instead of `<button>`
❌ Missing labels on form inputs
❌ Not announcing dynamic content updates
❌ Removing focus indicators
❌ Using positive `tabindex` values
❌ Creating keyboard traps
❌ Relying on color alone
❌ Not testing with actual screen readers

## Quick Wins

✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`)
✅ Add `aria-label` to icon buttons
✅ Use `role="status"` for status messages
✅ Use `role="alert"` for errors
✅ Associate labels with inputs
✅ Mark required fields
✅ Provide skip navigation
✅ Ensure visible focus indicators

---

**Remember:** The best way to ensure accessibility is to test with real screen readers and real users!
