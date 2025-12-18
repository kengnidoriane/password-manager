package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.dto.LoginResponse;
import com.passwordmanager.backend.dto.RegisterRequest;
import com.passwordmanager.backend.dto.RegisterResponse;
import com.passwordmanager.backend.entity.Session;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.service.AuthenticationService;
import com.passwordmanager.backend.service.SessionService;
import com.passwordmanager.backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for authentication operations.
 * 
 * This controller handles:
 * - User login with JWT token generation
 * - Session management with Redis storage
 * - Authentication failure handling with rate limiting
 * 
 * Requirements: 2.1, 2.2
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User authentication and session management")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final SessionService sessionService;
    private final AuthenticationService authenticationService;

    @Value("${session.timeout-minutes:15}")
    private int sessionTimeoutMinutes;

    public AuthController(AuthenticationManager authenticationManager,
                         JwtUtil jwtUtil,
                         SessionService sessionService,
                         AuthenticationService authenticationService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.sessionService = sessionService;
        this.authenticationService = authenticationService;
    }

    /**
     * Registers a new user account and returns a backup recovery key.
     * 
     * This endpoint:
     * - Validates the registration request data
     * - Checks that the email is not already registered
     * - Creates a new user account with the provided authentication key hash
     * - Generates a backup recovery key for account recovery
     * - Implements rate limiting to prevent abuse
     * 
     * @param registerRequest Registration data (email, auth key hash, salt, iterations)
     * @param request HTTP request for extracting client information
     * @return User ID and backup recovery key
     */
    @PostMapping("/register")
    @Operation(
        summary = "Register a new user account",
        description = "Creates a new user account with zero-knowledge architecture. " +
                     "The authentication key should be derived from the master password using PBKDF2. " +
                     "Returns a backup recovery key that must be displayed to the user once."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Registration successful",
            content = @Content(schema = @Schema(implementation = RegisterResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or email already registered",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "429",
            description = "Too many registration attempts - rate limited",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest,
                                     HttpServletRequest request) {
        try {
            // Check rate limiting for registration attempts from this IP
            String clientIp = getClientIpAddress(request);
            if (!isRegistrationAllowed(clientIp)) {
                logger.warn("Registration attempt blocked due to rate limiting from IP: {}", clientIp);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "rate_limit_exceeded");
                errorResponse.put("message", "Too many registration attempts. Please try again later.");
                errorResponse.put("timestamp", LocalDateTime.now());
                
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
            }

            // Record registration attempt for rate limiting
            recordRegistrationAttempt(clientIp);

            // Register the user
            RegisterResponse response = authenticationService.registerUser(registerRequest);

            logger.info("User {} successfully registered from IP {}", 
                       registerRequest.getEmail(), clientIp);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            // Email already registered or validation error
            String clientIp = getClientIpAddress(request);
            logger.warn("Registration failed for email: {} from IP: {} - {}", 
                       registerRequest.getEmail(), clientIp, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "registration_failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);

        } catch (Exception e) {
            logger.error("Unexpected error during registration for email: {} - {}", 
                        registerRequest.getEmail(), e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "internal_server_error");
            errorResponse.put("message", "Registration failed due to internal error");
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Authenticates a user and returns a JWT token.
     * 
     * This endpoint:
     * - Validates the user's email and authentication key hash
     * - Generates a JWT token for successful authentication
     * - Creates a session stored in Redis with TTL
     * - Implements rate limiting and failed attempt tracking
     * 
     * @param loginRequest Login credentials (email and auth key hash)
     * @param request HTTP request for extracting client information
     * @return JWT token and session information
     */
    @PostMapping("/login")
    @Operation(
        summary = "Authenticate user and generate JWT token",
        description = "Validates user credentials and returns a JWT token for authenticated requests. " +
                     "The authentication key should be derived from the master password using PBKDF2."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Authentication successful",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "429",
            description = "Too many failed attempts - rate limited",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request format",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest,
                                  HttpServletRequest request) {
        try {
            // Check rate limiting for this IP/email combination
            String clientIp = getClientIpAddress(request);
            if (!authenticationService.isLoginAllowed(loginRequest.getEmail(), clientIp)) {
                logger.warn("Login attempt blocked due to rate limiting for email: {} from IP: {}", 
                           loginRequest.getEmail(), clientIp);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "rate_limit_exceeded");
                errorResponse.put("message", "Too many failed login attempts. Please try again later.");
                errorResponse.put("timestamp", LocalDateTime.now());
                
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
            }

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getAuthKeyHash()
                )
            );

            // Get authenticated user details
            UserAccount user = authenticationService.getUserByEmail(loginRequest.getEmail());
            
            // Generate JWT token
            String jwtToken = jwtUtil.generateToken((UserDetails) authentication.getPrincipal());

            // Extract device information
            String userAgent = request.getHeader("User-Agent");
            String deviceInfo = parseDeviceInfo(userAgent);

            // Create session
            Session session = sessionService.createSession(
                user, 
                jwtToken, 
                deviceInfo, 
                clientIp, 
                userAgent, 
                sessionTimeoutMinutes
            );

            // Record successful login
            authenticationService.recordSuccessfulLogin(loginRequest.getEmail(), clientIp);

            // Update user's last login timestamp
            authenticationService.updateLastLogin(user.getId());

            // Prepare response
            LoginResponse response = LoginResponse.builder()
                    .token(jwtToken)
                    .tokenType("Bearer")
                    .expiresIn(sessionTimeoutMinutes * 60) // Convert to seconds
                    .userId(user.getId())
                    .email(user.getEmail())
                    .sessionId(session.getId())
                    .build();

            logger.info("User {} successfully authenticated from IP {}", 
                       loginRequest.getEmail(), clientIp);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // Record failed login attempt
            String clientIp = getClientIpAddress(request);
            authenticationService.recordFailedLogin(loginRequest.getEmail(), clientIp);
            
            logger.warn("Failed login attempt for email: {} from IP: {}", 
                       loginRequest.getEmail(), clientIp);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_credentials");
            errorResponse.put("message", "Invalid email or password");
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);

        } catch (AuthenticationException e) {
            logger.error("Authentication error for email: {} - {}", 
                        loginRequest.getEmail(), e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "authentication_failed");
            errorResponse.put("message", "Authentication failed");
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);

        } catch (Exception e) {
            logger.error("Unexpected error during login for email: {} - {}", 
                        loginRequest.getEmail(), e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "internal_server_error");
            errorResponse.put("message", "An unexpected error occurred");
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Extracts the client IP address from the HTTP request.
     * 
     * @param request HTTP request
     * @return Client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in case of multiple proxies
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Parses device information from the User-Agent header.
     * 
     * @param userAgent User-Agent header value
     * @return Parsed device information
     */
    private String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown Device";
        }

        // Simple device info parsing - in production, consider using a library like UAParser
        StringBuilder deviceInfo = new StringBuilder();

        // Detect OS
        if (userAgent.contains("Windows")) {
            deviceInfo.append("Windows");
        } else if (userAgent.contains("Mac OS")) {
            deviceInfo.append("macOS");
        } else if (userAgent.contains("Linux")) {
            deviceInfo.append("Linux");
        } else if (userAgent.contains("Android")) {
            deviceInfo.append("Android");
        } else if (userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            deviceInfo.append("iOS");
        } else {
            deviceInfo.append("Unknown OS");
        }

        deviceInfo.append(", ");

        // Detect browser
        if (userAgent.contains("Chrome") && !userAgent.contains("Edg")) {
            deviceInfo.append("Chrome");
        } else if (userAgent.contains("Firefox")) {
            deviceInfo.append("Firefox");
        } else if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) {
            deviceInfo.append("Safari");
        } else if (userAgent.contains("Edg")) {
            deviceInfo.append("Edge");
        } else {
            deviceInfo.append("Unknown Browser");
        }

        // Detect device type
        if (userAgent.contains("Mobile") || userAgent.contains("Android")) {
            deviceInfo.append(", Mobile");
        } else if (userAgent.contains("Tablet") || userAgent.contains("iPad")) {
            deviceInfo.append(", Tablet");
        } else {
            deviceInfo.append(", Desktop");
        }

        return deviceInfo.toString();
    }

    /**
     * Checks if registration is allowed from the given IP address.
     * 
     * Implements rate limiting to prevent abuse:
     * - Maximum 5 registration attempts per IP per hour
     * 
     * @param ipAddress Client IP address
     * @return true if registration is allowed, false if rate limited
     */
    private boolean isRegistrationAllowed(String ipAddress) {
        return authenticationService.isRegistrationAllowed(ipAddress);
    }

    /**
     * Records a registration attempt for rate limiting purposes.
     * 
     * @param ipAddress Client IP address
     */
    private void recordRegistrationAttempt(String ipAddress) {
        authenticationService.recordRegistrationAttempt(ipAddress);
    }
}