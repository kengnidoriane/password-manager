# Architecture Documentation

## Overview

The Password Manager is a Progressive Web Application (PWA) built with a security-first architecture implementing zero-knowledge encryption. This document provides a comprehensive overview of the system architecture, design decisions, and technical implementation details.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Security Architecture](#security-architecture)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Design Decisions](#design-decisions)

## High-Level Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser (PWA)                     │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                       │
│  ├─ Authentication UI                                        │
│  ├─ Vault Management UI                                      │
│  ├─ Security Dashboard                                       │
│  └─ Settings & Configuration                                 │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                  │
│  ├─ Auth Store                                               │
│  ├─ Vault Store                                              │
│  ├─ Settings Store                                           │
│  └─ UI Store                                                 │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                             │
│  ├─ Crypto Service (Web Crypto API)                          │
│  ├─ Vault Service                                            │
│  ├─ Sync Service                                             │
│  ├─ Auth Service                                             │
│  └─ Security Analyzer Service                                │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├─ IndexedDB (Encrypted Local Storage)                      │
│  └─ Service Worker (Offline & Caching)                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/TLS
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Spring Boot)              │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer (REST API)                                 │
│  ├─ Auth Controller                                          │
│  ├─ Vault Controller                                         │
│  ├─ Audit Controller                                         │
│  └─ Sharing Controller                                       │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                              │
│  ├─ Authentication Service                                   │
│  ├─ Vault Service                                            │
│  ├─ Sync Service                                             │
│  ├─ Security Analyzer Service                                │
│  └─ Audit Log Service                                        │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer (Data Access)                              │
│  ├─ User Repository                                          │
│  ├─ Vault Repository                                         │
│  ├─ Session Repository                                       │
│  └─ Audit Log Repository                                     │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├─ PostgreSQL (Encrypted Vault Storage)                     │
│  └─ Redis (Session & Cache)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 14+ | React framework with SSR/SSG |
| UI Library | React | 18+ | Component-based UI |
| Language | TypeScript | 5+ | Type-safe development |
| State Management | Zustand | 4+ | Lightweight state management |
| Styling | Tailwind CSS | 3+ | Utility-first CSS |
| Forms | React Hook Form + Zod | Latest | Form validation |
| Crypto | Web Crypto API | Native | Client-side encryption |
| Local Storage | Dexie.js | 3+ | IndexedDB wrapper |
| PWA | next-pwa | Latest | Progressive Web App features |
| Testing | Jest + React Testing Library | Latest | Unit testing |
| E2E Testing | Cypress | Latest | End-to-end testing |

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Spring Boot | 3.x | Java application framework |
| Language | Java | 17+ | Backend programming language |
| Security | Spring Security | 6+ | Authentication & authorization |
| Database | PostgreSQL | 14+ | Relational database |
| Cache | Redis | 7+ | Session & caching |
| ORM | Spring Data JPA | Latest | Database abstraction |
| Migration | Flyway | Latest | Database versioning |
| API Docs | Springdoc OpenAPI | Latest | Swagger documentation |
| Testing | JUnit 5 + jqwik | Latest | Unit & property testing |
| Build Tool | Maven | 3.9+ | Dependency management |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Application packaging |
| Orchestration | Kubernetes | Container orchestration |
| CI/CD | GitHub Actions | Automated testing & deployment |
| IaC | Terraform | Infrastructure as code |
| Monitoring | Prometheus + Grafana | Metrics & dashboards |
| Logging | ELK Stack | Centralized logging |
| CDN | CloudFront/Vercel | Static asset delivery |

## Security Architecture

### Zero-Knowledge Architecture

The system implements a zero-knowledge architecture where the server never has access to unencrypted user data:

