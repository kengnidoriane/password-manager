# Import and Export Guide

Complete guide for importing passwords from other services and exporting your Password Manager vault.

## Table of Contents

1. [Overview](#overview)
2. [Importing Credentials](#importing-credentials)
3. [Exporting Your Vault](#exporting-your-vault)
4. [Migration Guides](#migration-guides)
5. [Backup Strategies](#backup-strategies)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Import/Export?

**Import:**
- Migrate from another password manager
- Import browser-saved passwords
- Consolidate multiple password sources
- Restore from backup

**Export:**
- Create backups
- Migrate to another service
- Share with team (encrypted)
- Archive old data

### Security Considerations

**Before Importing:**
- Verify source file is from trusted source
- Scan file for malware
- Review contents before importing
- Delete source file after import

**Before Exporting:**
- Understand security implications
- Use encrypted export when possible
- Delete export file after use
- Never email unencrypted exports

---

## Importing Credentials

### Supported Import Sources

Password Manager supports CSV imports from:
- Google Chrome
- Mozilla Firefox
- Apple Safari
- Microsoft Edge
- LastPass
- 1Password
- Bitwarden
- Dashlane
- KeePass
- Generic CSV files

### General Import Process

**Step 1: Export from Current Service**
1. Follow service-specific instructions below
2. Save CSV file to secure location
3. Note the file location

**Step 2: Import to Password Manager**
1. Log into Password Manager
2. Go to **Settings → Data Management**
3. Click **"Import Credentials"**
4. Select your CSV file
5. Review import preview
6. Handle duplicates (skip, merge, or keep both)
7. Click **"Import"**
8. Review import summary

**Step 3: Verify and Clean Up**
1. Check imported credentials
2. Verify passwords work
3. Organize into folders
4. Add tags as needed
5. Delete source CSV file securely

### CSV File Format

**Required Columns:**
- `title` or `name`: Credential name
- `url` or `website`: Website URL
- `username` or `login`: Username or email
- `password`: Password

**Optional Columns:**
- `notes` or `note`: Additional notes
- `folder`: Folder name
- `tags`: Comma-separated tags
- `totp`: 2FA secret (if supported)

**Example CSV:**
```csv
title,url,username,password,notes,folder,tags
Gmail,https://gmail.com,user@email.com,SecurePass123!,My email account,Personal,email;important
Facebook,https://facebook.com,user@email.com,AnotherPass456!,Social media,Personal,social
Bank Account,https://bank.com,john.doe,BankPass789!,Checking account,Finance,banking;important
```

---

## Migration Guides

### From Google Chrome

**Export from Chrome:**

1. **Open Chrome Password Manager:**
   - Go to `chrome://settings/passwords`
   - Or Settings → Autofill → Password Manager

2. **Export Passwords:**
   - Click the three-dot menu (⋮) next to "Saved Passwords"
   - Select "Export passwords"
   - Enter your computer password to confirm
   - Choose save location
   - File saved as `Chrome Passwords.csv`

3. **Import to Password Manager:**
   - Follow general import process above
   - Chrome CSV format is automatically recognized

**Chrome CSV Format:**
```csv
name,url,username,password
Gmail,https://gmail.com,user@email.com,password123
```

**Notes:**
- Chrome doesn't export notes or folders
- URLs are automatically detected
- Duplicates may exist if you have multiple Chrome profiles

### From Mozilla Firefox

**Export from Firefox:**

1. **Open Firefox Password Manager:**
   - Go to `about:logins`
   - Or Menu → Passwords

2. **Export Passwords:**
   - Click the three-dot menu (⋮)
   - Select "Export Logins"
   - Choose save location
   - File saved as `logins.csv`

3. **Import to Password Manager:**
   - Follow general import process above
   - Firefox CSV format is automatically recognized

**Firefox CSV Format:**
```csv
url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged
https://gmail.com,user@email.com,password123,,,{guid},1234567890,1234567890,1234567890
```

**Notes:**
- Firefox includes timestamps (not imported)
- httpRealm and formActionOrigin are ignored
- GUIDs are not used

### From Apple Safari

**Export from Safari:**

1. **Open Keychain Access:**
   - Applications → Utilities → Keychain Access
   - Or Spotlight search "Keychain Access"

2. **Export Passwords:**
   - Select "Passwords" category
   - Select all items (Cmd+A)
   - File → Export Items
   - Choose format: "Comma Separated Values (.csv)"
   - Save file

3. **Format for Import:**
   - Safari export may need formatting
   - Ensure columns match required format
   - Use spreadsheet software to adjust if needed

4. **Import to Password Manager:**
   - Follow general import process above

**Notes:**
- Safari export includes all keychain items (not just passwords)
- May need manual cleanup before import
- Consider exporting only password items

### From Microsoft Edge

**Export from Edge:**

1. **Open Edge Password Manager:**
   - Go to `edge://settings/passwords`
   - Or Settings → Profiles → Passwords

2. **Export Passwords:**
   - Click the three-dot menu (⋮) next to "Saved passwords"
   - Select "Export passwords"
   - Enter your computer password to confirm
   - Choose save location
   - File saved as `Microsoft Edge Passwords.csv`

3. **Import to Password Manager:**
   - Follow general import process above
   - Edge CSV format is same as Chrome

**Edge CSV Format:**
```csv
name,url,username,password
Gmail,https://gmail.com,user@email.com,password123
```

### From LastPass

**Export from LastPass:**

1. **Log into LastPass:**
   - Open LastPass browser extension
   - Or go to lastpass.com

2. **Export Vault:**
   - Click Account Options (profile icon)
   - Select "Advanced" → "Export"
   - Enter master password
   - Copy exported data or save as file

3. **Save as CSV:**
   - If copied, paste into text editor
   - Save as `lastpass_export.csv`

4. **Import to Password Manager:**
   - Follow general import process above
   - LastPass format is automatically recognized

**LastPass CSV Format:**
```csv
url,username,password,extra,name,grouping,fav
https://gmail.com,user@email.com,password123,notes,Gmail,Email,0
```

**Notes:**
- `grouping` becomes folder name
- `extra` becomes notes
- `fav` (favorites) is not imported
- Secure notes are included

### From 1Password

**Export from 1Password:**

1. **Open 1Password:**
   - Launch 1Password application

2. **Export Vault:**
   - File → Export → All Items
   - Or select specific vault to export
   - Choose format: "CSV"
   - Enter master password
   - Save file

3. **Import to Password Manager:**
   - Follow general import process above
   - 1Password format is automatically recognized

**1Password CSV Format:**
```csv
Title,URL,Username,Password,Notes,Type
Gmail,https://gmail.com,user@email.com,password123,My email,Login
```

**Notes:**
- Multiple vaults require separate exports
- Attachments are not exported
- Custom fields may not import

### From Bitwarden

**Export from Bitwarden:**

1. **Log into Bitwarden:**
   - Open Bitwarden app or extension
   - Or go to vault.bitwarden.com

2. **Export Vault:**
   - Tools → Export Vault
   - Choose format: ".csv"
   - Enter master password
   - Click "Export Vault"
   - Save file

3. **Import to Password Manager:**
   - Follow general import process above
   - Bitwarden format is automatically recognized

**Bitwarden CSV Format:**
```csv
folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
Email,1,login,Gmail,My email,,,https://gmail.com,user@email.com,password123,
```

**Notes:**
- `folder` becomes folder name
- `favorite` is not imported
- `login_totp` (2FA secrets) may not import
- Attachments are not exported

### From Dashlane

**Export from Dashlane:**

1. **Open Dashlane:**
   - Launch Dashlane application

2. **Export Data:**
   - File → Export → Unsecured archive (readable) in CSV
   - Enter master password
   - Choose save location
   - Save file

3. **Import to Password Manager:**
   - Follow general import process above
   - Dashlane format is automatically recognized

**Dashlane CSV Format:**
```csv
username,username2,username3,title,password,note,url,category
user@email.com,,,Gmail,password123,My email,https://gmail.com,
```

**Notes:**
- Multiple username fields (use first non-empty)
- `category` becomes folder name
- Secure notes are included

### From KeePass

**Export from KeePass:**

1. **Open KeePass:**
   - Launch KeePass application
   - Open your database

2. **Export Entries:**
   - File → Export
   - Choose format: "CSV"
   - Select entries to export (or all)
   - Save file

3. **Import to Password Manager:**
   - Follow general import process above
   - May need to adjust column names

**KeePass CSV Format:**
```csv
Account,Login Name,Password,Web Site,Comments
Gmail,user@email.com,password123,https://gmail.com,My email account
```

**Notes:**
- Column names may vary
- Adjust to match required format
- Groups become folders

---

## Exporting Your Vault

### Export Options

**Format Options:**
1. **CSV (Comma-Separated Values)**
   - Compatible with most services
   - Human-readable
   - Easy to edit
   - Recommended for migration

2. **JSON (JavaScript Object Notation)**
   - Includes all metadata
   - Preserves folder structure
   - Includes tags and notes
   - Recommended for backups

**Encryption Options:**
1. **Encrypted Export**
   - Protected with password you choose
   - Safe for storage and transfer
   - Recommended for backups
   - Requires password to import

2. **Unencrypted Export**
   - Plain text - anyone can read
   - Only for immediate migration
   - Delete immediately after use
   - **Security risk if not handled properly**

### Export Process

**Step 1: Prepare for Export**
1. Ensure all changes are synced
2. Decide on format (CSV or JSON)
3. Decide on encryption (encrypted or unencrypted)
4. Choose secure save location

**Step 2: Export Vault**
1. Log into Password Manager
2. Go to **Settings → Data Management**
3. Click **"Export Vault"**
4. Enter your master password (required for security)
5. Choose format:
   - CSV: For migration to other services
   - JSON: For backups or full data export
6. Choose encryption:
   - Encrypted: Enter encryption password (recommended)
   - Unencrypted: Confirm security warning
7. Click **"Export"**
8. Save file to secure location

**Step 3: Secure the Export**
1. Verify file downloaded successfully
2. If unencrypted, use immediately
3. If encrypted, store securely
4. Delete unencrypted exports after use
5. Log export in your records

### Export File Formats

**CSV Export Format:**
```csv
title,url,username,password,notes,folder,tags,created,modified
Gmail,https://gmail.com,user@email.com,SecurePass123!,My email,Personal,"email,important",2026-01-01,2026-01-15
Facebook,https://facebook.com,user@email.com,AnotherPass456!,Social media,Personal,social,2026-01-02,2026-01-16
```

**JSON Export Format:**
```json
{
  "version": "1.0",
  "exported": "2026-02-10T12:00:00Z",
  "credentials": [
    {
      "id": "uuid-1",
      "title": "Gmail",
      "url": "https://gmail.com",
      "username": "user@email.com",
      "password": "SecurePass123!",
      "notes": "My email",
      "folder": "Personal",
      "tags": ["email", "important"],
      "created": "2026-01-01T10:00:00Z",
      "modified": "2026-01-15T14:30:00Z",
      "lastUsed": "2026-02-09T09:15:00Z"
    }
  ],
  "folders": [
    {
      "id": "folder-1",
      "name": "Personal",
      "parent": null
    }
  ],
  "secureNotes": [
    {
      "id": "note-1",
      "title": "Important Info",
      "content": "Encrypted note content",
      "folder": "Personal",
      "created": "2026-01-05T11:00:00Z"
    }
  ]
}
```

### Encrypted Export

**How It Works:**
1. You choose an encryption password
2. Vault is encrypted with AES-256
3. Encrypted file is downloaded
4. Password required to decrypt

**Encryption Password Guidelines:**
- Different from master password
- Strong and memorable
- Store separately from export file
- Share securely if needed

**Using Encrypted Exports:**
- Safe to store in cloud storage
- Safe to email (if password shared separately)
- Safe for long-term backup
- Requires password to import

### Unencrypted Export

**⚠️ Security Warning:**
- Anyone with the file can read your passwords
- Do not email or share
- Do not store in cloud
- Delete immediately after use

**When to Use:**
- Immediate migration to another service
- Temporary transfer to another device
- When encryption is not supported by target service

**Safety Measures:**
1. Use only on trusted device
2. Save to encrypted drive if possible
3. Delete immediately after use
4. Empty trash/recycle bin
5. Consider secure file deletion tool

---

## Backup Strategies

### Backup Frequency

**Recommended Schedule:**
- **Monthly**: For regular users
- **Weekly**: If you add/change passwords frequently
- **Before major changes**: Master password change, device change, etc.
- **Before migration**: Always backup before switching services

### Backup Storage

**Local Backups:**
- Encrypted external hard drive
- Encrypted USB drive
- Multiple copies in different locations
- Fireproof safe for critical backups

**Cloud Backups:**
- Use encrypted exports only
- Store in encrypted cloud storage (Dropbox, Google Drive, OneDrive)
- Use additional encryption (7-Zip, VeraCrypt)
- Don't rely solely on cloud

**Backup Rotation:**
- Keep last 3 monthly backups
- Keep last 12 weekly backups (if applicable)
- Delete older backups securely
- Test backups periodically

### Backup Testing

**Test Your Backups:**
1. Create test account
2. Import backup file
3. Verify all data imported correctly
4. Test encryption password works
5. Delete test account

**Test Schedule:**
- Test new backup method immediately
- Test quarterly for regular backups
- Test before relying on backup for recovery

### Backup Security

**Protect Your Backups:**
1. Always use encrypted exports
2. Store encryption password separately
3. Use strong encryption passwords
4. Limit access to backup files
5. Monitor backup file access

**Backup Locations:**
- ✅ Encrypted external drive in safe
- ✅ Bank safety deposit box
- ✅ Encrypted cloud storage
- ✅ Trusted family member (encrypted)
- ❌ Unencrypted cloud storage
- ❌ Email attachments
- ❌ Shared network drives
- ❌ Public computers

---

## Troubleshooting

### Import Issues

**Problem: Import Fails**

**Solutions:**
1. Check file format (must be CSV)
2. Verify required columns exist
3. Check for special characters
4. Try opening in text editor to verify format
5. Remove problematic rows
6. Import in smaller batches

**Problem: Duplicates Not Detected**

**Solutions:**
1. Duplicates may have slight differences
2. Manually review import preview
3. Use search after import to find duplicates
4. Delete duplicates manually

**Problem: Passwords Not Working After Import**

**Solutions:**
1. Verify passwords copied correctly
2. Check for extra spaces or characters
3. Some services may have changed passwords
4. Update passwords as needed

### Export Issues

**Problem: Export Fails**

**Solutions:**
1. Check browser allows downloads
2. Try different format (CSV vs JSON)
3. Try unencrypted if encrypted fails
4. Export in batches (by folder)
5. Free up disk space
6. Try different browser

**Problem: Cannot Open Exported File**

**Solutions:**
1. Verify file downloaded completely
2. Check file extension (.csv or .json)
3. Try opening in text editor
4. If encrypted, verify password is correct
5. Re-export if file is corrupted

**Problem: Missing Data in Export**

**Solutions:**
1. Ensure sync completed before export
2. Check if data is in trash
3. Verify you're exporting from correct account
4. Try JSON format (includes more data)
5. Contact support if data is missing

### Migration Issues

**Problem: Target Service Won't Accept Import**

**Solutions:**
1. Check target service's import format requirements
2. Adjust CSV column names to match
3. Use spreadsheet software to reformat
4. Remove unsupported fields
5. Import in smaller batches

**Problem: Lost Data During Migration**

**Solutions:**
1. Check backup before migration
2. Verify data in target service
3. Re-import if needed
4. Keep Password Manager account active during transition
5. Restore from backup if necessary

---

## Best Practices

### Import Best Practices

1. **Backup First**: Always backup current vault before importing
2. **Review Preview**: Carefully review import preview
3. **Handle Duplicates**: Choose appropriate duplicate strategy
4. **Verify After**: Check imported credentials work
5. **Organize**: Add to folders and tags after import
6. **Clean Source**: Delete source file securely after import

### Export Best Practices

1. **Use Encryption**: Always use encrypted exports for backups
2. **Strong Password**: Use strong encryption password
3. **Secure Storage**: Store in secure location
4. **Delete Unencrypted**: Delete unencrypted exports immediately
5. **Test Backups**: Verify backups work
6. **Regular Schedule**: Export regularly for backups

### Migration Best Practices

1. **Plan Ahead**: Research target service requirements
2. **Backup Everything**: Create multiple backups before migration
3. **Test First**: Test with a few credentials first
4. **Gradual Transition**: Don't delete old service immediately
5. **Verify All**: Check all credentials work in new service
6. **Update Devices**: Update all devices with new service

---

## Security Checklist

### Before Import
- [ ] Verify source file is from trusted source
- [ ] Scan file for malware
- [ ] Backup current vault
- [ ] Review file contents
- [ ] Prepare for duplicates

### During Import
- [ ] Review import preview carefully
- [ ] Handle duplicates appropriately
- [ ] Watch for errors
- [ ] Don't interrupt process

### After Import
- [ ] Verify all credentials imported
- [ ] Test critical passwords work
- [ ] Organize into folders
- [ ] Add tags as needed
- [ ] Delete source file securely
- [ ] Update passwords if needed

### Before Export
- [ ] Ensure sync is complete
- [ ] Decide on format and encryption
- [ ] Choose secure save location
- [ ] Prepare encryption password (if using)

### During Export
- [ ] Enter master password correctly
- [ ] Choose appropriate options
- [ ] Verify file downloads completely
- [ ] Note file location

### After Export
- [ ] Verify file is readable
- [ ] Store securely
- [ ] Delete unencrypted exports
- [ ] Test encrypted exports
- [ ] Log export in records

---

## Additional Resources

### Tools

**CSV Editors:**
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Text editors (Notepad++, VS Code)

**File Encryption:**
- 7-Zip (Windows)
- VeraCrypt (All platforms)
- GPG (All platforms)
- Built-in encryption (macOS, Windows)

**Secure File Deletion:**
- Eraser (Windows)
- Secure Empty Trash (macOS)
- shred command (Linux)
- BleachBit (All platforms)

### Support

**Need Help?**
- User Guide: USER_GUIDE.md
- FAQ: FAQ.md
- Troubleshooting: TROUBLESHOOTING.md
- Support: support@passwordmanager.com

**Migration Assistance:**
- Email: support@passwordmanager.com
- Include: Current service, file format, any errors
- We'll help with format conversion if needed

---

*Last Updated: 2026*
*Version: 1.0*

*For service-specific migration help, contact support@passwordmanager.com*
