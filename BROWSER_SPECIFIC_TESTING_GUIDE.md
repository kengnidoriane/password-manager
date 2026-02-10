# Browser-Specific Testing Guide

Quick reference for testing the Password Manager PWA on different browsers with browser-specific considerations.

---

## Chrome/Edge (Chromium-based)

### Installation
- **Windows/Mac/Linux:** Click install icon in address bar
- **Expected:** Seamless installation with app icon

### Testing Focus
✅ Full PWA support - use as baseline
✅ Service worker caching
✅ Background sync
✅ Push notifications
✅ Web Authentication API

### DevTools Tips
- Application tab → Service Workers
- Application tab → Storage (IndexedDB, Cache)
- Lighthouse audit for PWA score
- Network tab → Throttling for offline testing

### Known Issues
- None expected - full support

### Testing Commands
```bash
# Open Chrome with specific profile
chrome --user-data-dir=/tmp/chrome-test

# Open with DevTools
chrome --auto-open-devtools-for-tabs
```

---

## Firefox

### Installation
- **Windows/Mac/Linux:** Click install icon in address bar (Firefox 117+)
- **Expected:** Installation works but UX differs from Chrome

### Testing Focus
✅ Core functionality
✅ Service worker (basic support)
⚠️ No background sync
✅ Web Crypto API
✅ IndexedDB

### DevTools Tips
- Storage tab → IndexedDB
- Network tab → Service Workers
- Console for debugging
- Responsive Design Mode for mobile testing

### Known Limitations
- ❌ No background sync support
- ⚠️ PWA installation UX different from Chrome
- ⚠️ Some Web API implementations may differ

### Workarounds
- Use manual sync instead of background sync
- Document Firefox-specific installation flow

### Testing Commands
```bash
# Open Firefox with specific profile
firefox -P test-profile

# Open with Browser Console
firefox -jsconsole
```

---

## Safari (macOS)

### Installation
- **macOS:** File → Add to Dock (Safari 17+)
- **Expected:** Limited PWA support compared to Chrome

### Testing Focus
✅ Core functionality
⚠️ Limited service worker support
❌ No background sync
❌ No push notifications in PWA
⚠️ IndexedDB storage limits

### Web Inspector Tips
- Develop → Show Web Inspector
- Storage tab → IndexedDB
- Network tab → Service Workers
- Console for errors

### Known Limitations
- ⚠️ Service workers have storage limits
- ❌ No background sync
- ❌ No push notifications in PWA mode
- ⚠️ IndexedDB may be cleared more aggressively
- ⚠️ Some CSS may need -webkit- prefix

### Workarounds
- Use manual sync only
- Document storage limitations
- Test with limited storage scenarios
- Add -webkit- prefixes where needed

### Testing Commands
```bash
# Open Safari with Web Inspector
open -a Safari --args --enable-developer-menu

# Clear all website data
# Safari → Settings → Privacy → Manage Website Data → Remove All
```

### Safari-Specific CSS
```css
/* Safe area insets for notch */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);

/* Webkit-specific properties */
-webkit-appearance: none;
-webkit-user-select: none;
```

---

## Mobile Safari (iOS)

### Installation
- **iOS:** Share button → Add to Home Screen
- **Expected:** Icon on home screen, launches in standalone mode

### Testing Focus
✅ Touch interactions
✅ Face ID/Touch ID
✅ iOS keyboard behavior
⚠️ Limited service worker
❌ No push notifications
❌ No background sync
✅ Safe area insets (notch)

### Testing on iOS
1. Connect iPhone to Mac
2. Safari → Develop → [Your iPhone] → [Page]
3. Use Web Inspector remotely

### Known Limitations
- ❌ No push notifications in PWA mode
- ❌ No background sync
- ⚠️ Service worker limitations
- ⚠️ Storage may be cleared when device storage is low
- ⚠️ 100MB storage limit for PWAs

### iOS-Specific Considerations
- **Touch targets:** Minimum 44x44px
- **Viewport:** Handle safe area insets
- **Keyboard:** Test with iOS keyboard
- **Gestures:** Swipe, pinch, tap
- **Orientation:** Test portrait and landscape

### Testing Checklist
- [ ] Add to Home Screen works
- [ ] App icon displays correctly
- [ ] Splash screen shows
- [ ] Standalone mode (no Safari UI)
- [ ] Face ID/Touch ID authentication
- [ ] Safe area insets handled (notch)
- [ ] Touch targets adequate (44px min)
- [ ] iOS keyboard appears correctly
- [ ] Orientation changes work
- [ ] No horizontal scrolling

### iOS Versions to Test
- iOS 14 (minimum supported)
- iOS 15
- iOS 16
- iOS 17 (latest)

### Devices to Test
- iPhone SE (small screen)
- iPhone 12/13 (standard)
- iPhone 14 Pro (Dynamic Island)
- iPad (tablet)

