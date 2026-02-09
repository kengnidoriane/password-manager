# Browser Zoom Testing Guide

This guide provides instructions for testing the Password Manager application at 200% browser zoom to ensure accessibility compliance with WCAG 2.1 AA standards.

**Requirements:** 20.3

## Why Test Browser Zoom?

WCAG 2.1 Success Criterion 1.4.4 (Resize text) requires that text can be resized up to 200% without loss of content or functionality. This ensures users with low vision can read and interact with the application.

## Testing Procedure

### 1. Chrome/Edge Testing

1. **Open the application** in Chrome or Edge
2. **Set zoom to 200%**:
   - Press `Ctrl` + `+` (Windows/Linux) or `Cmd` + `+` (Mac) multiple times
   - Or use menu: Settings → Zoom → 200%
3. **Verify the following**:
   - [ ] All text is readable
   - [ ] No horizontal scrolling required
   - [ ] No content overlap
   - [ ] All interactive elements are accessible
   - [ ] Forms are usable
   - [ ] Navigation works correctly
   - [ ] Modals/dialogs display properly

### 2. Firefox Testing

1. **Open the application** in Firefox
2. **Set zoom to 200%**:
   - Press `Ctrl` + `+` (Windows/Linux) or `Cmd` + `+` (Mac)
   - Or use menu: View → Zoom → Zoom In
3. **Verify the same checklist** as Chrome

### 3. Safari Testing

1. **Open the application** in Safari
2. **Set zoom to 200%**:
   - Press `Cmd` + `+` multiple times
   - Or use menu: View → Zoom In
3. **Verify the same checklist** as Chrome

## Pages to Test

Test all major pages at 200% zoom:

### Authentication Pages
- [ ] Login page (`/login`)
- [ ] Registration page (`/register`)
- [ ] Password recovery page

### Main Application Pages
- [ ] Vault list page (`/vault`)
- [ ] Credential detail view
- [ ] Credential form (add/edit)
- [ ] Password generator (`/generator`)
- [ ] Security dashboard (`/security`)
- [ ] Settings page (`/settings`)
- [ ] Audit log page

### Components to Test
- [ ] Navigation menu
- [ ] Search bar
- [ ] Folder tree
- [ ] Tag filters
- [ ] Modal dialogs
- [ ] Dropdown menus
- [ ] Tooltips
- [ ] Notifications

## Common Issues to Watch For

### Layout Issues
- **Horizontal scrolling**: Content should reflow, not require horizontal scrolling
- **Text truncation**: Text should wrap, not be cut off
- **Overlapping elements**: Elements should not overlap each other
- **Hidden content**: All content should remain visible

### Interaction Issues
- **Clickable areas**: Touch targets should remain at least 44x44px
- **Form fields**: Input fields should be fully visible and usable
- **Buttons**: All buttons should be accessible and clickable
- **Links**: All links should be visible and clickable

### Visual Issues
- **Contrast**: Text contrast should remain sufficient
- **Focus indicators**: Focus outlines should be visible
- **Icons**: Icons should scale appropriately
- **Images**: Images should not break layout

## Responsive Design Verification

At 200% zoom, the application should behave similarly to mobile view:

1. **Navigation**: Should collapse to mobile menu
2. **Layout**: Should use single-column layout where appropriate
3. **Touch targets**: Should be appropriately sized
4. **Content**: Should reflow naturally

## Testing with Different Font Sizes

In addition to browser zoom, test with different font size settings:

### Chrome/Edge
1. Settings → Appearance → Font size
2. Test with "Very Large" setting

### Firefox
1. Settings → Language and Appearance → Fonts
2. Increase minimum font size to 20px

### Safari
1. Safari → Preferences → Advanced
2. Set minimum font size to 20px

## Automated Testing

While manual testing is required, you can use browser DevTools to simulate zoom:

```javascript
// In browser console
document.body.style.zoom = "200%";
```

## Reporting Issues

If you find zoom-related issues, report them with:

1. **Browser and version**
2. **Zoom level** (e.g., 200%)
3. **Page/component** affected
4. **Screenshot** showing the issue
5. **Steps to reproduce**

## Best Practices for Zoom Support

### CSS Guidelines
- Use relative units (`rem`, `em`, `%`) instead of fixed pixels
- Use `max-width` instead of fixed `width`
- Use flexbox/grid for responsive layouts
- Avoid fixed positioning where possible
- Use `overflow: auto` instead of `overflow: hidden`

### Design Guidelines
- Design mobile-first
- Test at multiple zoom levels during development
- Ensure touch targets are at least 44x44px
- Use responsive typography
- Avoid horizontal scrolling

## Success Criteria

The application passes zoom testing if:

✅ All content is readable at 200% zoom
✅ No horizontal scrolling is required
✅ All functionality remains accessible
✅ No content overlap occurs
✅ Layout adapts appropriately
✅ Touch targets remain adequately sized

## Resources

- [WCAG 2.1 - Resize text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [WebAIM - Zoom Testing](https://webaim.org/articles/visual/lowvision#zoom)
- [MDN - Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

**Last Updated:** ${new Date().toISOString().split('T')[0]}
