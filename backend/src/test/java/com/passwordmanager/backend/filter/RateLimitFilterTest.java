package com.passwordmanager.backend.filter;

import com.passwordmanager.backend.service.Bucket4jRateLimitService;
import com.passwordmanager.backend.service.Bucket4jRateLimitService.RateLimitResult;
import com.passwordmanager.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for RateLimitFilter.
 */
@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private Bucket4jRateLimitService rateLimitService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter(rateLimitService, jwtUtil);
    }

    @Test
    void testAuthenticationEndpointAllowed() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(rateLimitService.checkAuthenticationLimit(anyString()))
            .thenReturn(new RateLimitResult(true, 4, 0));

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(response).setHeader("X-RateLimit-Remaining", "4");
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(429); // 429 Too Many Requests
    }

    @Test
    void testAuthenticationEndpointRateLimited() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(rateLimitService.checkAuthenticationLimit(anyString()))
            .thenReturn(new RateLimitResult(false, 0, 30));

        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(writer);

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(response).setStatus(429); // 429 Too Many Requests
        verify(response).setHeader("Retry-After", "30");
        verify(response).setContentType("application/json");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testVaultEndpointAllowed() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/v1/vault/credential");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtUtil.extractUserId("valid-token")).thenReturn("user-123");
        when(rateLimitService.checkVaultOperationLimit("user-123"))
            .thenReturn(new RateLimitResult(true, 99, 0));

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(response).setHeader("X-RateLimit-Remaining", "99");
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(429); // 429 Too Many Requests
    }

    @Test
    void testExportEndpointRateLimited() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/v1/vault/export");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtUtil.extractUserId("valid-token")).thenReturn("user-123");
        when(rateLimitService.checkExportLimit("user-123"))
            .thenReturn(new RateLimitResult(false, 0, 1800));

        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(writer);

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(response).setStatus(429); // 429 Too Many Requests
        verify(response).setHeader("Retry-After", "1800");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testNonRateLimitedEndpoint() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/actuator/health");

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        verify(rateLimitService, never()).checkAuthenticationLimit(anyString());
        verify(rateLimitService, never()).checkVaultOperationLimit(anyString());
        verify(rateLimitService, never()).checkExportLimit(anyString());
    }

    @Test
    void testXForwardedForHeader() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 192.168.1.1");
        when(rateLimitService.checkAuthenticationLimit("10.0.0.1"))
            .thenReturn(new RateLimitResult(true, 4, 0));

        // Act
        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(rateLimitService).checkAuthenticationLimit("10.0.0.1");
        verify(filterChain).doFilter(request, response);
    }
}