```
┌──────────────┐
│ User enters  │
│ Master Pass  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ PBKDF2 Key Derivation        │
│ - 100,000+ iterations         │
│ - SHA-256 hash                │
│ - Unique salt per user        │
└──────┬───────────────────────┘
       │
       ├─────────────┬──────────────┐
       ▼             ▼              ▼
┌─────────────┐ ┌──────────┐ ┌────────────┐
│ Encryption  │ │ Auth Key │ │ Validation │
│ Key         │ │          │ │ Token      │
└─────┬───────┘ └────┬─────┘ └─────┬──────┘
      │              │              │
      │              │              │
      ▼              ▼              ▼
┌─────────────────────────────────────────┐
│ AES-256-GCM Encryption                  │
│ - Encrypt vault data client-side        │
│ - Generate unique IV per operation      │
│ - Authentication tag for integrity      │
└─────┬───────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Encrypted Blob Transmission             │
│ - Only encrypted data sent to server    │
│ - Server cannot decrypt without master  │
│ - Zero-knowledge guarantee              │
└─────────────────────────────────────────┘
```

### Encryption Specifications

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000+ (configurable per user)
- **IV**: Unique 96-bit initialization vector per encryption
- **Authentication**: GCM authentication tag for integrity
- **Salt**: Unique 128-bit salt per user

### Authentication Flow

```
┌──────────────┐
│ User Login   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Derive Auth Key from Master  │
│ Password (PBKDF2)             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Hash Auth Key (BCrypt)        │
│ Send to Server                │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Server Validates Hash         │
│ Against Stored Hash           │
└──────┬───────────────────────┘
       │
       ├─── Success ───┐
       │               ▼
       │        ┌──────────────────┐
       │        │ Generate JWT     │
       │        │ Store in Redis   │
       │        │ Return to Client │
       │        └──────────────────┘
       │
       └─── Failure ───┐
                       ▼
                ┌──────────────────┐
                │ Increment Counter│
                │ Apply Backoff    │
                │ Log Attempt      │
                └──────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. Authentication Module

**Purpose**: Handle user authentication, registration, and session management.

**Components**:
- `LoginForm`: Master password entry with validation
- `RegisterForm`: Account creation with password strength meter
- `BiometricAuth`: WebAuthn integration for biometric authentication
- `TwoFactorSetup`: TOTP setup with QR code generation
- `SessionProvider`: Context provider for session state
- `SessionLock`: UI for locked session state

**Services**:
- `authService`: API communication for authentication
- `cryptoService`: Key derivation and encryption
- `biometricService`: WebAuthn wrapper

**State Management**:
- `authStore`: Authentication state (user, token, session)

#### 2. Vault Management Module

**Purpose**: Manage password vault operations (CRUD, search, organization).

**Components**:
- `VaultList`: Display credentials with search and filtering
- `CredentialCard`: Individual credential display with copy buttons
- `CredentialForm`: Add/edit credential with validation
- `FolderTree`: Hierarchical folder navigation
- `TagManager`: Tag creation and assignment
- `SearchBar`: Real-time search interface

**Services**:
- `vaultService`: Vault CRUD operations
- `searchService`: Full-text search across vault
- `syncService`: Bidirectional synchronization

**State Management**:
- `vaultStore`: Vault data (credentials, folders, tags)

#### 3. Security Dashboard Module

**Purpose**: Display security analysis and recommendations.

**Components**:
- `SecurityScore`: Overall vault security rating
- `WeakPasswordsList`: Credentials with weak passwords
- `ReusedPasswordsList`: Duplicate password detection
- `BreachedPasswordsList`: Passwords found in breaches
- `AuditLog`: Activity log viewer

**Services**:
- `securityService`: Security analysis API
- `breachCheckService`: k-anonymity breach checking

### Backend Components

#### 1. Controller Layer

**Purpose**: Handle HTTP requests and responses.

**Controllers**:
- `AuthController`: Authentication endpoints
- `VaultController`: Vault CRUD operations
- `AuditController`: Audit log access
- `SharingController`: Credential sharing
- `UserSettingsController`: User preferences

**Responsibilities**:
- Request validation
- Response formatting
- Error handling
- API documentation (Swagger)

#### 2. Service Layer

**Purpose**: Implement business logic.

**Services**:
- `AuthenticationService`: User authentication logic
- `VaultService`: Vault operations
- `SyncService`: Synchronization logic
- `SecurityAnalyzerService`: Security analysis
- `AuditLogService`: Audit logging
- `SharingService`: Credential sharing logic

**Responsibilities**:
- Business rule enforcement
- Transaction management
- Service orchestration
- Caching strategy

#### 3. Repository Layer

**Purpose**: Data access abstraction.

**Repositories**:
- `UserRepository`: User account data
- `VaultRepository`: Encrypted vault entries
- `SessionRepository`: Session management
- `AuditLogRepository`: Audit logs
- `SharedCredentialRepository`: Shared credentials

**Responsibilities**:
- Database queries
- Data persistence
- Query optimization

## Data Flow

### Credential Creation Flow

```
1. User enters credential in CredentialForm
   ↓