---

## Chrome Mobile (Android)

### Installation
- **Android:** Menu → Add to Home screen / Install app
- **Expected:** Full PWA support with app icon

### Testing Focus
✅ Full PWA support
✅ Service worker
✅ Background sync
✅ Push notifications
✅ Fingerprint authentication
✅ Android keyboard

### Testing on Android
1. Connect Android device via USB
2. Chrome DevTools → Remote devices
3. Inspect and debug remotely

### Known Considerations
- ⚠️ Behavior may vary by Android version
- ⚠️ Device manufacturer customizations
- ⚠️ Different keyboard implementations

### Android-Specific Considerations
- **Touch targets:** Minimum 48x48dp
- **Back button:** Handle Android back button
- **Keyboard:** Test with various keyboards
- **Permissions:** Handle Android permissions
- **Notifications:** Test notification behavior

### Testing Checklist
- [ ] Add to Home Screen works
- [ ] App icon displays correctly
- [ ] Splash screen shows
- [ ] Standalone mode
- [ ] Fingerprint authentication
- [ ] Back button behavior correct
- [ ] Android keyboard works
- [ ] Touch targets adequate (48dp min)
- [ ] Orientation changes work
- [ ] Push notifications work

### Android Versions to Test
- Android 10 (minimum supported)
- Android 11
- Android 12
- Android 13
- Android 14 (latest)

### Devices to Test
- Pixel (Google)
- Samsung Galaxy (Samsung)
- OnePlus (OnePlus)
- Various screen sizes

---

## Cross-Browser Testing Checklist

### Core Functionality (All Browsers)
- [ ] User registration
- [ ] Login with master password
- [ ] 2FA setup and verification
- [ ] Create credential
- [ ] Edit credential
- [ ] Delete credential
- [ ] Search credentials
- [ ] Copy to clipboard
- [ ] Password generation
- [ ] Import CSV
- [ ] Export data

### PWA Features (Browser-Dependent)
- [ ] Installation prompt/option
- [ ] Install successfully
- [ ] Launch in standalone mode
- [ ] App icon displays
- [ ] Splash screen shows
- [ ] Offline mode works
- [ ] Service worker registers
- [ ] Update notification

### Web APIs (Browser-Dependent)
- [ ] Web Crypto API works
- [ ] IndexedDB works
- [ ] Service Worker works
- [ ] Web Authentication works
- [ ] Clipboard API works
- [ ] Notifications (if supported)
- [ ] Background Sync (if supported)

### Performance (All Browsers)
- [ ] Initial load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks
- [ ] Transitions < 300ms

### Responsive Design (All Browsers)
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] No horizontal scrolling
- [ ] Touch targets adequate

---

## Testing Tools by Browser

### Chrome/Edge
- Chrome DevTools
- Lighthouse
- Puppeteer/Playwright
- Chrome Remote Debugging

### Firefox
- Firefox Developer Tools
- Responsive Design Mode
- Browser Console
- Firefox Remote Debugging

### Safari
- Safari Web Inspector
- Responsive Design Mode
- iOS Simulator (Xcode)
- Remote Debugging (iOS)

### Mobile
- Chrome Remote Debugging (Android)
- Safari Remote Debugging (iOS)
- BrowserStack (real devices)
- Device emulators

---

## Quick Commands Reference

### Clear Browser Data

**Chrome/Edge:**
```
chrome://settings/clearBrowserData
```

**Firefox:**
```
about:preferences#privacy
```

**Safari:**
```
Safari → Settings → Privacy → Manage Website Data
```

### Service Worker Debugging

**Chrome/Edge:**
```
chrome://serviceworker-internals/
```

**Firefox:**
```
about:debugging#/runtime/this-firefox
```

**Safari:**
```
Safari → Develop → Service Workers
```

### IndexedDB Inspection

**Chrome/Edge:**
```
DevTools → Application → Storage → IndexedDB
```

**Firefox:**
```
DevTools → Storage → IndexedDB
```

**Safari:**
```
Web Inspector → Storage → IndexedDB
```

---

## Issue Reporting Template

When reporting browser-specific issues:

```markdown
**Browser:** [Browser name and version]
**OS:** [Operating system and version]
**Device:** [Device model if mobile]

**Issue Description:**
[Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
```
[Paste console errors]
```

**Browser-Specific Notes:**
[Any browser-specific observations]
```

---

## Resources

- [Can I Use](https://caniuse.com/) - Browser compatibility
- [MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API) - API support
- [PWA Compatibility](https://whatpwacando.today/) - PWA features by browser
- [iOS PWA Limitations](https://firt.dev/ios-14.5/) - iOS-specific issues
- [Android PWA Guide](https://web.dev/android-pwa/) - Android best practices
