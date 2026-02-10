# Frequently Asked Questions (FAQ)

## General Questions

### What is Password Manager?

Password Manager is a secure, zero-knowledge Progressive Web Application (PWA) that helps you store, manage, and retrieve passwords across all your devices. It uses military-grade encryption (AES-256) to protect your data, and your master password never leaves your device.

### Is Password Manager free?

Please check our website for current pricing information. We offer various plans to suit different needs.

### What devices and browsers are supported?

**Browsers:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Devices:**
- Windows, macOS, Linux (via browser)
- iPhone, iPad (iOS 14+)
- Android phones and tablets (Android 10+)

### Do I need to install anything?

No installation required! Password Manager works in your browser. However, you can install it as a Progressive Web App (PWA) for a better experience:
- Faster loading
- Works offline
- App-like interface
- Appears in your app drawer/home screen

---

## Security Questions

### How secure is Password Manager?

Password Manager uses industry-standard security practices:

- **AES-256-GCM encryption**: Military-grade encryption for all data
- **Zero-knowledge architecture**: Your master password never leaves your device
- **PBKDF2 key derivation**: 100,000+ iterations to derive encryption keys
- **End-to-end encryption**: Data is encrypted before transmission
- **Two-factor authentication**: Optional extra security layer
- **Secure random generation**: Cryptographically secure password generation

### What is zero-knowledge encryption?

Zero-knowledge means the server never has access to your unencrypted data. All encryption and decryption happens on your device using your master password. Even if our servers were compromised, your data would remain encrypted and unreadable.

### Can Password Manager employees see my passwords?

No. Due to zero-knowledge encryption, we cannot see your passwords, credentials, or any other data you store. Everything is encrypted with your master password, which we never have access to.

### What happens if Password Manager gets hacked?

Even if our servers were compromised, attackers would only get encrypted data. Without your master password, the data is useless. This is the power of zero-knowledge encryption.

### How strong should my master password be?

