# Coding Standards

## Overview

This document defines the coding standards and best practices for the Password Manager project. All contributors must follow these guidelines to maintain code quality, consistency, and maintainability.

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript/JavaScript Standards](#typescriptjavascript-standards)
3. [Java Standards](#java-standards)
4. [React/Next.js Standards](#reactnextjs-standards)
5. [Spring Boot Standards](#spring-boot-standards)
6. [Testing Standards](#testing-standards)
7. [Git Commit Standards](#git-commit-standards)
8. [Code Review Guidelines](#code-review-guidelines)

## General Principles

### SOLID Principles

All code must adhere to SOLID principles:

1. **Single Responsibility Principle (SRP)**: Each class/function should have one reason to change
2. **Open/Closed Principle (OCP)**: Open for extension, closed for modification
3. **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for base types
4. **Interface Segregation Principle (ISP)**: Many specific interfaces are better than one general interface
5. **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

### Clean Code Principles

1. **Meaningful Names**: Use intention-revealing names
2. **Small Functions**: Functions should do one thing and do it well
3. **Comments**: Code should be self-documenting; use comments for "why" not "what"
4. **Error Handling**: Don't return null; use exceptions or Result types
5. **DRY**: Don't Repeat Yourself - extract common logic

### Code Organization

```
src/
├── components/     # UI components
├── services/       # Business logic
├── stores/         # State management
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── types/          # TypeScript types
└── __tests__/      # Test files
```

## TypeScript/JavaScript Standards

### File Naming

- **Components**: PascalCase (e.g., `CredentialCard.tsx`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `Credential.ts`)
- **Tests**: Match source file with `.test.ts` suffix

### Naming Conventions

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_PASSWORD_LENGTH = 128;
const API_BASE_URL = 'https://api.example.com';

// Variables and functions: camelCase
const userName = 'John Doe';
function calculatePasswordStrength(password: string): number {
  // ...
}

// Classes and interfaces: PascalCase
class PasswordGenerator {
  // ...
}

interface Credential {
  id: string;
  username: string;
  password: string;
}

// Type aliases: PascalCase
type CredentialId = string;
type PasswordStrength = 'weak' | 'medium' | 'strong';

// Enums: PascalCase for enum, UPPER_SNAKE_CASE for values
enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREDENTIAL_CREATED = 'CREDENTIAL_CREATED',
}
```

### TypeScript Best Practices

```typescript
// ✅ Good: Use explicit types
function encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
  // ...
}

// ❌ Bad: Implicit any
function encryptData(data, key) {
  // ...
}

// ✅ Good: Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// ❌ Bad: Inline object types
function getUser(): { id: string; email: string; createdAt: Date } {
  // ...
}

// ✅ Good: Use type guards
function isCredential(obj: unknown): obj is Credential {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    'password' in obj
  );
}

// ✅ Good: Use const assertions for literal types
const PERMISSIONS = ['READ', 'WRITE', 'DELETE'] as const;
type Permission = typeof PERMISSIONS[number];

// ✅ Good: Use utility types
type PartialCredential = Partial<Credential>;
type ReadonlyCredential = Readonly<Credential>;
type CredentialWithoutPassword = Omit<Credential, 'password'>;
```

### Async/Await

```typescript
// ✅ Good: Use async/await
async function fetchVault(): Promise<Vault> {
  try {
    const response = await api.get('/vault');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch vault', error);
    throw new VaultFetchError('Unable to fetch vault');
  }
}

// ❌ Bad: Promise chains
function fetchVault() {
  return api.get('/vault')
    .then(response => response.data)
    .catch(error => {
      logger.error('Failed to fetch vault', error);
      throw new VaultFetchError('Unable to fetch vault');
    });
}

// ✅ Good: Handle errors properly
async function saveCredential(credential: Credential): Promise<void> {
  try {
    await api.post('/vault/credential', credential);
  } catch (error) {
    if (error instanceof NetworkError) {
      // Handle network error
      throw new SyncError('Network unavailable');
    } else if (error instanceof ValidationError) {
      // Handle validation error
      throw new CredentialValidationError(error.message);
    } else {
      // Handle unexpected error
      throw new UnexpectedError('Failed to save credential');
    }
  }
}
```

### Error Handling

```typescript
// ✅ Good: Custom error classes
class VaultError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VaultError';
  }
}

class CredentialNotFoundError extends VaultError {
  constructor(id: string) {
    super(`Credential not found: ${id}`, 'CREDENTIAL_NOT_FOUND');
  }
}

// ✅ Good: Result type for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function decryptCredential(encrypted: EncryptedData): Promise<Result<Credential>> {
  try {
    const decrypted = await crypto.decrypt(encrypted);
    return { success: true, data: decrypted };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Usage
const result = await decryptCredential(encrypted);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Function Length

```typescript
// ✅ Good: Small, focused functions (< 30 lines)
function validatePassword(password: string): ValidationResult {
  if (password.length < 12) {
    return { valid: false, error: 'Password too short' };
  }
  
  if (!hasUpperCase(password)) {
    return { valid: false, error: 'Missing uppercase letter' };
  }
  
  if (!hasLowerCase(password)) {
    return { valid: false, error: 'Missing lowercase letter' };
  }
  
  if (!hasNumber(password)) {
    return { valid: false, error: 'Missing number' };
  }
  
  if (!hasSpecialChar(password)) {
    return { valid: false, error: 'Missing special character' };
  }
  
  return { valid: true };
}

// Helper functions
function hasUpperCase(str: string): boolean {
  return /[A-Z]/.test(str);
}

function hasLowerCase(str: string): boolean {
  return /[a-z]/.test(str);
}

function hasNumber(str: string): boolean {
  return /\d/.test(str);
}

function hasSpecialChar(str: string): boolean {
  return /[!@#$%^&*(),.?":{}|<>]/.test(str);
}
```

## Java Standards

### File Naming

- **Classes**: PascalCase (e.g., `UserService.java`)
- **Interfaces**: PascalCase (e.g., `VaultRepository.java`)
- **Tests**: PascalCase with `Test` suffix (e.g., `UserServiceTest.java`)

### Naming Conventions

```java
// Constants: UPPER_SNAKE_CASE
public static final int MAX_PASSWORD_LENGTH = 128;
public static final String API_VERSION = "v1";

// Variables and methods: camelCase
private String userName;
public void calculatePasswordStrength(String password) {
    // ...
}

// Classes and interfaces: PascalCase
public class PasswordGenerator {
    // ...
}

public interface VaultRepository extends JpaRepository<VaultEntry, UUID> {
    // ...
}

// Packages: lowercase
package com.passwordmanager.backend.service;
```

### Java Best Practices

```java
// ✅ Good: Use Optional instead of null
public Optional<User> findUserByEmail(String email) {
    return userRepository.findByEmail(email);
}

// ❌ Bad: Return null
public User findUserByEmail(String email) {
    return userRepository.findByEmail(email).orElse(null);
}

// ✅ Good: Use streams for collections
public List<Credential> getActiveCredentials(UUID userId) {
    return vaultRepository.findByUserId(userId).stream()
        .filter(entry -> entry.getDeletedAt() == null)
        .map(this::toCredential)
        .collect(Collectors.toList());
}

// ✅ Good: Use try-with-resources
public String readFile(String path) throws IOException {
    try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
        return reader.lines().collect(Collectors.joining("\n"));
    }
}

// ✅ Good: Use constructor injection
@Service
public class VaultService {
    private final VaultRepository vaultRepository;
    private final AuditLogService auditLogService;
    
    @Autowired
    public VaultService(VaultRepository vaultRepository, 
                       AuditLogService auditLogService) {
        this.vaultRepository = vaultRepository;
        this.auditLogService = auditLogService;
    }
}

// ❌ Bad: Field injection
@Service
public class VaultService {
    @Autowired
    private VaultRepository vaultRepository;
    
    @Autowired
    private AuditLogService auditLogService;
}
```

### Exception Handling

```java
// ✅ Good: Custom exceptions
public class VaultException extends RuntimeException {
    private final String errorCode;
    
    public VaultException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}

public class CredentialNotFoundException extends VaultException {
    public CredentialNotFoundException(UUID id) {
        super("Credential not found: " + id, "CREDENTIAL_NOT_FOUND");
    }
}

// ✅ Good: Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(CredentialNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCredentialNotFound(
            CredentialNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

### Validation

```java
// ✅ Good: Use Bean Validation
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Auth key hash is required")
    @Size(min = 60, max = 60, message = "Invalid auth key hash")
    private String authKeyHash;
    
    @NotBlank(message = "Salt is required")
    private String salt;
    
    @Min(value = 100000, message = "Iterations must be at least 100000")
    private Integer iterations;
    
    // Getters and setters
}

// ✅ Good: Custom validator
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = Base64Validator.class)
public @interface ValidBase64 {
    String message() default "Invalid Base64 encoding";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class Base64Validator implements ConstraintValidator<ValidBase64, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        try {
            Base64.getDecoder().decode(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
```

## React/Next.js Standards

### Component Structure

```typescript
// ✅ Good: Functional component with TypeScript
import React, { useState, useEffect } from 'react';

interface CredentialCardProps {
  credential: Credential;
  onCopy: (field: 'username' | 'password') => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CredentialCard({
  credential,
  onCopy,
  onEdit,
  onDelete,
}: CredentialCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      setIsRevealed(false);
    };
  }, []);
  
  const handleCopyUsername = () => {
    onCopy('username');
  };
  
  const handleCopyPassword = () => {
    onCopy('password');
  };
  
  return (
    <div className="credential-card">
      <h3>{credential.title}</h3>
      <div className="credential-field">
        <label>Username:</label>
        <span>{credential.username}</span>
        <button onClick={handleCopyUsername}>Copy</button>
      </div>
      <div className="credential-field">
        <label>Password:</label>
        <span>{isRevealed ? credential.password : '••••••••'}</span>
        <button onClick={() => setIsRevealed(!isRevealed)}>
          {isRevealed ? 'Hide' : 'Show'}
        </button>
        <button onClick={handleCopyPassword}>Copy</button>
      </div>
      <div className="credential-actions">
        <button onClick={() => onEdit(credential.id)}>Edit</button>
        <button onClick={() => onDelete(credential.id)}>Delete</button>
      </div>
    </div>
  );
}
```

### Hooks Best Practices

```typescript
// ✅ Good: Custom hook
export function useCredential(id: string) {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchCredential() {
      try {
        setLoading(true);
        const data = await vaultService.getCredential(id);
        if (!cancelled) {
          setCredential(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchCredential();
    
    return () => {
      cancelled = true;
    };
  }, [id]);
  
  return { credential, loading, error };
}

// Usage
function CredentialDetail({ id }: { id: string }) {
  const { credential, loading, error } = useCredential(id);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!credential) return <div>Not found</div>;
  
  return <CredentialCard credential={credential} />;
}
```

### State Management (Zustand)

```typescript
// ✅ Good: Zustand store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        const { token, user } = await authService.login(email, password);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      refreshToken: async () => {
        const { token } = await authService.refreshToken();
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
```

## Spring Boot Standards

### Controller Best Practices

```java
// ✅ Good: RESTful controller
@RestController
@RequestMapping("/api/v1/vault")
@Tag(name = "Vault", description = "Vault management endpoints")
public class VaultController {
    
    private final VaultService vaultService;
    
    @Autowired
    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }
    
    @GetMapping
    @Operation(summary = "Get vault", description = "Retrieve encrypted vault data")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vault retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<VaultResponse> getVault(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long lastSyncTime) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        VaultResponse vault = vaultService.getVault(userId, lastSyncTime);
        return ResponseEntity.ok(vault);
    }
    
    @PostMapping("/credential")
    @Operation(summary = "Create credential", description = "Create a new credential entry")
    public ResponseEntity<CredentialResponse> createCredential(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CredentialRequest request) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        CredentialResponse response = vaultService.createCredential(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

### Service Layer

```java
// ✅ Good: Service with transaction management
@Service
@Transactional
public class VaultService {
    
    private final VaultRepository vaultRepository;
    private final AuditLogService auditLogService;
    
    @Autowired
    public VaultService(VaultRepository vaultRepository,
                       AuditLogService auditLogService) {
        this.vaultRepository = vaultRepository;
        this.auditLogService = auditLogService;
    }
    
    @Transactional(readOnly = true)
    public VaultResponse getVault(UUID userId, Long lastSyncTime) {
        List<VaultEntry> entries = lastSyncTime != null
            ? vaultRepository.findByUserIdAndUpdatedAtAfter(userId, 
                Instant.ofEpochMilli(lastSyncTime))
            : vaultRepository.findByUserIdAndDeletedAtIsNull(userId);
        
        return toVaultResponse(entries);
    }
    
    public CredentialResponse createCredential(UUID userId, CredentialRequest request) {
        VaultEntry entry = new VaultEntry();
        entry.setUserId(userId);
        entry.setEncryptedData(request.getEncryptedData());
        entry.setIv(request.getIv());
        entry.setAuthTag(request.getAuthTag());
        
        VaultEntry saved = vaultRepository.save(entry);
        
        auditLogService.log(userId, AuditAction.CREDENTIAL_CREATED, saved.getId());
        
        return toCredentialResponse(saved);
    }
    
    private VaultResponse toVaultResponse(List<VaultEntry> entries) {
        // Mapping logic
    }
    
    private CredentialResponse toCredentialResponse(VaultEntry entry) {
        // Mapping logic
    }
}
```

## Testing Standards

### Unit Test Structure

```typescript
// ✅ Good: Unit test structure
describe('PasswordGenerator', () => {
  describe('generatePassword', () => {
    it('should generate password with specified length', () => {
      const generator = new PasswordGenerator();
      const password = generator.generatePassword({ length: 16 });
      
      expect(password).toHaveLength(16);
    });
    
    it('should include only selected character types', () => {
      const generator = new PasswordGenerator();
      const password = generator.generatePassword({
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
      });
      
      expect(password).toMatch(/^[A-Za-z]+$/);
    });
    
    it('should throw error for invalid length', () => {
      const generator = new PasswordGenerator();
      
      expect(() => {
        generator.generatePassword({ length: 7 });
      }).toThrow('Length must be between 8 and 128');
    });
  });
});
```

### Property-Based Testing

```typescript
// ✅ Good: Property-based test
import * as fc from 'fast-check';

describe('Encryption', () => {
  it('should satisfy round-trip property', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 1000 }),
        async (plaintext) => {
          const key = await crypto.generateKey();
          const encrypted = await crypto.encrypt(plaintext, key);
          const decrypted = await crypto.decrypt(encrypted, key);
          
          expect(decrypted).toBe(plaintext);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

```java
// ✅ Good: Integration test
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VaultControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private VaultRepository vaultRepository;
    
    private String jwtToken;
    
    @BeforeEach
    void setUp() {
        // Create test user and get JWT token
        User user = createTestUser();
        jwtToken = generateJwtToken(user);
    }
    
    @Test
    void shouldCreateCredential() throws Exception {
        CredentialRequest request = new CredentialRequest();
        request.setEncryptedData("encrypted-data");
        request.setIv("iv");
        request.setAuthTag("auth-tag");
        
        mockMvc.perform(post("/api/v1/vault/credential")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.version").value(1));
    }
}
```

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `test`: Add or update tests
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### Examples

```
feat(auth): implement two-factor authentication

- Add TOTP secret generation
- Create QR code for authenticator apps
- Generate backup codes
- Add 2FA verification to login flow

Closes #123
```

```
fix(vault): correct soft delete behavior

Credentials were being permanently deleted instead of moved to trash.
Fixed by setting deletedAt timestamp instead of removing from database.

Fixes #456
```

```
test(crypto): add property test for encryption round-trip

Added property-based test to verify that encrypting and then decrypting
any data produces the original data.

**Property 1: Encryption round-trip consistency**
```

## Code Review Guidelines

### Reviewer Checklist

- [ ] Code follows project coding standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Error handling is appropriate
- [ ] Code is readable and maintainable
- [ ] No unnecessary complexity
- [ ] Commit messages are clear

### Review Comments

```
// ✅ Good: Constructive feedback
"Consider extracting this logic into a separate function for better testability.
Something like `validatePasswordStrength(password)` would make this more readable."

// ❌ Bad: Vague criticism
"This code is bad."

// ✅ Good: Specific suggestion
"This query could cause N+1 problem. Consider using JOIN FETCH to load
related entities in a single query."

// ✅ Good: Ask questions
"What happens if the user is null here? Should we add a null check?"
```

### Approval Criteria

- All tests passing
- Code coverage maintained or improved
- No unresolved comments
- Documentation updated
- Security review completed (if needed)
- Performance impact assessed (if needed)

## Tools and Automation

### Linting

**Frontend (ESLint)**:
```bash
npm run lint
npm run lint:fix
```

**Backend (Checkstyle)**:
```bash
mvn checkstyle:check
```

### Formatting

**Frontend (Prettier)**:
```bash
npm run format
npm run format:check
```

**Backend (Google Java Format)**:
```bash
mvn fmt:format
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm run prepare

# Hooks will run automatically on git commit
# - Lint staged files
# - Format code
# - Run tests
```

## References

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Effective Java by Joshua Bloch](https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Spring Boot Best Practices](https://spring.io/guides)
