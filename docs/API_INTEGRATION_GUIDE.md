# API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with the Password Manager REST API. The API follows RESTful principles and uses JWT for authentication.

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [API Endpoints](#api-endpoints)
7. [Code Examples](#code-examples)
8. [SDKs and Libraries](#sdks-and-libraries)

## Base URL

### Development
```
http://localhost:8080/api/v1
```

### Staging
```
https://api-staging.passwordmanager.com/api/v1
```

### Production
```
https://api.passwordmanager.com/api/v1
```

## Authentication

### JWT Token Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "authKeyHash": "hashed-auth-key",
  "twoFactorCode": "123456"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1234567890,
  "userId": "uuid-here"
}
```

### Token Expiration

- **Default Expiration**: 15 minutes of inactivity
- **Refresh**: Use `/auth/refresh` endpoint before expiration
- **Automatic Logout**: Session expires after configured timeout

### Security Best Practices

1. **Never expose tokens**: Store securely in memory or secure storage
2. **Use HTTPS**: Always use encrypted connections
3. **Implement token refresh**: Refresh tokens before expiration
4. **Handle 401 responses**: Redirect to login on authentication failure
5. **Clear tokens on logout**: Remove tokens from storage

## Request/Response Format

### Content Type

All requests and responses use JSON:

```http
Content-Type: application/json
Accept: application/json
```

### Request Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <unique-request-id>
```

### Response Format

**Success Response**:
```json
{
  "data": {
    // Response data
  },
  "timestamp": 1234567890,
  "requestId": "uuid-here"
}
```

**Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": 1234567890,
  "requestId": "uuid-here"
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `TOKEN_EXPIRED` | JWT token expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `CONFLICT` | Resource conflict |
| `INTERNAL_ERROR` | Internal server error |

### Error Response Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for request",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 12 characters"
      },
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": 1234567890,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Rate Limiting

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | 1 minute |
| `/auth/register` | 3 requests | 1 hour |
| `/vault/*` | 100 requests | 1 minute |
| `/vault/export` | 3 requests | 1 hour |
| `/audit/logs` | 50 requests | 1 minute |

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## API Endpoints

### Authentication Endpoints

#### Register User

**Endpoint**: `POST /auth/register`

**Description**: Create a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "authKeyHash": "bcrypt-hashed-auth-key",
  "salt": "base64-encoded-salt",
  "iterations": 100000
}
```

**Response** (201 Created):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "recoveryKey": "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "createdAt": 1234567890
}
```

**Errors**:
- `400`: Invalid input data
- `409`: Email already registered

---

#### Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and obtain JWT token.

**Request**:
```json
{
  "email": "user@example.com",
  "authKeyHash": "bcrypt-hashed-auth-key",
  "twoFactorCode": "123456"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1234567890,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "requiresTwoFactor": false
}
```

**Errors**:
- `401`: Invalid credentials
- `429`: Too many failed attempts

---

#### Logout

**Endpoint**: `POST /auth/logout`

**Description**: Invalidate current session.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

#### Refresh Token

**Endpoint**: `POST /auth/refresh`

**Description**: Refresh JWT token before expiration.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1234567890
}
```

---

#### Setup 2FA

**Endpoint**: `POST /auth/2fa/setup`

**Description**: Setup two-factor authentication.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": [
    "XXXX-XXXX",
    "YYYY-YYYY",
    "ZZZZ-ZZZZ"
  ]
}
```

---

#### Account Recovery

**Endpoint**: `POST /auth/recovery`

**Description**: Recover account using recovery key.

**Request**:
```json
{
  "email": "user@example.com",
  "recoveryKey": "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "newAuthKeyHash": "new-bcrypt-hashed-auth-key",
  "newSalt": "new-base64-encoded-salt"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "newRecoveryKey": "YYYY-YYYY-YYYY-YYYY-YYYY-YYYY",
  "message": "Account recovered successfully"
}
```

---

### Vault Endpoints

#### Get Vault

**Endpoint**: `GET /vault`

**Description**: Retrieve encrypted vault data.

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:
- `lastSyncTime` (optional): Unix timestamp for delta sync

**Response** (200 OK):
```json
{
  "credentials": [
    {
      "id": "uuid",
      "encryptedData": "base64-encrypted-data",
      "iv": "base64-iv",
      "authTag": "base64-auth-tag",
      "version": 1,
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "deletedAt": null
    }
  ],
  "folders": [...],
  "tags": [...],
  "secureNotes": [...],
  "version": 42
}
```

---

#### Create Credential

**Endpoint**: `POST /vault/credential`

