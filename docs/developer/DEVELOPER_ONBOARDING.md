# Developer Onboarding Guide

## Welcome to the Password Manager Team! 🎉

This guide will help you get up to speed with the Password Manager codebase and development workflow.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Codebase Tour](#codebase-tour)
4. [Development Workflow](#development-workflow)
5. [Key Concepts](#key-concepts)
6. [Common Tasks](#common-tasks)
7. [Resources](#resources)

## Project Overview

### What is Password Manager?

Password Manager is a Progressive Web Application (PWA) that provides secure password storage and management with zero-knowledge encryption. Users can:

- Store passwords securely with client-side encryption
- Generate strong passwords
- Sync across devices
- Share credentials securely
- Monitor password security
- Access offline

### Technology Stack

**Frontend**:
- Next.js 14+ (React framework)
- TypeScript (type-safe JavaScript)
- Zustand (state management)
- Tailwind CSS (styling)
- Web Crypto API (encryption)
- IndexedDB (local storage)

**Backend**:
- Spring Boot 3.x (Java framework)
- PostgreSQL (database)
- Redis (caching & sessions)
- JWT (authentication)
- Flyway (database migrations)

**DevOps**:
- Docker (containerization)
- Kubernetes (orchestration)
- GitHub Actions (CI/CD)
- Terraform (infrastructure)

### Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Next.js PWA)             │
│  - Client-side encryption           │
│  - Offline support                  │
│  - IndexedDB caching                │
└──────────────┬──────────────────────┘
               │ HTTPS/TLS
               ▼
┌─────────────────────────────────────┐
│  Backend (Spring Boot)              │
│  - REST API                         │
│  - JWT authentication               │
│  - Encrypted data storage           │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Redis        │
│ (Vault Data) │ │ (Sessions)   │
└──────────────┘ └──────────────┘
```

## Development Environment Setup

### Prerequisites

Install the following tools:

1. **Git**: Version control
   ```bash
   # macOS
   brew install git
   
   # Windows
   winget install Git.Git
   
   # Linux
   sudo apt-get install git
   ```

2. **Docker Desktop**: For running PostgreSQL and Redis
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)

3. **Node.js 18+**: For frontend development
   ```bash
   # macOS
   brew install node@18
   
   # Windows
   winget install OpenJS.NodeJS.LTS
   
   # Linux
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Java 17+**: For backend development
   ```bash
   # macOS
   brew install openjdk@17
   
   # Windows
   winget install Microsoft.OpenJDK.17
   
   # Linux
   sudo apt-get install openjdk-17-jdk
   ```

5. **Maven 3.9+**: For building backend
   ```bash
   # macOS
   brew install maven
   
   # Windows
   winget install Apache.Maven
   
   # Linux
   sudo apt-get install maven
   ```

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/password-manager.git
cd password-manager

# Create your feature branch
git checkout -b feature/your-name-onboarding
```

### Start Infrastructure

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps

# Expected output:
# NAME                COMMAND                  SERVICE             STATUS
# postgres            "docker-entrypoint.s…"   postgres            Up
# redis               "docker-entrypoint.s…"   redis               Up
```

### Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Run database migrations
mvn flyway:migrate

# Build the application
mvn clean package -DskipTests

# Run the application
mvn spring-boot:run

# Backend should start on http://localhost:8080
# Check health: curl http://localhost:8080/actuator/health
```

### Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev

# Frontend should start on http://localhost:3000
# Open http://localhost:3000 in your browser
```

### Verify Setup

```bash
# Test backend
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Test frontend
curl http://localhost:3000
# Expected: HTML response

# Run backend tests
cd backend && mvn test

# Run frontend tests
cd frontend && npm test
```

## Codebase Tour

### Repository Structure

```
password-manager/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand state stores
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json         # Dependencies
│
├── backend/                 # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/passwordmanager/backend/
│   │   │   │   ├── controller/    # REST controllers
│   │   │   │   ├── service/       # Business logic
│   │   │   │   ├── repository/    # Data access
│   │   │   │   ├── entity/        # JPA entities
│   │   │   │   ├── dto/           # Data transfer objects
│   │   │   │   ├── config/        # Configuration
│   │   │   │   └── util/          # Utilities
│   │   │   └── resources/
│   │   │       ├── application.yml          # Configuration
│   │   │       └── db/migration/            # Flyway migrations
│   │   └── test/                            # Tests
│   └── pom.xml                              # Maven dependencies
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_INTEGRATION_GUIDE.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT_PROCEDURES.md
│   └── CODING_STANDARDS.md
│
├── .github/                 # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docker-compose.dev.yml   # Development infrastructure
├── docker-compose.yml       # Production infrastructure
└── README.md                # Project overview
```

### Key Files to Know

**Frontend**:
- `frontend/src/lib/crypto.ts` - Encryption/decryption logic
- `frontend/src/services/authService.ts` - Authentication API calls
- `frontend/src/services/vaultService.ts` - Vault operations
- `frontend/src/stores/authStore.ts` - Authentication state
- `frontend/src/stores/vaultStore.ts` - Vault state

**Backend**:
- `backend/src/main/java/com/passwordmanager/backend/controller/AuthController.java` - Auth endpoints
- `backend/src/main/java/com/passwordmanager/backend/controller/VaultController.java` - Vault endpoints
- `backend/src/main/java/com/passwordmanager/backend/service/AuthenticationService.java` - Auth logic
- `backend/src/main/java/com/passwordmanager/backend/service/VaultService.java` - Vault logic
- `backend/src/main/resources/application.yml` - Configuration

## Development Workflow

### 1. Pick a Task

- Check the [Project Board](https://github.com/your-org/password-manager/projects)
- Look for issues labeled `good first issue` or `help wanted`
- Assign yourself to the issue

### 2. Create a Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/issue-123-add-password-generator

# Or bugfix branch
git checkout -b bugfix/issue-456-fix-sync-error
```

### 3. Make Changes

- Write code following [Coding Standards](CODING_STANDARDS.md)
- Write tests for new functionality
- Update documentation if needed

### 4. Test Locally

```bash
# Run backend tests
cd backend
mvn test

# Run frontend tests
cd frontend
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(vault): add password generator

- Implement cryptographically secure password generation
- Add character type selection
- Add length configuration (8-128 characters)
- Add strength meter

Closes #123"
```

### 6. Push and Create PR

```bash
# Push branch
git push origin feature/issue-123-add-password-generator

# Create Pull Request on GitHub
# - Fill out the PR template
# - Link the issue
# - Request review from team members
```

### 7. Address Review Comments

```bash
# Make requested changes
# ...

# Commit changes
git add .
git commit -m "refactor(vault): address review comments"

# Push updates
git push origin feature/issue-123-add-password-generator
```

### 8. Merge

Once approved:
- Squash and merge into `main`
- Delete the feature branch
- Close the linked issue

## Key Concepts

### Zero-Knowledge Architecture

The server never has access to unencrypted user data:

1. **Master Password**: Never leaves the client
2. **Key Derivation**: PBKDF2 with 100,000+ iterations
3. **Encryption**: AES-256-GCM on client-side
4. **Server Storage**: Only encrypted blobs

```typescript
// Example: Encrypting a credential
const masterPassword = 'user-master-password';
const salt = generateSalt();

// Derive encryption key from master password
const encryptionKey = await deriveKey(masterPassword, salt, 100000);

// Encrypt credential
const credential = { username: 'user', password: 'pass' };
const encrypted = await encrypt(JSON.stringify(credential), encryptionKey);

// Send to server (server cannot decrypt)
await api.post('/vault/credential', {
  encryptedData: encrypted.data,
  iv: encrypted.iv,
  authTag: encrypted.authTag,
});
```

### Authentication Flow

1. User enters master password
2. Client derives auth key using PBKDF2
3. Client hashes auth key with BCrypt
4. Client sends hash to server
5. Server validates hash
6. Server generates JWT token
7. Client stores token for API requests

```typescript
// Example: Login flow
async function login(email: string, masterPassword: string) {
  // Derive auth key from master password
  const authKey = await deriveAuthKey(masterPassword, userSalt, iterations);
  
  // Hash auth key
  const authKeyHash = await bcrypt.hash(authKey, 10);
  
  // Send to server
  const response = await api.post('/auth/login', {
    email,
    authKeyHash,
  });
  
  // Store token
  localStorage.setItem('token', response.token);
}
```

### Sync Strategy

- **Automatic Sync**: Triggered 5 seconds after changes
- **Conflict Resolution**: Last-write-wins based on timestamps
- **Offline Support**: Changes queued locally and synced when online

```typescript
// Example: Sync flow
async function syncVault() {
  // Get local changes
  const localChanges = await getLocalChanges();
  
  // Send to server
  const response = await api.post('/vault/sync', {
    changes: localChanges,
    version: localVersion,
  });
  
  // Handle conflicts
  if (response.conflicts.length > 0) {
    await resolveConflicts(response.conflicts);
  }
  
  // Apply remote changes
  await applyRemoteChanges(response.changes);
}
```

## Common Tasks

### Adding a New API Endpoint

1. **Create DTO** (Data Transfer Object):
   ```java
   // backend/src/main/java/com/passwordmanager/backend/dto/MyRequest.java
   public class MyRequest {
       @NotBlank
       private String field;
       
       // Getters and setters
   }
   ```

2. **Add Controller Method**:
   ```java
   // backend/src/main/java/com/passwordmanager/backend/controller/MyController.java
   @PostMapping("/my-endpoint")
   public ResponseEntity<MyResponse> myEndpoint(@Valid @RequestBody MyRequest request) {
       MyResponse response = myService.doSomething(request);
       return ResponseEntity.ok(response);
   }
   ```

3. **Implement Service Logic**:
   ```java
   // backend/src/main/java/com/passwordmanager/backend/service/MyService.java
   @Service
   public class MyService {
       public MyResponse doSomething(MyRequest request) {
           // Business logic
       }
   }
   ```

4. **Add Frontend Service**:
   ```typescript
   // frontend/src/services/myService.ts
   export async function myEndpoint(data: MyRequest): Promise<MyResponse> {
       const response = await api.post('/my-endpoint', data);
       return response.data;
   }
   ```

### Adding a New React Component

1. **Create Component File**:
   ```typescript
   // frontend/src/components/MyComponent.tsx
   import React from 'react';
   
   interface MyComponentProps {
       title: string;
       onAction: () => void;
   }
   
   export function MyComponent({ title, onAction }: MyComponentProps) {
       return (
           <div>
               <h2>{title}</h2>
               <button onClick={onAction}>Action</button>
           </div>
       );
   }
   ```

2. **Add Tests**:
   ```typescript
   // frontend/src/components/__tests__/MyComponent.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { MyComponent } from '../MyComponent';
   
   describe('MyComponent', () => {
       it('should render title', () => {
           render(<MyComponent title="Test" onAction={() => {}} />);
           expect(screen.getByText('Test')).toBeInTheDocument();
       });
       
       it('should call onAction when button clicked', () => {
           const onAction = jest.fn();
           render(<MyComponent title="Test" onAction={onAction} />);
           fireEvent.click(screen.getByText('Action'));
           expect(onAction).toHaveBeenCalled();
       });
   });
   ```

3. **Export from Index**:
   ```typescript
   // frontend/src/components/index.ts
   export { MyComponent } from './MyComponent';
   ```

### Adding a Database Migration

1. **Create Migration File**:
   ```sql
   -- backend/src/main/resources/db/migration/V15__add_my_table.sql
   CREATE TABLE my_table (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       data TEXT NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE INDEX idx_my_table_user_id ON my_table(user_id);
   ```

2. **Run Migration**:
   ```bash
   cd backend
   mvn flyway:migrate
   ```

3. **Create Entity**:
   ```java
   // backend/src/main/java/com/passwordmanager/backend/entity/MyEntity.java
   @Entity
   @Table(name = "my_table")
   public class MyEntity {
       @Id
       @GeneratedValue(strategy = GenerationType.AUTO)
       private UUID id;
       
       @Column(name = "user_id", nullable = false)
       private UUID userId;
       
       @Column(nullable = false)
       private String data;
       
       @CreationTimestamp
       @Column(name = "created_at", nullable = false)
       private LocalDateTime createdAt;
       
       // Getters and setters
   }
   ```

4. **Create Repository**:
   ```java
   // backend/src/main/java/com/passwordmanager/backend/repository/MyRepository.java
   public interface MyRepository extends JpaRepository<MyEntity, UUID> {
       List<MyEntity> findByUserId(UUID userId);
   }
   ```

## Resources

### Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and design decisions
- [API Integration Guide](API_INTEGRATION_GUIDE.md) - REST API documentation
- [Database Schema](DATABASE_SCHEMA.md) - Database structure and migrations
- [Deployment Procedures](DEPLOYMENT_PROCEDURES.md) - Deployment guide
- [Coding Standards](CODING_STANDARDS.md) - Code style and best practices

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Team Communication

- **Slack**: #password-manager channel
- **GitHub Discussions**: For design discussions
- **GitHub Issues**: For bug reports and feature requests
- **Weekly Standup**: Mondays at 10 AM

### Getting Help

1. **Check Documentation**: Start with the docs in this repository
2. **Search Issues**: Someone may have had the same question
3. **Ask in Slack**: #password-manager channel
4. **Create Discussion**: For design questions
5. **Pair Programming**: Schedule time with a team member

## Next Steps

Now that you're set up:

1. ✅ Complete this onboarding guide
2. ✅ Set up your development environment
3. ✅ Run the application locally
4. ✅ Read the [Architecture](ARCHITECTURE.md) document
5. ✅ Review the [Coding Standards](CODING_STANDARDS.md)
6. ✅ Pick a `good first issue` from the project board
7. ✅ Create your first PR
8. ✅ Get your first PR merged

Welcome to the team! 🚀