Your master password should be:
- At least 12 characters (longer is better)
- Include uppercase and lowercase letters
- Include numbers and special characters
- Unique (not used anywhere else)
- Memorable (you'll need it often)

**Good examples:**
- `Correct-Horse-Battery-Staple-2026!`
- `MyDog#Loves$Pizza99`
- `Xk9#mP2$vL8@nQ5!wR7%`

### What if I forget my master password?

If you forget your master password, you can use your **recovery key** to reset it:

1. Click "Forgot Password" on the login page
2. Enter your recovery key
3. Set a new master password
4. Your vault will be re-encrypted with the new password

**Important**: If you lose both your master password AND recovery key, your data cannot be recovered. This is a consequence of zero-knowledge encryption.

### Should I enable two-factor authentication?

Yes! Two-factor authentication (2FA) adds an extra layer of security. Even if someone gets your master password, they can't access your account without the 2FA code from your authenticator app.

### Is biometric authentication secure?

Yes. Biometric authentication (fingerprint, face recognition) is secure because:
- Biometric data never leaves your device
- It's processed by your device's secure enclave
- Encrypted credentials are stored locally
- Master password is still required for sensitive operations

### How does Password Manager check for breached passwords?

We use the "k-anonymity" method:
1. Your password is hashed locally
2. Only the first 5 characters of the hash are sent to the breach database
3. The database returns all breached passwords matching those 5 characters
4. Your device checks if your full hash is in the list
5. Your actual password is never transmitted

This protects your privacy while checking against millions of breached passwords.

---

## Account Questions

### How do I create an account?

1. Open Password Manager in your browser
2. Click "Create Account"
3. Enter your email
4. Create a strong master password
5. Save your recovery key (shown once!)
6. Complete registration

### Can I change my email address?

Yes:
1. Go to Settings → Account
2. Click "Change Email"
3. Enter your new email
4. Verify the new email address
5. Your email is updated

### Can I change my master password?

Yes:
1. Go to Settings → Account
2. Click "Change Master Password"
3. Enter your current master password
4. Enter your new master password
5. Confirm the new password
6. All your data is re-encrypted automatically

**Note**: This process may take a few minutes if you have many credentials.

### How do I delete my account?

1. Go to Settings → Account
2. Click "Delete Account"
3. Enter your master password to confirm
4. Click "Permanently Delete"

**Warning**: This action cannot be undone. All your data will be permanently deleted.

### Can I have multiple accounts?

Yes, you can create multiple accounts with different email addresses. However, each account has its own separate vault - data is not shared between accounts.

---

## Sync and Offline Questions

### How does sync work?

Sync happens automatically:
- Changes sync within 5 seconds of making them
- Only encrypted data is transmitted
- All your devices stay up to date
- You can also manually sync by clicking the sync icon

### Can I use Password Manager offline?

Yes! Password Manager works fully offline:
- View all your cached credentials
- Add, edit, and delete credentials
- Generate passwords
- Search your vault
- Changes are queued and sync when you're back online

### What happens if I make changes on two devices while offline?

If you make conflicting changes on different devices while offline, Password Manager uses a "last-write-wins" strategy:
- The most recent change is kept
- You'll be notified of the conflict
- You can manually resolve if needed

### How do I force a sync?

Click the sync icon in the toolbar, or:
- Pull down to refresh (mobile)
- Go to Settings → Data Management → Sync Now

### Why isn't my data syncing?

Check these common issues:
1. **Internet connection**: Ensure you're online
2. **Login status**: Make sure you're logged in
3. **Sync queue**: Check if there are pending changes
4. **Browser issues**: Try refreshing the page
5. **Server status**: Check our status page

If problems persist, contact support.

---

## Password Management Questions

### How do I add a password?

1. Click "+ Add Credential"
2. Fill in the details (title, URL, username, password)
3. Optionally add to a folder or add tags
4. Click "Save"

### How do I use a saved password?

1. Find the credential in your vault (browse or search)
2. Click the copy icon next to the password
3. Paste it where you need it
4. The clipboard auto-clears after 60 seconds

### Can I see my password instead of copying it?

Yes, click the eye icon to reveal the password. Click again to hide it.

### How do I generate a strong password?

1. Click "Password Generator" in the menu
2. Adjust length and character types
3. Click "Generate"
4. Click "Copy" or "Save to Vault"

Or when creating/editing a credential, click the "Generate" button next to the password field.

### What makes a password strong?

A strong password has:
- **Length**: 16+ characters (longer is better)
- **Randomness**: Unpredictable combination of characters
- **Variety**: Mix of uppercase, lowercase, numbers, symbols
- **Uniqueness**: Different for every account
- **High entropy**: More bits of randomness

The password generator creates passwords with all these qualities.

### Should I use the same password for multiple accounts?

No! Each account should have a unique password. If one account is breached, others remain secure. Password Manager makes it easy to use unique passwords everywhere.

### How often should I change my passwords?

**For most accounts**: Change when:
- You suspect a breach
- The service reports a breach
- You've shared the password
- It's been flagged as weak or reused

**For critical accounts** (banking, email): Consider changing every 90 days.

**Don't change unnecessarily**: Frequent changes can lead to weaker passwords if you're not using a password manager.

### What should I do if a password is breached?

1. Change the password immediately
2. Check if you've reused it elsewhere
3. Change it on all other accounts where you used it
4. Enable 2FA on the affected account if available
5. Monitor the account for suspicious activity

---

## Organization Questions

### How do I organize my passwords?

Use **folders** and **tags**:

**Folders**: Hierarchical organization
- Create folders for categories (Work, Personal, Banking)
- Nest folders up to 5 levels deep
- Move credentials into folders

**Tags**: Flexible labeling
- Add multiple tags to each credential
- Filter by tags
- Use colors for visual organization

### Can I move multiple credentials at once?

Currently, credentials must be moved individually. Select a credential, edit it, and change its folder.

### How do I search for a password?

Use the search bar at the top:
- Type any part of the website name, URL, username, or tag
- Results appear in real-time
- Sorted by relevance and last used date

### Can I favorite certain passwords?

While there's no explicit "favorite" feature, you can:
- Create a "Favorites" folder
- Use a "favorite" tag
- Recently used passwords appear at the top of search results

---

## Sharing Questions

### How do I share a password with someone?

1. Open the credential
2. Click "Share"
3. Enter the recipient's email (they need a Password Manager account)
4. Set permissions (View Only or Can Edit)
5. Click "Share"

### Is sharing secure?

Yes! Shared credentials are encrypted end-to-end:
- Encrypted with the recipient's public key
- The server cannot decrypt shared credentials
- Only the recipient can decrypt and view

### Can I revoke access to a shared password?

Yes:
1. Open the credential
2. View the list of people with access
3. Click "Revoke" next to the person
4. They immediately lose access

### Can I see who accessed a shared password?

Yes, the audit log shows:
- Who accessed the credential
- When they accessed it
- What device they used

### What happens if I change a shared password?

Changes sync automatically to all recipients. They always see the latest version.

---

## Import and Export Questions

### How do I import passwords from another password manager?

1. **Export from your current password manager**:
   - Chrome: chrome://settings/passwords → Export
   - Firefox: about:logins → Export
   - LastPass, 1Password, Bitwarden: Check their export options

2. **Import to Password Manager**:
   - Go to Settings → Data Management
   - Click "Import Credentials"
   - Select your CSV file
   - Review duplicates and errors
   - Click "Import"

### What import formats are supported?

We support CSV files from:
- Chrome
- Firefox
- Safari
- LastPass
- 1Password
- Bitwarden
- Dashlane
- Generic CSV with columns: title, url, username, password, notes

### How do I export my passwords?

1. Go to Settings → Data Management
2. Click "Export Vault"
3. Enter your master password
4. Choose format (CSV or JSON)
5. Choose encryption (encrypted or unencrypted)
6. Click "Export"
7. Save the file securely

**Security tip**: Use encrypted export and delete the file after use.

### Should I export encrypted or unencrypted?

**Encrypted export** (recommended):
- Protected with a password you choose
- Safe for backups
- Can only be read with the encryption password

**Unencrypted export**:
- Plain text - anyone can read it
- Only use for migration to another service
- Delete immediately after use

### How often should I export my data?

Create encrypted backups:
- Monthly for regular users
- Weekly if you add/change passwords frequently
- Before major changes (changing master password, etc.)

Store backups securely (encrypted USB drive, secure cloud storage).

---

## Mobile Questions

### How do I install on my phone?

**iPhone/iPad**:
1. Open Password Manager in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android**:
1. Open Password Manager in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Add"

### Does it work offline on mobile?

Yes! Full offline functionality on mobile:
- View all cached credentials
- Add, edit, delete credentials
- Generate passwords
- Search your vault
- Auto-sync when back online

### Can I use biometric authentication on mobile?

Yes! Enable in Settings → Security → Biometric Authentication. Use fingerprint or face recognition for quick access.

### How do I copy passwords on mobile?

Tap the copy icon next to the password. It's copied to your clipboard and auto-clears after 60 seconds.

### Can I use Password Manager with mobile browsers?

Yes, but the experience is better as an installed PWA. The PWA provides:
- Faster loading
- Offline access
- Better integration
- App-like interface

---

## Technical Questions

### What encryption does Password Manager use?

- **AES-256-GCM**: For encrypting all vault data
- **PBKDF2**: For deriving keys from master password (100,000+ iterations)
- **SHA-256**: For hashing
- **Web Crypto API**: For all cryptographic operations

### Where is my data stored?

- **Encrypted data**: Stored on our secure servers
- **Cached data**: Stored locally in your browser (IndexedDB)
- **Master password**: Never stored anywhere - only you know it

### Is my data backed up?

Yes, encrypted data on our servers is backed up regularly. However, we recommend creating your own encrypted exports as an additional backup.

### What happens if I clear my browser data?

Clearing browser data removes the local cache. Your encrypted data is still on the server. Just log in again to re-download and decrypt your vault.

### Can I use Password Manager in incognito/private mode?

Yes, but:
- You'll need to log in each time
- No local caching (less offline functionality)
- Session ends when you close the window

### Does Password Manager work with browser extensions?

We're developing a browser extension for automatic form filling. Check our website for availability.

### What is a Progressive Web App (PWA)?

A PWA is a web application that:
- Can be installed like a native app
- Works offline
- Loads instantly
- Provides an app-like experience
- Updates automatically

---

## Troubleshooting Questions

### I can't log in. What should I do?

1. **Check your master password**: Make sure Caps Lock is off
2. **Check your internet connection**: You need to be online for first login
3. **Clear browser cache**: Try clearing cache and cookies
4. **Try another browser**: Test in a different browser
5. **Use recovery key**: If you forgot your password, use your recovery key

### My passwords aren't syncing. Why?

1. **Check internet connection**: Ensure you're online
2. **Check sync status**: Look at the sync indicator
3. **Force sync**: Click the sync icon
4. **Check for errors**: Look for error messages
5. **Try logging out and back in**: This often resolves sync issues

### The app is slow. How can I speed it up?

1. **Clear cache**: Settings → Data Management → Clear Cache
2. **Update browser**: Use the latest browser version
3. **Check device storage**: Ensure you have free space
4. **Reduce vault size**: Archive old credentials
5. **Check internet speed**: Slow connection affects sync

### I'm getting an "encryption error". What does this mean?

This usually means:
- Incorrect master password
- Corrupted local data
- Browser compatibility issue

**Solutions**:
1. Verify your master password is correct
2. Clear browser cache and log in again
3. Try a different browser
4. Contact support if the issue persists

### How do I report a bug?

1. **Check if it's a known issue**: See our GitHub issues page
2. **Gather information**:
   - What were you doing when the bug occurred?
   - What browser and version?
   - What device and OS?
   - Any error messages?
3. **Report it**:
   - GitHub: github.com/passwordmanager/issues
   - Email: support@passwordmanager.com

### How do I request a feature?

1. **Check existing requests**: See our GitHub discussions
2. **Submit your idea**:
   - GitHub: github.com/passwordmanager/discussions
   - Email: support@passwordmanager.com
3. **Describe the feature**:
   - What problem does it solve?
   - How would it work?
   - Why is it important?

---

## Privacy Questions

### What data does Password Manager collect?

We collect minimal data:
- **Account data**: Email address, encrypted vault data
- **Usage data**: Login times, device types (for security monitoring)
- **Audit logs**: Activity logs for security (retained 90 days)

We **never** collect:
- Your master password
- Your unencrypted credentials
- Your browsing history
- Personal information beyond email

### Do you sell my data?

No. We never sell, rent, or share your data with third parties. Your data is yours.

### Can I delete my data?

Yes. Delete your account in Settings → Account → Delete Account. All your data is permanently deleted from our servers.

### Do you use cookies?

We use minimal cookies:
- **Session cookie**: To keep you logged in
- **Preference cookies**: To remember your settings

No tracking or advertising cookies.

### Is Password Manager GDPR compliant?

Yes. We comply with GDPR and other privacy regulations. You have the right to:
- Access your data
- Export your data
- Delete your data
- Opt out of communications

---

## Billing Questions

### How much does Password Manager cost?

Please check our website for current pricing plans.

### Is there a free trial?

Check our website for current trial offers.

### What payment methods do you accept?

We accept major credit cards, PayPal, and other payment methods depending on your region.

### Can I cancel anytime?

Yes. You can cancel your subscription anytime from Settings → Billing. Your data remains accessible until the end of your billing period.

### What happens if I cancel?

- Your account remains active until the end of the billing period
- After that, you can still log in and export your data
- Your data is retained for 30 days, then deleted
- You can reactivate anytime within 30 days

---

## Still Have Questions?

- **User Guide**: See `USER_GUIDE.md` for detailed documentation
- **Troubleshooting**: See `TROUBLESHOOTING.md` for solutions to common issues
- **Security**: See `SECURITY_BEST_PRACTICES.md` for security guidance
- **Support**: Email support@passwordmanager.com
- **Community**: community.passwordmanager.com

---

*Last Updated: 2026*
*Version: 1.0*
