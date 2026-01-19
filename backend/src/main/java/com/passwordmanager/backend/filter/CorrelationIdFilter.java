package com.passwordmanager.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to add correlation IDs to all HTTP requests for distributed tracing.
 * Generates a unique correlation ID for each request and adds it to the MDC
 * for structured logging and response headers for client tracking.
 */
@Component
@Order(1)
@Slf4j
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
    private static final String REQUEST_ID_MDC_KEY = "requestId";
    private static final String USER_ID_MDC_KEY = "userId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        try {
            // Get or generate correlation ID
            String correlationId = getOrGenerateCorrelationId(request);
            String requestId = UUID.randomUUID().toString();
            
            // Add to MDC for logging
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
            MDC.put(REQUEST_ID_MDC_KEY, requestId);
            
            // Add request details to MDC
            MDC.put("method", request.getMethod());
            MDC.put("uri", request.getRequestURI());
            MDC.put("remoteAddr", getClientIpAddress(request));
            MDC.put("userAgent", request.getHeader("User-Agent"));
            
            // Add correlation ID to response header
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            response.setHeader("X-Request-ID", requestId);
            
            long startTime = System.currentTimeMillis();
            
            try {
                filterChain.doFilter(request, response);
            } finally {
                long duration = System.currentTimeMillis() - startTime;
                MDC.put("duration", String.valueOf(duration));
                MDC.put("status", String.valueOf(response.getStatus()));
                
                log.info("Request completed: {} {} - Status: {} - Duration: {}ms", 
                        request.getMethod(), 
                        request.getRequestURI(), 
                        response.getStatus(), 
                        duration);
            }
            
        } finally {
            // Clean up MDC
            MDC.clear();
        }
    }

    private String getOrGenerateCorrelationId(HttpServletRequest request) {
        // Check if correlation ID is provided in request header
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        
        if (correlationId == null || correlationId.trim().isEmpty()) {
            // Generate new correlation ID
            correlationId = UUID.randomUUID().toString();
        }
        
        return correlationId;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * Utility method to add user ID to MDC after authentication
     */
    public static void setUserId(String userId) {
        if (userId != null) {
            MDC.put(USER_ID_MDC_KEY, userId);
        }
    }

    /**
     * Utility method to get current correlation ID
     */
    public static String getCurrentCorrelationId() {
        return MDC.get(CORRELATION_ID_MDC_KEY);
    }

    /**
     * Utility method to get current request ID
     */
    public static String getCurrentRequestId() {
        return MDC.get(REQUEST_ID_MDC_KEY);
    }
}