**Description**: Create a new credential entry.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "encryptedData": "base64-encrypted-credential",
  "iv": "base64-iv",
  "authTag": "base64-auth-tag"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "createdAt": 1234567890
}
```

---

#### Update Credential

**Endpoint**: `PUT /vault/credential/{id}`

**Description**: Update an existing credential.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "encryptedData": "base64-encrypted-credential",
  "iv": "base64-iv",
  "authTag": "base64-auth-tag",
  "version": 1
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": 2,
  "updatedAt": 1234567890
}
```

**Errors**:
- `404`: Credential not found
- `409`: Version conflict

---

#### Delete Credential

**Endpoint**: `DELETE /vault/credential/{id}`

**Description**: Soft delete a credential (move to trash).

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Credential moved to trash",
  "deletedAt": 1234567890
}
```

---

#### Sync Vault

**Endpoint**: `POST /vault/sync`

**Description**: Synchronize vault changes.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "changes": [
    {
      "id": "uuid",
      "encryptedData": "base64-encrypted-data",
      "iv": "base64-iv",
      "authTag": "base64-auth-tag",
      "version": 2,
      "operation": "UPDATE"
    }
  ],
  "deletions": ["uuid1", "uuid2"],
  "version": 41
}
```

**Response** (200 OK):
```json
{
  "conflicts": [
    {
      "id": "uuid",
      "serverVersion": 3,
      "clientVersion": 2
    }
  ],
  "serverVersion": 43,
  "syncedAt": 1234567890
}
```

---

#### Import Credentials

**Endpoint**: `POST /vault/import`

**Description**: Import credentials from external file.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "format": "CSV",
  "encryptedData": [
    {
      "encryptedData": "base64-encrypted-credential",
      "iv": "base64-iv",
      "authTag": "base64-auth-tag"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "imported": 45,
  "duplicates": 3,
  "errors": [
    {
      "line": 12,
      "error": "Invalid format"
    }
  ]
}
```

---

#### Export Vault

**Endpoint**: `POST /vault/export`

**Description**: Export vault data.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "format": "JSON",
  "includeDeleted": false
}
```

**Response** (200 OK):
```json
{
  "encryptedData": "base64-encrypted-export",
  "exportedAt": 1234567890,
  "itemCount": 48
}
```

---

### Audit Endpoints

#### Get Audit Logs

**Endpoint**: `GET /audit/logs`

**Description**: Retrieve audit logs with pagination.

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:
- `startDate`: Unix timestamp (optional)
- `endDate`: Unix timestamp (optional)
- `action`: Action type filter (optional)
- `page`: Page number (default: 0)
- `size`: Page size (default: 50, max: 100)

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "CREDENTIAL_ACCESSED",
      "resourceId": "uuid",
      "timestamp": 1234567890,
      "deviceInfo": "Chrome 120 on Windows",
      "ipAddress": "192.168.1.1",
      "success": true
    }
  ],
  "totalPages": 10,
  "totalElements": 500,
  "currentPage": 0
}
```

---

#### Get Security Report

**Endpoint**: `GET /audit/security-report`

**Description**: Get vault security analysis.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "overallScore": 75,
  "weakPasswords": ["uuid1", "uuid2"],
  "reusedPasswords": {
    "password-hash": ["uuid3", "uuid4"]
  },
  "breachedPasswords": ["uuid5"],
  "oldPasswords": ["uuid6"],
  "recommendations": [
    "Update 3 weak passwords",
    "Remove 2 reused passwords"
  ]
}
```

---

### Sharing Endpoints

#### Share Credential

**Endpoint**: `POST /share/credential`

**Description**: Share a credential with another user.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "credentialId": "uuid",
  "recipientEmail": "recipient@example.com",
  "encryptedData": "base64-encrypted-with-recipient-key",
  "permissions": ["READ", "COPY"]
}
```

**Response** (201 Created):
```json
{
  "shareId": "uuid",
  "sharedAt": 1234567890
}
```

---

#### Revoke Share

**Endpoint**: `DELETE /share/{shareId}`

**Description**: Revoke shared credential access.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Access revoked successfully",
  "revokedAt": 1234567890
}
```

---

#### Get Shared Credentials

**Endpoint**: `GET /share/received`

**Description**: Get credentials shared with the user.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "sharedCredentials": [
    {
      "shareId": "uuid",
      "credentialId": "uuid",
      "ownerEmail": "owner@example.com",
      "encryptedData": "base64-encrypted-data",
      "permissions": ["READ", "COPY"],
      "sharedAt": 1234567890
    }
  ]
}
```

---

### Settings Endpoints

#### Get User Settings

**Endpoint**: `GET /settings`

**Description**: Get user settings.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "sessionTimeout": 15,
  "clipboardTimeout": 60,
  "biometricEnabled": true,
  "strictSecurityMode": false,
  "theme": "dark",
  "language": "en"
}
```

