package com.passwordmanager.backend.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for HTML sanitization utility.
 */
class HtmlSanitizerTest {
    
    private HtmlSanitizer sanitizer;
    
    @BeforeEach
    void setUp() {
        sanitizer = new HtmlSanitizer();
    }
    
    @Test
    void testSanitize_RemovesScriptTags() {
        String input = "<p>Hello</p><script>alert('xss')</script><p>World</p>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("<script>"), "Should remove script tags");
        assertFalse(result.contains("alert"), "Should remove script content");
        assertTrue(result.contains("Hello"), "Should preserve safe content");
    }
    
    @Test
    void testSanitize_RemovesStyleTags() {
        String input = "<p>Text</p><style>body { background: red; }</style>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("<style>"), "Should remove style tags");
        assertFalse(result.contains("background"), "Should remove style content");
    }
    
    @Test
    void testSanitize_RemovesIframeTags() {
        String input = "<p>Content</p><iframe src='evil.com'></iframe>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("<iframe"), "Should remove iframe tags");
        assertFalse(result.contains("evil.com"), "Should remove iframe content");
    }
    
    @Test
    void testSanitize_RemovesObjectTags() {
        String input = "<object data='malware.swf'></object>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("<object"), "Should remove object tags");
    }
    
    @Test
    void testSanitize_RemovesEmbedTags() {
        String input = "<embed src='malware.swf'>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("<embed"), "Should remove embed tags");
    }
    
    @Test
    void testSanitize_RemovesEventHandlers() {
        String input = "<div onclick='alert(1)'>Click me</div>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("onclick"), "Should remove onclick handler");
    }
    
    @Test
    void testSanitize_RemovesOnloadHandler() {
        String input = "<img src='x' onload='alert(1)'>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("onload"), "Should remove onload handler");
    }
    
    @Test
    void testSanitize_RemovesJavaScriptProtocol() {
        String input = "<a href='javascript:alert(1)'>Click</a>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("javascript:"), "Should remove javascript: protocol");
    }
    
    @Test
    void testSanitize_RemovesDataProtocol() {
        String input = "<a href='data:text/html,<script>alert(1)</script>'>Click</a>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("data:text/html"), "Should remove data: protocol");
    }
    
    @Test
    void testSanitize_AllowsDataImageProtocol() {
        String input = "<img src='data:image/png;base64,iVBORw0KGgo='>";
        String result = sanitizer.sanitize(input);
        
        assertTrue(result.contains("data:image/"), "Should allow data:image/ protocol");
    }
    
    @Test
    void testStripHtml_RemovesAllTags() {
        String input = "<p>Hello <strong>World</strong></p>";
        String result = sanitizer.stripHtml(input);
        
        assertEquals("Hello World", result, "Should remove all HTML tags");
    }
    
    @Test
    void testStripHtml_PreservesText() {
        String input = "Plain text without HTML";
        String result = sanitizer.stripHtml(input);
        
        assertEquals(input, result, "Should preserve plain text");
    }
    
    @Test
    void testEscapeHtml_EscapesSpecialCharacters() {
        String input = "<script>alert('xss')</script>";
        String result = sanitizer.escapeHtml(input);
        
        assertEquals("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;", result,
            "Should escape HTML special characters");
    }
    
    @Test
    void testEscapeHtml_EscapesAmpersand() {
        String input = "Tom & Jerry";
        String result = sanitizer.escapeHtml(input);
        
        assertEquals("Tom &amp; Jerry", result, "Should escape ampersand");
    }
    
    @Test
    void testEscapeHtml_EscapesQuotes() {
        String input = "He said \"Hello\"";
        String result = sanitizer.escapeHtml(input);
        
        assertTrue(result.contains("&quot;"), "Should escape double quotes");
    }
    
    @Test
    void testIsPlainText_ReturnsTrueForPlainText() {
        String input = "This is plain text";
        
        assertTrue(sanitizer.isPlainText(input), "Should recognize plain text");
    }
    
    @Test
    void testIsPlainText_ReturnsFalseForHtml() {
        String input = "This has <b>HTML</b>";
        
        assertFalse(sanitizer.isPlainText(input), "Should recognize HTML");
    }
    
    @Test
    void testSanitizeUrl_RemovesJavaScriptProtocol() {
        String input = "javascript:alert(1)";
        String result = sanitizer.sanitizeUrl(input);
        
        assertEquals("", result, "Should remove javascript: URLs");
    }
    
    @Test
    void testSanitizeUrl_RemovesDataProtocol() {
        String input = "data:text/html,<script>alert(1)</script>";
        String result = sanitizer.sanitizeUrl(input);
        
        assertEquals("", result, "Should remove data: URLs");
    }
    
    @Test
    void testSanitizeUrl_AllowsHttpUrls() {
        String input = "https://example.com";
        String result = sanitizer.sanitizeUrl(input);
        
        assertEquals(input, result, "Should allow HTTPS URLs");
    }
    
    @Test
    void testSanitize_NullInput() {
        String result = sanitizer.sanitize(null);
        
        assertNull(result, "Should handle null input");
    }
    
    @Test
    void testSanitize_EmptyInput() {
        String result = sanitizer.sanitize("");
        
        assertEquals("", result, "Should handle empty input");
    }
    
    @Test
    void testSanitize_CaseInsensitive() {
        String input = "<SCRIPT>alert('xss')</SCRIPT>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("SCRIPT"), "Should be case-insensitive");
        assertFalse(result.contains("alert"), "Should remove uppercase script tags");
    }
    
    @Test
    void testSanitize_MultipleThreats() {
        String input = "<p onclick='alert(1)'>Text</p><script>evil()</script><iframe src='bad'></iframe>";
        String result = sanitizer.sanitize(input);
        
        assertFalse(result.contains("onclick"), "Should remove event handlers");
        assertFalse(result.contains("<script>"), "Should remove script tags");
        assertFalse(result.contains("<iframe"), "Should remove iframe tags");
        assertTrue(result.contains("<p"), "Should preserve safe tags");
    }
}
