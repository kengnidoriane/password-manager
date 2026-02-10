package com.passwordmanager.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * Provides comprehensive API documentation with security schemes, examples, and error responses.
 * 
 * Access Swagger UI at: /swagger-ui.html
 * Access OpenAPI spec at: /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name}")
    private String applicationName;

    /**
     * Configures OpenAPI documentation with JWT security scheme, examples, and common responses.
     * 
     * @return OpenAPI configuration
     */
    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("Password Manager API")
                        .description("""
                                # Password Manager API Documentation
                                
                                ## Overview
                                Secure password manager API with zero-knowledge encryption architecture.
                                All sensitive data is encrypted client-side before transmission to the server.
                                
                                ## Security Model
                                - **Zero-Knowledge Architecture**: Server never has access to unencrypted passwords or master password
                                - **Client-Side Encryption**: All vault data encrypted with AES-256-GCM before transmission
                                - **Key Derivation**: PBKDF2 with 100,000+ iterations for master password
                                - **JWT Authentication**: Bearer token authentication for all protected endpoints
                                
                                ## Rate Limiting
                                - Authentication endpoints: 5 requests per minute
                                - Vault operations: 100 requests per minute
                                - Export operations: 3 requests per hour
                                
                                ## Error Handling
                                All error responses follow a consistent format:
                                ```json
                                {
                                  "error": "error_code",
                                  "message": "Human-readable error message",
                                  "timestamp": "2024-01-01T12:00:00"
                                }
                                ```
                                
                                ## Versioning
                                API version is included in the URL path: `/api/v1/...`
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Password Manager Team")
                                .email("support@passwordmanager.com")
                                .url("https://passwordmanager.com/support"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Development server"),
                        new Server()
                                .url("https://api-staging.passwordmanager.com")
                                .description("Staging server"),
                        new Server()
                                .url("https://api.passwordmanager.com")
                                .description("Production server")))
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT authentication token obtained from /api/v1/auth/login endpoint. " +
                                                   "Include in Authorization header as: `Bearer <token>`"))
                        // Add common response examples
                        .addResponses("UnauthorizedError", new ApiResponse()
                                .description("Unauthorized - Invalid or expired authentication token")
                                .content(new Content()
                                        .addMediaType("application/json", new MediaType()
                                                .schema(new Schema<>().$ref("#/components/schemas/ErrorResponse"))
                                                .example(Map.of(
                                                        "error", "unauthorized",
                                                        "message", "Invalid or expired authentication token",
                                                        "timestamp", "2024-01-01T12:00:00"
                                                )))))
                        .addResponses("BadRequestError", new ApiResponse()
                                .description("Bad Request - Invalid request data")
                                .content(new Content()
                                        .addMediaType("application/json", new MediaType()
                                                .schema(new Schema<>().$ref("#/components/schemas/ErrorResponse"))
                                                .example(Map.of(
                                                        "error", "invalid_request",
                                                        "message", "Invalid request data provided",
                                                        "timestamp", "2024-01-01T12:00:00"
                                                )))))
                        .addResponses("NotFoundError", new ApiResponse()
                                .description("Not Found - Resource not found")
                                .content(new Content()
                                        .addMediaType("application/json", new MediaType()
                                                .schema(new Schema<>().$ref("#/components/schemas/ErrorResponse"))
                                                .example(Map.of(
                                                        "error", "not_found",
                                                        "message", "Requested resource not found",
                                                        "timestamp", "2024-01-01T12:00:00"
                                                )))))
                        .addResponses("RateLimitError", new ApiResponse()
                                .description("Too Many Requests - Rate limit exceeded")
                                .content(new Content()
                                        .addMediaType("application/json", new MediaType()
                                                .schema(new Schema<>().$ref("#/components/schemas/ErrorResponse"))
                                                .example(Map.of(
                                                        "error", "rate_limit_exceeded",
                                                        "message", "Too many requests. Please try again later.",
                                                        "timestamp", "2024-01-01T12:00:00"
                                                )))))
                        .addResponses("InternalServerError", new ApiResponse()
                                .description("Internal Server Error")
                                .content(new Content()
                                        .addMediaType("application/json", new MediaType()
                                                .schema(new Schema<>().$ref("#/components/schemas/ErrorResponse"))
                                                .example(Map.of(
                                                        "error", "internal_server_error",
                                                        "message", "An unexpected error occurred",
                                                        "timestamp", "2024-01-01T12:00:00"
                                                )))))
                        // Add common schemas
                        .addSchemas("ErrorResponse", new Schema<>()
                                .type("object")
                                .description("Standard error response format")
                                .addProperty("error", new Schema<>()
                                        .type("string")
                                        .description("Error code for programmatic handling"))
                                .addProperty("message", new Schema<>()
                                        .type("string")
                                        .description("Human-readable error message"))
                                .addProperty("timestamp", new Schema<>()
                                        .type("string")
                                        .format("date-time")
                                        .description("Timestamp when the error occurred")))
                        // Add request/response examples
                        .addExamples("LoginRequestExample", new Example()
                                .summary("Login request example")
                                .description("Example login request with email and authentication key hash")
                                .value(Map.of(
                                        "email", "user@example.com",
                                        "authKeyHash", "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
                                        "twoFactorCode", "123456"
                                )))
                        .addExamples("RegisterRequestExample", new Example()
                                .summary("Registration request example")
                                .description("Example registration request with PBKDF2 parameters")
                                .value(Map.of(
                                        "email", "newuser@example.com",
                                        "authKeyHash", "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
                                        "salt", "randomSaltBase64Encoded==",
                                        "iterations", 100000
                                )))
                        .addExamples("CredentialRequestExample", new Example()
                                .summary("Credential creation example")
                                .description("Example encrypted credential with AES-256-GCM")
                                .value(Map.of(
                                        "encryptedData", "base64EncodedEncryptedData==",
                                        "iv", "base64EncodedIV==",
                                        "authTag", "base64EncodedAuthTag==",
                                        "folderId", "550e8400-e29b-41d4-a716-446655440000",
                                        "tags", List.of("work", "important")
                                ))));
    }
}
