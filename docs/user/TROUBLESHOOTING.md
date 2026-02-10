# Troubleshooting Guide

This guide helps you resolve common issues with Password Manager.

## Table of Contents

1. [Login Issues](#login-issues)
2. [Sync Problems](#sync-problems)
3. [Performance Issues](#performance-issues)
4. [Installation Problems](#installation-problems)
5. [Encryption Errors](#encryption-errors)
6. [Import/Export Issues](#import-export-issues)
7. [Mobile-Specific Issues](#mobile-specific-issues)
8. [Browser-Specific Issues](#browser-specific-issues)
9. [Network and Connectivity](#network-and-connectivity)
10. [Data and Storage Issues](#data-and-storage-issues)

---

## Login Issues

### Cannot Log In - "Invalid Credentials"

**Possible Causes:**
- Incorrect master password
- Caps Lock is on
- Wrong email address
- Account doesn't exist

**Solutions:**

1. **Verify Master Password:**
   - Check if Caps Lock is on
   - Try typing password in a text editor first to verify
   - Remember: passwords are case-sensitive

2. **Verify Email Address:**
   - Check for typos
   - Verify you're using the correct email
   - Try copying/pasting email to avoid typos

3. **Use Recovery Key:**
   - If you forgot your password, click "Forgot Password"
   - Enter your recovery key
   - Set a new master password

4. **Create New Account:**
   - If you lost both password and recovery key
   - Unfortunately, data cannot be recovered
   - You'll need to create a new account

### "Session Expired" Error

**Cause:** Your session timed out due to inactivity.

**Solution:**
1. Enter your master password to unlock
2. Or use biometric authentication if enabled
3. Adjust session timeout in Settings → Security if needed

### Two-Factor Authentication Code Not Working

**Possible Causes:**
- Time sync issue on device
- Wrong code entered
- Code already used
- Authenticator app not set up correctly

**Solutions:**

1. **Check Time Sync:**
   - Ensure device time is set to automatic
   - Time must be accurate for TOTP codes
   - Settings → Date & Time → Set Automatically

2. **Wait for New Code:**
   - TOTP codes expire every 30 seconds
   - Wait for a fresh code to generate
   - Don't reuse codes

3. **Use Backup Code:**
   - If authenticator app is unavailable
   - Use one of your backup codes
   - Each backup code works only once

4. **Re-setup 2FA:**
   - If authenticator app was reset/deleted
   - Contact support to disable 2FA
   - Re-enable and set up again

### Biometric Authentication Not Working

**Possible Causes:**
- Biometric hardware issue
- Browser doesn't support WebAuthn
- Biometric data changed
- Local storage cleared

**Solutions:**

1. **Use Master Password:**
   - Click "Use Password Instead"
   - Enter your master password
   - This always works as fallback

2. **Re-register Biometric:**
   - Settings → Security → Biometric Authentication
   - Disable and re-enable
   - Follow setup prompts again

3. **Check Browser Support:**
   - Update browser to latest version
   - Try different browser
   - Check if WebAuthn is supported

4. **Check Device Settings:**
   - Ensure biometric is enabled on device
   - Re-register fingerprint/face if changed
   - Check device security settings

### Account Locked After Failed Attempts

**Cause:** Too many failed login attempts triggered security lockout.

**Solution:**
1. Wait for the lockout period to expire (starts at 30 seconds)
2. Lockout time increases with repeated failures (exponential backoff)
3. After waiting, try again with correct password
4. If you forgot password, use recovery key

---

## Sync Problems

### Changes Not Syncing

**Possible Causes:**
- No internet connection
- Server issues
- Browser blocking sync
- Sync queue full

**Solutions:**

1. **Check Internet Connection:**
   - Verify you're online
   - Try loading another website
   - Check Wi-Fi/cellular connection

2. **Force Manual Sync:**
   - Click the sync icon in toolbar
   - Or Settings → Data Management → Sync Now
   - Wait for sync to complete

3. **Check Sync Status:**
   - Look at sync indicator
   - Green checkmark = synced
   - Blue spinning = syncing
   - Red X = error

4. **Clear Sync Queue:**
   - Settings → Data Management
   - View pending changes
   - Clear queue if stuck
   - Changes will re-sync

5. **Log Out and Back In:**
   - Sometimes resolves sync issues
   - Ensure sync completes before logging out
   - Log back in to re-sync

### Sync Conflicts

**Cause:** Changes made on multiple devices while offline.

**What Happens:**
- Last-write-wins strategy is used
- Most recent change is kept
- You're notified of the conflict

**Solutions:**

1. **Review Conflict:**
   - Check notification for details
   - See which version was kept
   - Review the changes

2. **Manual Resolution:**
   - If wrong version was kept
   - Manually update the credential
   - Make the desired changes

3. **Prevent Future Conflicts:**
   - Let sync complete before switching devices
   - Avoid editing same credential on multiple devices simultaneously
   - Use manual sync before making changes

### Sync Taking Too Long

**Possible Causes:**
- Large vault size
- Slow internet connection
- Server load
- Many pending changes

**Solutions:**

1. **Be Patient:**
   - Large vaults take time to sync
   - Don't interrupt the process
   - Wait for completion

2. **Check Internet Speed:**
   - Test your connection speed
   - Use faster connection if available
   - Avoid syncing on slow networks

3. **Reduce Vault Size:**
   - Delete unused credentials
   - Remove old items from trash
   - Archive rarely-used credentials

4. **Sync During Off-Peak:**
   - Try syncing at different times
   - Avoid peak usage hours
   - Use Wi-Fi instead of cellular

---

## Performance Issues

### App Running Slowly

**Possible Causes:**
- Large vault size
- Low device memory
- Browser cache full
- Too many browser tabs/extensions
- Outdated browser

**Solutions:**

1. **Clear Browser Cache:**
   - Browser settings → Clear browsing data
   - Select cached images and files
   - Don't clear passwords or site data
   - Restart browser

2. **Close Unnecessary Tabs:**
   - Close other browser tabs
   - Disable unused extensions
   - Restart browser

3. **Update Browser:**
   - Check for browser updates
   - Install latest version
   - Restart browser after update

4. **Clear App Cache:**
   - Settings → Data Management → Clear Cache
   - This removes local cached data
   - You'll need to re-sync

5. **Reduce Vault Size:**
   - Delete unused credentials
   - Empty trash folder
   - Archive old items

6. **Check Device Resources:**
   - Close other applications
   - Restart device
   - Free up storage space
   - Check available RAM

### Search Is Slow

**Possible Causes:**
- Large number of credentials
- Complex search query
- Browser performance

**Solutions:**

1. **Use More Specific Search:**
   - Type more characters
   - Use exact matches
   - Filter by folder or tag first

2. **Organize Vault:**
   - Use folders to reduce search scope
   - Add tags for better filtering
   - Keep vault organized

3. **Clear Cache:**
   - Settings → Data Management → Clear Cache
   - Rebuild search index
   - Re-sync vault

### Password Generator Slow

**Cause:** Generating very long passwords or many passwords quickly.

**Solutions:**
1. Use reasonable length (16-32 characters is sufficient)
2. Wait a moment between generations
3. Close other applications
4. Try different browser

---

## Installation Problems

### Cannot Install PWA

**Possible Causes:**
- Browser doesn't support PWA
- Already installed
- HTTPS requirement not met
- Service worker issues

**Solutions:**

1. **Check Browser Support:**
   - Chrome, Edge, Brave: Full support
   - Firefox: Limited support
   - Safari: iOS 14+ required
   - Update to latest browser version

2. **Check If Already Installed:**
   - Look in app drawer/home screen
   - Check browser apps list
   - Uninstall and reinstall if needed

3. **Clear Browser Data:**
   - Clear cache and cookies
   - Restart browser
   - Try installing again

4. **Manual Installation:**
   - **Desktop**: Look for install icon in address bar
   - **iOS**: Share → Add to Home Screen
   - **Android**: Menu → Add to Home Screen

### PWA Not Updating

**Cause:** Service worker not updating or browser cache.

**Solutions:**

1. **Force Update:**
   - Close all PWA windows
   - Clear browser cache
   - Reopen PWA
   - Should prompt for update

2. **Manual Update:**
   - Uninstall PWA
   - Clear browser data
   - Reinstall PWA

3. **Check for Update Prompt:**
   - Look for update notification
   - Click "Update" when prompted
   - Refresh page if needed

### PWA Won't Open

**Possible Causes:**
- Corrupted installation
- Browser issues
- Service worker error

**Solutions:**

1. **Restart Device:**
   - Simple restart often fixes issues
   - Try opening PWA again

2. **Reinstall PWA:**
   - Uninstall the PWA
   - Clear browser cache
   - Reinstall from browser

3. **Use Browser Version:**
   - Open in regular browser
   - Navigate to Password Manager URL
   - Use while troubleshooting PWA

---

## Encryption Errors

### "Decryption Failed" Error

**Possible Causes:**
- Incorrect master password
- Corrupted data
- Browser compatibility issue
- Interrupted encryption process

**Solutions:**

1. **Verify Master Password:**
   - Ensure you're using correct password
   - Check Caps Lock
   - Try typing in text editor first

2. **Clear Local Data:**
   - Settings → Data Management → Clear Cache
   - Log out and log back in
   - Data will re-sync from server

3. **Try Different Browser:**
   - Some browsers have better crypto support
   - Try Chrome, Firefox, or Edge
   - Update browser to latest version

4. **Contact Support:**
   - If error persists
   - Provide error details
   - We'll help recover your data

### "Encryption Error" When Saving

**Possible Causes:**
- Browser crypto API issue
- Insufficient memory
- Corrupted encryption keys

**Solutions:**

1. **Refresh Page:**
   - Save your changes elsewhere first
   - Refresh the page
   - Try saving again

2. **Restart Browser:**
   - Close all browser windows
   - Restart browser
   - Try again

3. **Check Browser Console:**
   - Press F12 to open developer tools
   - Check Console tab for errors
   - Share errors with support

4. **Try Different Browser:**
   - Test in another browser
   - If it works, browser-specific issue
   - Update or reinstall problematic browser

### Cannot Decrypt Shared Credential

**Possible Causes:**
- Sharing keys not synced
- Corrupted share data
- Sender revoked access

**Solutions:**

1. **Refresh Page:**
   - Force sync
   - Refresh browser
   - Try accessing again

2. **Check Access:**
   - Verify sender hasn't revoked access
   - Contact sender to confirm
   - Ask them to re-share if needed

3. **Log Out and Back In:**
   - Complete logout
   - Log back in
   - Re-sync all data

---

## Import/Export Issues

### Import Fails

**Possible Causes:**
- Incorrect file format
- Malformed CSV
- Missing required columns
- File encoding issues

**Solutions:**

1. **Check File Format:**
   - Must be CSV format
   - Required columns: title, url, username, password
   - Optional columns: notes, folder, tags

2. **Verify CSV Structure:**
   - Open in text editor or Excel
   - Check for proper headers
   - Ensure no missing commas
   - Check for special characters

3. **Fix Encoding:**
   - Save as UTF-8 encoding
   - Remove special characters if needed
   - Use plain text editor to verify

4. **Import in Batches:**
   - If file is large, split into smaller files
   - Import one batch at a time
   - Easier to identify problematic entries

5. **Check Example Format:**
   ```csv
   title,url,username,password,notes
   Gmail,https://gmail.com,user@email.com,password123,My email
   Facebook,https://facebook.com,user@email.com,pass456,Social media
   ```

### Export Fails

**Possible Causes:**
- Browser blocking download
- Insufficient permissions
- Large vault size
- Memory issues

**Solutions:**

1. **Check Browser Settings:**
   - Allow downloads from Password Manager
   - Check download location permissions
   - Disable download blocking extensions

2. **Try Different Format:**
   - Try CSV instead of JSON
   - Try unencrypted if encrypted fails
   - Smaller file size may help

3. **Export in Batches:**
   - Export by folder
   - Combine files manually later
   - Easier for large vaults

4. **Free Up Memory:**
   - Close other applications
   - Close browser tabs
   - Restart browser
   - Try again

### Duplicate Detection Not Working

**Cause:** Duplicates have slight differences in data.

**Solutions:**

1. **Manual Review:**
   - Review import preview carefully
   - Manually select duplicates
   - Choose merge or skip

2. **Clean Source Data:**
   - Before importing, clean up source file
   - Remove obvious duplicates
   - Standardize formatting

3. **Import and Clean:**
   - Import all entries
   - Use search to find duplicates
   - Manually delete duplicates

---

## Mobile-Specific Issues

### PWA Not Working on iPhone

**Possible Causes:**
- iOS version too old
- Safari issues
- Storage full

**Solutions:**

1. **Update iOS:**
   - Settings → General → Software Update
   - Install latest iOS version
   - Requires iOS 14 or later

2. **Reinstall PWA:**
   - Delete from home screen
   - Open in Safari
   - Share → Add to Home Screen

3. **Clear Safari Data:**
   - Settings → Safari → Clear History and Website Data
   - Reinstall PWA

4. **Free Up Storage:**
   - Delete unused apps
   - Clear photos/videos
   - Need at least 1GB free

### Biometric Not Working on Mobile

**Possible Causes:**
- Biometric not set up on device
- App doesn't have permission
- Biometric data changed

**Solutions:**

1. **Check Device Settings:**
   - iOS: Settings → Face ID & Passcode or Touch ID & Passcode
   - Android: Settings → Security → Biometric
   - Ensure biometric is enabled

2. **Re-register in App:**
   - Settings → Security → Biometric Authentication
   - Disable and re-enable
   - Follow setup prompts

3. **Grant Permissions:**
   - Check app permissions in device settings
   - Allow biometric access
   - Restart app

### Keyboard Not Showing Correctly

**Possible Causes:**
- Wrong input type
- Browser issue
- Keyboard app issue

**Solutions:**

1. **Check Input Type:**
   - Email fields should show email keyboard
   - Password fields should show password keyboard
   - URL fields should show URL keyboard

2. **Restart Keyboard:**
   - Close and reopen keyboard
   - Switch to different keyboard and back
   - Restart app

3. **Update Keyboard App:**
   - Update third-party keyboard apps
   - Try default keyboard
   - Check keyboard settings

### Copy to Clipboard Not Working on Mobile

**Possible Causes:**
- Browser clipboard permissions
- iOS/Android restrictions
- Clipboard manager interference

**Solutions:**

1. **Grant Clipboard Permission:**
   - Allow clipboard access when prompted
   - Check app permissions in settings

2. **Manual Copy:**
   - Tap and hold on password
   - Select "Copy"
   - Paste where needed

3. **Disable Clipboard Manager:**
   - Temporarily disable third-party clipboard apps
   - Test with default clipboard

---

## Browser-Specific Issues

### Chrome/Edge Issues

**Common Problems:**
- Extensions interfering
- Sync conflicts with Google account
- Memory usage

**Solutions:**

1. **Disable Extensions:**
   - Temporarily disable all extensions
   - Test Password Manager
   - Re-enable extensions one by one

2. **Clear Chrome Data:**
   - Settings → Privacy → Clear browsing data
   - Select cache and cookies
   - Don't clear passwords

3. **Disable Chrome Sync:**
   - If conflicts with Chrome password manager
   - Settings → Sync → Manage what you sync
   - Disable password sync

### Firefox Issues

**Common Problems:**
- Enhanced Tracking Protection blocking
- Container tabs issues
- Private browsing limitations

**Solutions:**

1. **Adjust Tracking Protection:**
   - Click shield icon in address bar
   - Turn off Enhanced Tracking Protection for Password Manager
   - Or add to exceptions

2. **Disable Container Tabs:**
   - Container tabs can cause issues
   - Use Password Manager in default container
   - Or disable containers temporarily

3. **Check Private Browsing:**
   - Some features limited in private mode
   - Use normal browsing for full functionality

### Safari Issues

**Common Problems:**
- Intelligent Tracking Prevention
- Cross-site tracking prevention
- Storage limitations

**Solutions:**

1. **Disable Tracking Prevention:**
   - Safari → Preferences → Privacy
   - Uncheck "Prevent cross-site tracking" for Password Manager
   - Or add to exceptions

2. **Allow Cookies:**
   - Safari → Preferences → Privacy
   - Ensure cookies are allowed
   - Don't block all cookies

3. **Clear Safari Data:**
   - Safari → Clear History
   - Select time range
   - Clear cache and cookies

---

## Network and Connectivity

### "Network Error" Message

**Possible Causes:**
- No internet connection
- Firewall blocking
- VPN issues
- Server downtime

**Solutions:**

1. **Check Internet:**
   - Try loading other websites
   - Check Wi-Fi/cellular connection
   - Restart router if needed

2. **Check Firewall:**
   - Ensure Password Manager isn't blocked
   - Add to firewall exceptions
   - Check corporate firewall settings

3. **Disable VPN Temporarily:**
   - Some VPNs cause issues
   - Disable VPN and test
   - Try different VPN server

4. **Check Server Status:**
   - Visit status.passwordmanager.com
   - Check for known outages
   - Wait and try again later

### Slow Loading

**Possible Causes:**
- Slow internet connection
- Server load
- Large vault size
- Network congestion

**Solutions:**

1. **Check Internet Speed:**
   - Test connection speed
   - Use faster connection if available
   - Try different network

2. **Use Offline Mode:**
   - If already synced, work offline
   - Changes will sync later
   - Faster for viewing credentials

3. **Optimize Vault:**
   - Reduce vault size
   - Delete unused credentials
   - Archive old items

### Cannot Connect to Server

**Possible Causes:**
- Server maintenance
- DNS issues
- Network blocking
- Incorrect URL

**Solutions:**

1. **Verify URL:**
   - Ensure you're using correct URL
   - Check for typos
   - Use official link

2. **Try Different DNS:**
   - Use Google DNS (8.8.8.8)
   - Or Cloudflare DNS (1.1.1.1)
   - Change in network settings

3. **Check Status Page:**
   - Visit status.passwordmanager.com
   - Check for maintenance windows
   - Follow updates

4. **Contact Support:**
   - If server appears down
   - Report the issue
   - Get status updates

---

## Data and Storage Issues

### "Storage Full" Error

**Possible Causes:**
- Browser storage quota exceeded
- Device storage full
- Too many cached credentials

**Solutions:**

1. **Clear App Cache:**
   - Settings → Data Management → Clear Cache
   - Removes local cached data
   - Will re-sync from server

2. **Free Device Storage:**
   - Delete unused apps
   - Clear photos/videos
   - Move files to external storage

3. **Reduce Vault Size:**
   - Delete unused credentials
   - Empty trash folder
   - Remove old secure notes

4. **Use Different Browser:**
   - Some browsers have larger quotas
   - Try Chrome or Firefox
   - Transfer data via sync

### Data Not Saving

**Possible Causes:**
- Storage full
- Browser blocking
- Sync issues
- Encryption error

**Solutions:**

1. **Check Storage:**
   - Ensure sufficient storage available
   - Clear cache if needed
   - Free up space

2. **Force Sync:**
   - Click sync icon
   - Wait for sync to complete
   - Verify data saved

3. **Try Again:**
   - Refresh page
   - Re-enter data
   - Save again

4. **Check Browser Console:**
   - Press F12
   - Look for errors
   - Share with support

### Missing Credentials

**Possible Causes:**
- Sync not complete
- Deleted accidentally
- Wrong account
- Filter applied

**Solutions:**

1. **Check Sync Status:**
   - Ensure sync is complete
   - Force manual sync
   - Wait for sync to finish

2. **Check Trash:**
   - Look in trash folder
   - Restore if found
   - Items stay 30 days

3. **Check Filters:**
   - Clear all filters
   - Clear search
   - Check all folders

4. **Verify Account:**
   - Ensure you're logged into correct account
   - Check email address
   - Try other accounts if you have multiple

5. **Check Audit Log:**
   - See if credential was deleted
   - Check who deleted it
   - When it was deleted

---

## Getting More Help

### Before Contacting Support

**Gather Information:**
1. What were you trying to do?
2. What happened instead?
3. What browser and version?
4. What device and OS?
5. Any error messages?
6. Steps to reproduce?

**Try Basic Troubleshooting:**
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Restart device
5. Check internet connection

### Contact Support

**Email:** support@passwordmanager.com

**Include:**
- Detailed description of issue
- Steps to reproduce
- Browser and version
- Device and OS
- Screenshots (if applicable)
- Error messages
- Your email (not master password!)

**Response Time:**
- Usually within 24 hours
- Urgent issues prioritized
- Security issues: security@passwordmanager.com

### Community Help

**Forum:** community.passwordmanager.com
- Search existing topics
- Ask questions
- Share solutions
- Help others

### Report Bugs

**GitHub:** github.com/passwordmanager/issues
- Check existing issues
- Create new issue
- Provide details
- Follow template

### Emergency Support

**Security Issues:** security@passwordmanager.com
- For security vulnerabilities
- Suspected breaches
- Account compromises
- Confidential reporting

---

## Diagnostic Tools

### Browser Console

**How to Access:**
- Chrome/Edge/Firefox: Press F12
- Safari: Develop → Show JavaScript Console
- Mobile: Use desktop browser

**What to Look For:**
- Red error messages
- Network errors
- JavaScript errors
- Failed requests

### Network Tab

**How to Use:**
1. Open browser console (F12)
2. Click Network tab
3. Reproduce issue
4. Look for failed requests (red)
5. Check response codes

**Common Codes:**
- 200: Success
- 401: Authentication failed
- 403: Forbidden
- 404: Not found
- 429: Rate limited
- 500: Server error

### Application Tab

**How to Use:**
1. Open browser console (F12)
2. Click Application tab
3. Check:
   - Local Storage
   - IndexedDB
   - Service Workers
   - Cache Storage

**What to Check:**
- Storage quota
- Cached data
- Service worker status
- Stored credentials (encrypted)

---

## Prevention Tips

### Avoid Common Issues

1. **Keep Software Updated:**
   - Update browser regularly
   - Update OS regularly
   - Update PWA when prompted

2. **Regular Maintenance:**
   - Clear cache monthly
   - Review vault quarterly
   - Delete unused credentials
   - Empty trash regularly

3. **Good Practices:**
   - Let sync complete before closing
   - Don't interrupt encryption
   - Use strong internet connection
   - Backup regularly

4. **Monitor Health:**
   - Check sync status
   - Review audit logs
   - Monitor security dashboard
   - Watch for errors

---

*Last Updated: 2026*
*Version: 1.0*

*If your issue isn't covered here, please contact support@passwordmanager.com*
