package com.passwordmanager.backend.filter;

import com.passwordmanager.backend.service.Bucket4jRateLimitService;
import com.passwordmanager.backend.service.Bucket4jRateLimitService.RateLimitResult;
import com.passwordmanager.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that applies rate limiting to incoming requests.
 * 
 * Applies different rate limits based on the endpoint:
 * - Authentication endpoints: 5 requests per minute
 * - Vault operations: 100 requests per minute
 * - Export operations: 3 requests per hour
 * 
 * Returns 429 Too Many Requests with Retry-After header when limit is exceeded.
 * Adds rate limit headers to all responses.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    private final Bucket4jRateLimitService rateLimitService;
    private final JwtUtil jwtUtil;

    public RateLimitFilter(Bucket4jRateLimitService rateLimitService, JwtUtil jwtUtil) {
        this.rateLimitService = rateLimitService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                   @NonNull HttpServletResponse response,
                                   @NonNull FilterChain filterChain) 
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String ipAddress = getClientIpAddress(request);

        RateLimitResult result = null;

        // Apply rate limiting based on endpoint
        if (isAuthenticationEndpoint(requestUri)) {
            result = rateLimitService.checkAuthenticationLimit(ipAddress);
        } else if (isExportEndpoint(requestUri)) {
            String userId = extractUserId(request);
            if (userId != null) {
                result = rateLimitService.checkExportLimit(userId);
            }
        } else if (isVaultEndpoint(requestUri)) {
            String userId = extractUserId(request);
            if (userId != null) {
                result = rateLimitService.checkVaultOperationLimit(userId);
            }
        }

        // If rate limit check was performed
        if (result != null) {
            // Add rate limit headers
            if (result.getRemainingTokens() >= 0) {
                response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemainingTokens()));
            }

            // Check if request is allowed
            if (!result.isAllowed()) {
                response.setStatus(429); // 429 Too Many Requests
                response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                    "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again in %d seconds.\",\"retryAfter\":%d}",
                    result.getRetryAfterSeconds(),
                    result.getRetryAfterSeconds()
                ));
                logger.warn("Rate limit exceeded for {} from IP {}", requestUri, ipAddress);
                return;
            }
        }

        // Continue with the request
        filterChain.doFilter(request, response);
    }

    /**
     * Checks if the request is to an authentication endpoint.
     */
    private boolean isAuthenticationEndpoint(String uri) {
        return uri.startsWith("/api/v1/auth/");
    }

    /**
     * Checks if the request is to an export endpoint.
     */
    private boolean isExportEndpoint(String uri) {
        return uri.contains("/export");
    }

    /**
     * Checks if the request is to a vault endpoint.
     */
    private boolean isVaultEndpoint(String uri) {
        return uri.startsWith("/api/v1/vault/") || 
               uri.startsWith("/api/v1/share/") ||
               uri.startsWith("/api/v1/audit/");
    }

    /**
     * Extracts user ID from JWT token in the request.
     */
    private String extractUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                return jwtUtil.extractUserId(token);
            }
        } catch (Exception e) {
            logger.debug("Failed to extract user ID from token: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Gets the client IP address from the request.
     * Checks X-Forwarded-For header first (for proxied requests).
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