2. Form validation (React Hook Form + Zod)
   ↓
3. CryptoService encrypts credential (AES-256-GCM)
   ↓
4. VaultService sends encrypted data to API
   ↓
5. Backend validates and stores encrypted blob
   ↓
6. Response returned with credential ID
   ↓
7. VaultStore updated with new credential
   ↓
8. IndexedDB cache updated
   ↓
9. SyncService triggers sync (debounced 5s)
   ↓
10. AuditLogService logs creation event
```

### Sync Flow

```
1. User modifies credential on Device A
   ↓
2. Change queued in SyncService (5s debounce)
   ↓
3. SyncService sends changes to server
   ↓
4. Server detects version conflict (if any)
   ↓
5. Conflict resolution (last-write-wins)
   ↓
6. Server returns delta updates
   ↓
7. Device A applies remote changes
   ↓
8. Device B polls for updates (or WebSocket push)
   ↓
9. Device B downloads delta
   ↓
10. Device B decrypts and applies changes
```

### Offline Flow

```
1. Network connectivity lost
   ↓
2. OfflineService detects offline state
   ↓
3. UI displays offline indicator
   ↓
4. User continues working (read/write)
   ↓
5. Changes queued in IndexedDB
   ↓
6. Network connectivity restored
   ↓
7. SyncService automatically syncs queued changes
   ↓
8. Conflict resolution if needed
   ↓
