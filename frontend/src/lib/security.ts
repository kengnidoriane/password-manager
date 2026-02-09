/**
 * Security utilities for XSS prevention and input sanitization
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  return sanitized;
}

/**
 * Escape HTML special characters
 * Converts characters to HTML entities
 */
export function escapeHTML(text: string): string {
  if (!text) return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate URL to prevent javascript: and data: URLs
 */
export function isValidURL(url: string): boolean {
  if (!url) return false;

  // Only allow http and https protocols
  const validProtocols = ['http:', 'https:'];
  
  try {
    const parsed = new URL(url);
    return validProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requires: 12+ chars, uppercase, lowercase, number, special char
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 12) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

/**
 * Generate a Content Security Policy nonce
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if content contains potential XSS
 */
export function containsXSS(content: string): boolean {
  if (!content) return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // First escape HTML
  let sanitized = escapeHTML(input);

  // Then remove any remaining dangerous patterns
  sanitized = sanitizeHTML(sanitized);

  return sanitized;
}

/**
 * Validate and sanitize tag name
 */
export function sanitizeTagName(tag: string): string {
  if (!tag) return '';

  // Remove HTML and special characters
  let sanitized = tag.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  return sanitized.trim().substring(0, 50); // Limit length
}

/**
 * Validate and sanitize folder name
 */
export function sanitizeFolderName(name: string): string {
  if (!name) return '';

  // Remove HTML and special characters
  let sanitized = name.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  return sanitized.trim().substring(0, 100); // Limit length
}

/**
 * Check if string is valid Base64
 */
export function isValidBase64(str: string): boolean {
  if (!str) return false;

  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove SQL injection attempts
  let sanitized = query.replace(/['";\\]/g, '');
  
  // Remove HTML
  sanitized = escapeHTML(sanitized);
  
  return sanitized.trim().substring(0, 200); // Limit length
}
