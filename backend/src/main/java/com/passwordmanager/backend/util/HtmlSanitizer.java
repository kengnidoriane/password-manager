package com.passwordmanager.backend.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing HTML input to prevent XSS attacks.
 * 
 * This sanitizer removes potentially dangerous HTML tags and attributes
 * while preserving safe formatting tags for rich text content.
 */
@Component
public class HtmlSanitizer {
    
    // Patterns for detecting and removing dangerous content
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "<script[^>]*>.*?</script>", 
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern STYLE_PATTERN = Pattern.compile(
        "<style[^>]*>.*?</style>", 
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern IFRAME_PATTERN = Pattern.compile(
        "<iframe[^>]*>.*?</iframe>", 
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern OBJECT_PATTERN = Pattern.compile(
        "<object[^>]*>.*?</object>", 
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern EMBED_PATTERN = Pattern.compile(
        "<embed[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ON_EVENT_PATTERN = Pattern.compile(
        "\\s*on\\w+\\s*=", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern JAVASCRIPT_PROTOCOL_PATTERN = Pattern.compile(
        "javascript:", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern DATA_PROTOCOL_PATTERN = Pattern.compile(
        "data:(?!image/)", 
        Pattern.CASE_INSENSITIVE
    );
    
    /**
     * Sanitizes HTML input by removing dangerous tags and attributes.
     * 
     * This method removes:
     * - Script tags and their content
     * - Style tags and their content
     * - Iframe, object, and embed tags
     * - Event handler attributes (onclick, onload, etc.)
     * - JavaScript protocol in URLs
     * - Data URLs (except for images)
     * 
     * @param html the HTML string to sanitize
     * @return sanitized HTML string
     */
    public String sanitize(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        
        String sanitized = html;
        
        // Remove dangerous tags
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = STYLE_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = IFRAME_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = OBJECT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = EMBED_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove event handlers
        sanitized = ON_EVENT_PATTERN.matcher(sanitized).replaceAll(" ");
        
        // Remove dangerous protocols
        sanitized = JAVASCRIPT_PROTOCOL_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = DATA_PROTOCOL_PATTERN.matcher(sanitized).replaceAll("blocked:");
        
        return sanitized;
    }
    
    /**
     * Strips all HTML tags from the input, leaving only plain text.
     * 
     * Use this for fields that should not contain any HTML formatting.
     * 
     * @param html the HTML string to strip
     * @return plain text without HTML tags
     */
    public String stripHtml(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        
        // First sanitize to remove dangerous content
        String sanitized = sanitize(html);
        
        // Then remove all HTML tags
        return sanitized.replaceAll("<[^>]+>", "");
    }
    
    /**
     * Escapes HTML special characters to prevent XSS.
     * 
     * Converts:
     * - < to &lt;
     * - > to &gt;
     * - & to &amp;
     * - " to &quot;
     * - ' to &#x27;
     * 
     * @param text the text to escape
     * @return escaped text safe for HTML display
     */
    public String escapeHtml(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;");
    }
    
    /**
     * Validates that a string contains no HTML tags.
     * 
     * @param text the text to validate
     * @return true if the text contains no HTML tags, false otherwise
     */
    public boolean isPlainText(String text) {
        if (text == null || text.isEmpty()) {
            return true;
        }
        
        return !text.matches(".*<[^>]+>.*");
    }
    
    /**
     * Sanitizes a URL to prevent XSS attacks.
     * 
     * Removes javascript: and data: protocols (except data:image/).
     * 
     * @param url the URL to sanitize
     * @return sanitized URL
     */
    public String sanitizeUrl(String url) {
        if (url == null || url.isEmpty()) {
            return url;
        }
        
        String sanitized = url.trim();
        
        // Remove javascript: protocol
        if (JAVASCRIPT_PROTOCOL_PATTERN.matcher(sanitized).find()) {
            return "";
        }
        
        // Remove data: protocol except for images
        if (DATA_PROTOCOL_PATTERN.matcher(sanitized).find()) {
            return "";
        }
        
        return sanitized;
    }
}
