# Password Manager API Documentation

## Overview

The Password Manager API provides a secure, zero-knowledge architecture for managing passwords and credentials. All sensitive data is encrypted client-side before transmission to the server, ensuring that the server never has access to unencrypted passwords or the master password.

## Accessing the Documentation

### Swagger UI (Interactive Documentation)

Access the interactive API documentation at:

- **Development**: http://localhost:8080/swagger-ui.html
- **Staging**: https://api-staging.passwordmanager.com/swagger-ui.html
- **Production**: https://api.passwordmanager.com/swagger-ui.html

### OpenAPI Specification

The OpenAPI 3.0 specification is available at:

- **JSON Format**: `/v3/api-docs`
- **YAML Format**: `/v3/api-docs.yaml`

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT bearer token obtained from the `/api/v1/auth/login` endpoint.

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

**Token Expiration:**
- Default: 15 minutes of inactivity
- Configurable per user settings (1-60 minutes)

### Obtaining a Token

1. Register a new account: `POST /api/v1/auth/register`
2. Login with credentials: `POST /api/v1/auth/login`
3. Use the returned token in the `Authorization` header

**Example:**
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "authKeyHash": "$2a$10$...",
    "twoFactorCode": "123456"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}

# Use token in subsequent requests
curl -X GET http://localhost:8080/api/v1/vault \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user account | No |
| POST | `/login` | Authenticate and get JWT token | No |
| POST | `/logout` | Invalidate current session | Yes |
| POST | `/refresh` | Refresh JWT token | Yes |
| POST | `/2fa/setup` | Setup two-factor authentication | Yes |
| POST | `/recovery` | Recover account with backup key | No |

### Vault Management (`/api/v1/vault`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all credentials | Yes |
| POST | `/credential` | Create new credential | Yes |
| PUT | `/credential/{id}` | Update credential | Yes |
| DELETE | `/credential/{id}` | Delete credential (soft delete) | Yes |
| POST | `/note` | Create secure note | Yes |
| PUT | `/note/{id}` | Update secure note | Yes |
| DELETE | `/note/{id}` | Delete secure note | Yes |
| GET | `/notes` | Get all secure notes | Yes |
| POST | `/folder` | Create folder | Yes |
| GET | `/folders` | Get all folders | Yes |
| POST | `/tag` | Create tag | Yes |
| GET | `/tags` | Get all tags | Yes |
| POST | `/sync` | Sync vault changes | Yes |
| POST | `/import` | Import credentials | Yes |
| POST | `/export` | Export vault | Yes |

### Audit & Security (`/api/v1/audit`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/security-report` | Get security analysis | Yes |
| GET | `/logs` | Get audit logs (paginated) | Yes |
| GET | `/logs/export` | Export audit logs to CSV | Yes |

### Credential Sharing (`/api/v1/share`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/credential` | Share credential with user | Yes |
| GET | `/received` | Get shared credentials | Yes |
| DELETE | `/{shareId}` | Revoke shared access | Yes |

### User Settings (`/api/v1/settings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user settings | Yes |
| PUT | `/` | Update user settings | Yes |

### Health & Monitoring

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/health` | Basic health check | No |
| GET | `/actuator/health` | Detailed health status | No |
| GET | `/actuator/metrics` | Application metrics | Admin |
| GET | `/api/v1/monitoring/metrics` | Custom metrics | Admin |

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| Registration | 5 requests | 1 hour |
| Vault Operations | 100 requests | 1 minute |
| Export Operations | 3 requests | 1 hour |
| General API | 1000 requests | 1 hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "timestamp": "2024-01-01T12:00:00",
  "retryAfter": 60
}
```

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Invalid request data or parameters |
| 400 | `validation_failed` | Request validation failed |
| 401 | `unauthorized` | Invalid or expired authentication token |
| 401 | `invalid_credentials` | Invalid email or password |
| 401 | `two_factor_required` | 2FA code required but not provided |
| 401 | `invalid_two_factor_code` | Invalid 2FA code |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Resource conflict (e.g., email already exists) |
| 409 | `version_conflict` | Optimistic locking conflict |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_server_error` | Unexpected server error |

## Request/Response Examples

### Register New User

**Request:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "authKeyHash": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
  "salt": "randomSaltBase64Encoded==",
  "iterations": 100000
}
```

**Response (201 Created):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "recoveryKey": "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "createdAt": "2024-01-01T12:00:00"
}
```

### Create Encrypted Credential

**Request:**
```bash
POST /api/v1/vault/credential
Authorization: Bearer <token>
Content-Type: application/json