---

#### Update User Settings

**Endpoint**: `PUT /settings`

**Description**: Update user settings.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request**:
```json
{
  "sessionTimeout": 30,
  "clipboardTimeout": 120,
  "biometricEnabled": false,
  "strictSecurityMode": true
}
```

**Response** (200 OK):
```json
{
  "message": "Settings updated successfully",
  "updatedAt": 1234567890
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// API Client Setup
class PasswordManagerAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  // Authentication
  async register(email: string, authKeyHash: string, salt: string, iterations: number) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, authKeyHash, salt, iterations }),
    });
  }

  async login(email: string, authKeyHash: string, twoFactorCode?: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, authKeyHash, twoFactorCode }),
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  // Vault Operations
  async getVault(lastSyncTime?: number) {
    const query = lastSyncTime ? `?lastSyncTime=${lastSyncTime}` : '';
    return this.request(`/vault${query}`);
  }

  async createCredential(encryptedData: string, iv: string, authTag: string) {
    return this.request('/vault/credential', {
      method: 'POST',
      body: JSON.stringify({ encryptedData, iv, authTag }),
    });
  }

  async updateCredential(
    id: string,
    encryptedData: string,
    iv: string,
    authTag: string,
    version: number
  ) {
    return this.request(`/vault/credential/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedData, iv, authTag, version }),
    });
  }

  async deleteCredential(id: string) {
    return this.request(`/vault/credential/${id}`, { method: 'DELETE' });
  }

  // Audit Logs
  async getAuditLogs(params: {
    startDate?: number;
    endDate?: number;
    action?: string;
    page?: number;
    size?: number;
  }) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return this.request(`/audit/logs?${query}`);
  }

  async getSecurityReport() {
    return this.request('/audit/security-report');
  }
}

// Usage Example
const api = new PasswordManagerAPI('https://api.passwordmanager.com/api/v1');

// Register
const { userId, recoveryKey } = await api.register(
  'user@example.com',
  'hashed-auth-key',
  'base64-salt',
  100000
);

// Login
const { token } = await api.login('user@example.com', 'hashed-auth-key');

// Create Credential
const credential = await api.createCredential(
  'encrypted-data',
  'iv',
  'auth-tag'
);

// Get Vault
const vault = await api.getVault();

// Logout
await api.logout();
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class PasswordManagerAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.session = requests.Session()

    def set_token(self, token: str):
        self.token = token
        self.session.headers.update({'Authorization': f'Bearer {token}'})

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

    # Authentication
    def register(self, email: str, auth_key_hash: str, salt: str, iterations: int):
        return self._request('POST', '/auth/register', json={
            'email': email,
            'authKeyHash': auth_key_hash,
            'salt': salt,
            'iterations': iterations
        })

    def login(self, email: str, auth_key_hash: str, two_factor_code: Optional[str] = None):
        response = self._request('POST', '/auth/login', json={
            'email': email,
            'authKeyHash': auth_key_hash,
            'twoFactorCode': two_factor_code
        })
        self.set_token(response['token'])
        return response

    def logout(self):
        self._request('POST', '/auth/logout')
        self.token = None
        self.session.headers.pop('Authorization', None)

    # Vault Operations
    def get_vault(self, last_sync_time: Optional[int] = None):
        params = {'lastSyncTime': last_sync_time} if last_sync_time else {}
        return self._request('GET', '/vault', params=params)

    def create_credential(self, encrypted_data: str, iv: str, auth_tag: str):
        return self._request('POST', '/vault/credential', json={
            'encryptedData': encrypted_data,
            'iv': iv,
            'authTag': auth_tag
        })

    def update_credential(self, id: str, encrypted_data: str, iv: str, auth_tag: str, version: int):
        return self._request('PUT', f'/vault/credential/{id}', json={
            'encryptedData': encrypted_data,
            'iv': iv,
            'authTag': auth_tag,
            'version': version
        })

    def delete_credential(self, id: str):
        return self._request('DELETE', f'/vault/credential/{id}')

    # Audit Logs
    def get_audit_logs(self, start_date: Optional[int] = None, end_date: Optional[int] = None,
                       action: Optional[str] = None, page: int = 0, size: int = 50):
        params = {
            'startDate': start_date,
            'endDate': end_date,
            'action': action,
            'page': page,
            'size': size
        }
        params = {k: v for k, v in params.items() if v is not None}
        return self._request('GET', '/audit/logs', params=params)

    def get_security_report(self):
        return self._request('GET', '/audit/security-report')

# Usage Example
api = PasswordManagerAPI('https://api.passwordmanager.com/api/v1')

# Register
r