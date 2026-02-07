# URL Detection and Credential Highlighting

## Overview

The URL Detection feature automatically detects the current browser tab URL (when possible in PWA context) and highlights matching credentials in the vault for quick access. This feature helps users quickly find and access credentials for the website they're currently visiting.

## How It Works

### URL Detection

The `URLDetectionService` attempts to detect the current URL using multiple methods:

1. **Primary Method**: `window.location` - Gets the current page URL
2. **Fallback**: `document.referrer` - Limited usefulness but provides some context
3. **Change Detection**: Listens for navigation events (popstate, pushstate, replacestate)
4. **Focus Events**: Re-checks URL when the PWA regains focus
5. **Periodic Polling**: Checks every 5 seconds as a fallback

### Domain Matching Algorithm

The service implements a sophisticated domain matching algorithm with three levels of matching:

#### 1. Exact Match (Score: 100)
- The credential URL exactly matches the current URL
- Example: Current URL `https://example.com/login` matches credential URL `https://example.com/login`
- **Visual Indicator**: Green border with ring

#### 2. Domain Match (Score: 90)
- Same domain and subdomain, different path
- Example: Current URL `https://example.com/dashboard` matches credential URL `https://example.com/login`
- **Visual Indicator**: Blue border with ring

#### 3. Subdomain Match (Score: 60-75)
- Same base domain, different subdomain
- Example: Current URL `https://app.example.com` matches credential URL `https://login.example.com`
- **Visual Indicator**: Orange border with ring

### Credential Highlighting

Matching credentials are visually highlighted in the vault:

- **Exact matches**: Green background with green border and ring
- **Domain matches**: Blue background with blue border and ring
- **Subdomain matches**: Orange background with orange border and ring

### Sorting Priority

When URL detection is active and matches are found:

1. Credentials are first sorted by match score (highest first)
2. Then by the user's selected sort criteria (name, last used, created)

This ensures matching credentials always appear at the top of the list.

## User Interface

### URL Detection Status Banner

When a URL is detected, a status banner appears at the top of the vault showing:

- Current domain being detected
- Number of matching credentials found
- Visual indicator (link icon)

### Credential Cards

Matching credential cards display:

- Colored border and background based on match type
- Shadow and ring effects for emphasis
- Normal appearance for non-matching credentials

## Limitations in PWA Context

Due to browser security restrictions, URL detection in PWA mode has limitations:

1. **Same-Origin Only**: Can only detect URLs within the PWA's own domain
2. **No Cross-Tab Detection**: Cannot detect URLs from other browser tabs
3. **Limited in Standalone Mode**: When installed as a standalone app, detection is limited to the PWA's own navigation

### Workarounds

For better URL detection across different websites:

1. **Browser Extension**: Install the companion browser extension (Requirement 21) for cross-site detection
2. **Manual Search**: Use the search feature to find credentials by domain name
3. **Folder Organization**: Organize credentials by website for easier access

## API Reference

### URLDetectionService

```typescript
// Get singleton instance
const service = URLDetectionService.getInstance();

// Get current URL information
const currentURL = service.getCurrentURL();

// Find matching credentials
const matches = service.findMatchingCredentials(credentials);

// Listen for URL changes
const cleanup = service.addURLChangeListener((url) => {
  console.log('URL changed:', url);
});

// Manually set URL (for testing)
service.setCurrentURL('https://example.com');

// Check if detection is supported
const isSupported = service.isURLDetectionSupported();

// Get detection status
const status = service.getDetectionStatus();
```

### useURLDetection Hook

```typescript
const {
  // State
  currentURL,           // Current URL information
  isSupported,          // Whether detection is supported
  matchingCredentials,  // Array of matching credentials
  isDetecting,          // Whether detection is in progress
  
  // Actions
  refreshURLDetection,  // Manually refresh detection
  setCurrentURL,        // Manually set URL (testing)
  
  // Utilities
  isCredentialMatching, // Check if credential matches
  getMatchScore,        // Get match score for credential
  getMatchType,         // Get match type for credential
  getMatchingCredentials, // Get all matches
  getTopMatch,          // Get highest scoring match
  hasMatches,           // Check if any matches exist
  getCurrentDomain,     // Get current domain
  getCurrentURLString,  // Get current URL string
  getDetectionStatus    // Get detection status
} = useURLDetection();
```

## Testing

### Unit Tests

The `urlDetectionService.test.ts` file contains comprehensive tests for:

- URL parsing and domain extraction
- Domain matching algorithm
- Match score calculation
- Listener notifications
- Edge cases and error handling

### Integration Tests

The `URLDetectionIntegration.test.tsx` file tests:

- Integration with VaultList component
- Status banner display
- Credential highlighting
- Sort priority
- Unsupported environment handling

## Future Enhancements

1. **Browser Extension Integration**: Full cross-tab URL detection via browser extension
2. **Smart Suggestions**: Machine learning to suggest credentials based on URL patterns
3. **Auto-Fill**: Automatic credential filling when matches are detected
4. **Multi-Account Detection**: Detect and suggest multiple accounts for the same domain
5. **URL History**: Track which credentials are used for which URLs over time

## Related Requirements

- **Requirement 17.5**: PWA detects current browser tab URL and highlights matching credentials
- **Requirement 21**: Browser extension for automatic form detection and filling
- **Requirement 5**: Search and retrieve stored passwords quickly

## Security Considerations

- URL detection does not transmit any data to the server
- All matching is performed client-side
- No sensitive credential data is exposed during detection
- Detection respects browser security boundaries