{
  "encryptedData": "base64EncodedEncryptedData==",
  "iv": "base64EncodedIV==",
  "authTag": "base64EncodedAuthTag==",
  "folderId": "550e8400-e29b-41d4-a716-446655440000",
  "tags": ["work", "important"]
}
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "encryptedData": "base64EncodedEncryptedData==",
  "iv": "base64EncodedIV==",
  "authTag": "base64EncodedAuthTag==",
  "version": 1,
  "folderId": "550e8400-e29b-41d4-a716-446655440000",
  "tags": ["work", "important"],
  "createdAt": "2024-01-01T12:00:00",
  "updatedAt": "2024-01-01T12:00:00"
}
```

### Get Security Report

**Request:**
```bash
GET /api/v1/audit/security-report
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "overallScore": 75,
  "weakPasswords": [
    {
      "credentialId": "660e8400-e29b-41d4-a716-446655440001",
      "entropy": 35.5,
      "reason": "Low entropy password"
    }
  ],
  "reusedPasswords": [
    {
      "passwordHash": "hash123",
      "credentialIds": [
        "660e8400-e29b-41d4-a716-446655440001",
        "660e8400-e29b-41d4-a716-446655440002"
      ],
      "count": 2
    }
  ],
  "oldPasswords": [
    {
      "credentialId": "660e8400-e29b-41d4-a716-446655440003",
      "age": 120,
      "lastUpdated": "2023-09-01T12:00:00"
    }
  ],
  "recommendations": [
    "Update 3 weak passwords",
    "Replace 2 reused passwords",
    "Update 5 passwords older than 90 days"
  ]
}
```

## Zero-Knowledge Architecture

### Encryption Flow

1. **Client-Side Key Derivation:**
   ```
   Master Password → PBKDF2 (100,000+ iterations) → Encryption Key + Auth Key
   ```

2. **Client-Side Encryption:**
   ```
   Credential Data → AES-256-GCM (with Encryption Key) → Encrypted Blob
   ```

3. **Server Storage:**
   ```
   Server stores: Encrypted Blob + IV + Auth Tag
   Server CANNOT decrypt without master password
   ```

### What the Server Knows

- ✅ User email
- ✅ Authentication key hash (BCrypt)
- ✅ Encrypted credential blobs
- ✅ Metadata (timestamps, versions, folder IDs)
- ❌ Master password
- ❌ Encryption keys
- ❌ Unencrypted credential data

## Versioning

The API uses URI versioning:
- Current version: `/api/v1/...`
- Future versions: `/api/v2/...`

Breaking changes will be introduced in new versions while maintaining backward compatibility for at least 6 months.

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for web applications:

**Allowed Origins:**
- Development: `http://localhost:3000`
- Staging: `https://staging.passwordmanager.com`
- Production: `https://passwordmanager.com`

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:** Authorization, Content-Type, X-Requested-With

## Security Headers

All responses include security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: no-referrer
```

## Pagination

List endpoints support pagination using query parameters:

**Parameters:**
- `page`: Page number (0-indexed, default: 0)
- `size`: Page size (default: 20, max: 100)

**Example:**
```bash
GET /api/v1/audit/logs?page=0&size=20
```

**Response:**
```json
{
  "logs": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

## Filtering

Some endpoints support filtering:

**Audit Logs:**
```bash
GET /api/v1/audit/logs?startDate=2024-01-01T00:00:00&endDate=2024-01-31T23:59:59&action=LOGIN
```

## Testing the API

### Using Swagger UI

1. Navigate to `/swagger-ui.html`
2. Click "Authorize" button
3. Enter your JWT token: `Bearer <token>`
4. Try out endpoints interactively

### Using cURL

```bash
# Set your token
TOKEN="your-jwt-token-here"

# Get all credentials
curl -X GET http://localhost:8080/api/v1/vault \
  -H "Authorization: Bearer $TOKEN"

# Create credential
curl -X POST http://localhost:8080/api/v1/vault/credential \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedData": "...",
    "iv": "...",
    "authTag": "..."
  }'
```

### Using Postman

1. Import the OpenAPI spec from `/v3/api-docs`
2. Set up environment variables for base URL and token
3. Use the pre-configured requests

## Support

For API support and questions:
- Email: support@passwordmanager.com
- Documentation: https://docs.passwordmanager.com
- GitHub Issues: https://github.com/passwordmanager/api/issues

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Authentication with JWT
- Vault management (credentials, notes, folders, tags)
- Security analysis and audit logging
- Credential sharing
- User settings management
- Two-factor authentication
- Account recovery

## License

MIT License - See LICENSE file for details