9. UI updated with sync status
```

## Design Decisions

### 1. Why Next.js for Frontend?

**Decision**: Use Next.js instead of Create React App or Vite.

**Rationale**:
- Built-in PWA support with next-pwa
- Excellent performance with automatic code splitting
- SSR/SSG capabilities for better SEO (if needed)
- Strong TypeScript support
- Large ecosystem and community
- Production-ready with minimal configuration

**Trade-offs**:
- Slightly more complex than CRA
- Larger initial bundle size
- Learning curve for Next.js-specific features

### 2. Why Zustand for State Management?

**Decision**: Use Zustand instead of Redux or Context API.

**Rationale**:
- Minimal boilerplate compared to Redux
- Better performance than Context API
- TypeScript-first design
- Small bundle size (~1KB)
- Simple API with hooks
- No provider hell

**Trade-offs**:
- Less mature ecosystem than Redux
- Fewer middleware options
- Less tooling (no Redux DevTools equivalent)

### 3. Why Spring Boot for Backend?

**Decision**: Use Spring Boot instead of Node.js/Express or Django.

**Rationale**:
- Enterprise-grade security with Spring Security
- Excellent JPA/Hibernate for database operations
- Strong type safety with Java
- Mature ecosystem for authentication (JWT, OAuth2)
- Built-in monitoring with Actuator
- Production-ready with minimal configuration
- Excellent testing support (JUnit, Mockito)

**Trade-offs**:
- Larger memory footprint than Node.js
- Slower startup time
- More verbose than Node.js/Python

### 4. Why PostgreSQL for Database?

**Decision**: Use PostgreSQL instead of MySQL or MongoDB.

**Rationale**:
- ACID compliance for data integrity
- Excellent JSON support for flexible schemas
- Strong indexing capabilities
- Mature replication and backup tools
- Better performance for complex queries
- Open-source with strong community

**Trade-offs**:
- More complex setup than SQLite
- Requires more resources than MySQL
- Not as flexible as MongoDB for schema changes

### 5. Why Redis for Sessions?

**Decision**: Use Redis instead of database sessions or JWT-only.

**Rationale**:
- Fast in-memory storage for sessions
- Automatic expiration with TTL
- Distributed caching support
- Pub/sub for real-time features (future)
- Session invalidation support
- Reduces database load

**Trade-offs**:
- Additional infrastructure component
- Requires memory management
- Persistence configuration needed

### 6. Why Web Crypto API?

**Decision**: Use Web Crypto API instead of CryptoJS or other libraries.

**Rationale**:
- Native browser support (no external dependencies)
- Hardware-accelerated encryption
- Secure key storage in browser
- Standard API across browsers
- Better performance than JavaScript libraries
- Smaller bundle size

**Trade-offs**:
- Async API (more complex)
- Limited browser support (IE11)
- Less flexible than libraries

### 7. Why IndexedDB for Local Storage?

**Decision**: Use IndexedDB instead of LocalStorage or SessionStorage.

**Rationale**:
- Large storage capacity (50MB+)
- Structured data storage
- Async API (non-blocking)
- Transaction support
- Better performance for large datasets
- Offline-first architecture support

**Trade-offs**:
- More complex API than LocalStorage
- Requires wrapper library (Dexie.js)
- Browser compatibility considerations

### 8. Why Kubernetes for Deployment?

**Decision**: Use Kubernetes instead of traditional VMs or serverless.

**Rationale**:
- Container orchestration at scale
- Self-healing and auto-scaling
- Rolling updates with zero downtime
- Service discovery and load balancing
- Declarative configuration
- Cloud-agnostic deployment

**Trade-offs**:
- Complex setup and learning curve
- Requires DevOps expertise
- Higher operational overhead
- Overkill for small deployments

### 9. Why JWT for Authentication?

**Decision**: Use JWT instead of session cookies or OAuth2.

**Rationale**:
- Stateless authentication
- Works well with SPAs and mobile apps
- Easy to scale horizontally
- Standard format (RFC 7519)
- Can include custom claims
- Works across domains

**Trade-offs**:
- Cannot invalidate tokens easily
- Larger payload than session IDs
- Requires secure storage on client
- Token refresh complexity

### 10. Why Property-Based Testing?

**Decision**: Use property-based testing (jqwik, fast-check) in addition to unit tests.

**Rationale**:
- Tests correctness properties across input space
- Discovers edge cases automatically
- Formal specification of behavior
- Better coverage than example-based tests
- Catches bugs that unit tests miss
- Documents system invariants

**Trade-offs**:
- Steeper learning curve
- Longer test execution time
- More complex test setup
- Requires careful property design

## Performance Considerations

### Frontend Optimization

1. **Code Splitting**: Dynamic imports for routes and heavy components
2. **Lazy Loading**: Images and non-critical components
3. **Memoization**: React.memo for expensive components
4. **Virtual Scrolling**: For large credential lists
5. **Service Worker Caching**: Aggressive caching of static assets
6. **Bundle Size**: Target <200KB initial load

### Backend Optimization

1. **Connection Pooling**: HikariCP for database connections
2. **Query Optimization**: Indexes on frequently queried columns
3. **Caching**: Redis for sessions, vault metadata, breach checks
4. **Pagination**: Limit result sets to 50-100 items
5. **Async Processing**: Non-blocking I/O for external APIs
6. **Database Indexes**: Composite indexes for common queries

### Database Optimization

1. **Indexes**: On user_id, created_at, deleted_at columns
2. **Partitioning**: Audit logs by date range
3. **Archiving**: Move old audit logs to cold storage
4. **Connection Pooling**: Limit concurrent connections
5. **Query Analysis**: Regular EXPLAIN ANALYZE reviews
6. **Vacuum**: Regular maintenance for PostgreSQL

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: CDN distribution, multiple edge locations
- **Backend**: Kubernetes HPA based on CPU/memory
- **Database**: Read replicas for read-heavy operations
- **Redis**: Redis Cluster for distributed caching
- **Load Balancer**: Distribute traffic across pods

### Vertical Scaling

- **Database**: Increase instance size for write-heavy loads
- **Redis**: Increase memory for larger session storage
- **Backend**: Increase pod resources for CPU-intensive operations

### Caching Strategy

- **L1 Cache**: Browser memory (React state)
- **L2 Cache**: IndexedDB (encrypted local storage)
- **L3 Cache**: Redis (server-side sessions and metadata)
- **L4 Cache**: CDN (static assets)

## Security Considerations

### Defense in Depth

1. **Client-Side**: Encryption, input validation, CSP headers
2. **Network**: HTTPS/TLS 1.3, certificate pinning
3. **Server-Side**: Authentication, authorization, rate limiting
4. **Database**: Encryption at rest, encrypted connections
5. **Infrastructure**: Network policies, firewalls, WAF

### Threat Model

**Threats Mitigated**:
- ✅ Server compromise (zero-knowledge architecture)
- ✅ Man-in-the-middle attacks (TLS encryption)
- ✅ Brute force attacks (rate limiting, backoff)
- ✅ XSS attacks (CSP headers, input sanitization)
- ✅ CSRF attacks (SameSite cookies, CSRF tokens)
- ✅ SQL injection (parameterized queries, ORM)

**Threats Not Mitigated**:
- ❌ Client-side malware (keyloggers, screen capture)
- ❌ Physical device theft (requires device encryption)
- ❌ Social engineering (user education required)
- ❌ Quantum computing attacks (future consideration)

## Monitoring and Observability

### Metrics

- **Application**: Request rate, error rate, latency (p50, p95, p99)
- **Business**: User registrations, vault operations, sync events
- **Infrastructure**: CPU, memory, disk, network usage
- **Database**: Query performance, connection pool usage
- **Cache**: Hit rate, eviction rate, memory usage

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Sensitive Data**: Never log passwords, keys, or tokens
- **Retention**: 90 days for audit logs, 30 days for application logs

### Alerting

- **Critical**: Service down, database unavailable, high error rate
- **Warning**: High latency, cache misses, disk space low
- **Info**: Deployment completed, scaling event, backup completed

## Disaster Recovery

### Backup Strategy

- **Database**: Automated daily backups with 30-day retention
- **Point-in-Time Recovery**: 5-minute granularity
- **Backup Testing**: Monthly restore tests
- **Geo-Replication**: Cross-region replication for production

### Recovery Procedures

1. **Database Failure**: Promote read replica to primary
2. **Application Failure**: Kubernetes auto-restart
3. **Region Failure**: Failover to secondary region
4. **Data Corruption**: Restore from backup

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 1 hour
- **Recovery Point Objective (RPO)**: 5 minutes
- **Availability Target**: 99.9% uptime (8.76 hours downtime/year)

## Future Considerations

### Planned Enhancements

1. **Browser Extension**: Auto-fill credentials on websites
2. **Mobile Apps**: Native iOS and Android applications
3. **Team Features**: Organization accounts with role-based access
4. **Advanced Sharing**: Granular permissions, expiration dates
5. **Passwordless Auth**: WebAuthn as primary authentication
6. **Zero-Trust Architecture**: Continuous authentication
7. **AI-Powered Security**: Anomaly detection, threat intelligence

### Technical Debt

1. **Migration to React Server Components**: When stable
2. **GraphQL API**: For more flexible data fetching
3. **WebSocket Sync**: Real-time synchronization
4. **End-to-End Encryption for Sharing**: Public key infrastructure
5. **Quantum-Resistant Encryption**: Post-quantum cryptography

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/publications)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
