# Password Manager

A secure Progressive Web Application (PWA) for managing passwords with zero-knowledge encryption architecture.

[![CI](https://github.com/your-username/password-manager/workflows/CI/badge.svg)](https://github.com/your-username/password-manager/actions)
[![Deploy Staging](https://github.com/your-username/password-manager/workflows/Deploy%20to%20Staging/badge.svg)](https://github.com/your-username/password-manager/actions)
[![Deploy Production](https://github.com/your-username/password-manager/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/your-username/password-manager/actions)

## Project Structure

```
password-manager/
├── frontend/          # Next.js 14+ PWA frontend
├── backend/           # Spring Boot 3.x backend
├── docker-compose.yml # Docker Compose configuration
└── README.md          # This file
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with React 18 and TypeScript
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Local Storage**: Dexie.js (IndexedDB)
- **PWA**: @ducanh2912/next-pwa
- **Cryptography**: Web Crypto API

### Backend
- **Framework**: Spring Boot 3.x with Java 17
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **Security**: Spring Security + JWT
- **API Documentation**: Springdoc OpenAPI (Swagger)
- **Migrations**: Flyway

## Prerequisites

- Node.js 20+
- Java 17+
- Maven 3.9+
- Docker & Docker Compose (for local development)

## Getting Started

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd password-manager

# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

### 2. Using Docker Compose (Recommended)

#### Option A: Full Stack with Docker

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Option B: Database Services Only (for local development)

```bash
# Start only PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Then run frontend and backend manually (see Manual Setup below)

# Stop services
docker-compose -f docker-compose.dev.yml down
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

### 3. Manual Setup (Development)

#### Backend

```bash
cd backend

# Install dependencies and build
mvn clean install

# Run the application
mvn spring-boot:run

# Or run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Development

### Frontend Development

```bash
cd frontend

# Run development server with hot reload
npm run dev

# Run linting
npm run lint

# Format code
npx prettier --write .
```

### Backend Development

```bash
cd backend

# Run tests
mvn test

# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Package application
mvn package
```

## Code Quality

### Frontend
- **ESLint**: Configured with Next.js and Prettier rules
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Strict type checking enabled

### Backend
- **Checkstyle**: Java code style enforcement
- **SpotBugs**: Static analysis for bug detection
- **Maven**: Dependency management and build automation

## Environment Variables

### Frontend (.env.local)
See `frontend/.env.example` for all available configuration options.

Key variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SESSION_TIMEOUT_MS`: Session timeout in milliseconds
- `NEXT_PUBLIC_PBKDF2_ITERATIONS`: PBKDF2 iterations for key derivation

### Backend (.env)
See `backend/.env.example` for all available configuration options.

Key variables:
- `SPRING_DATASOURCE_URL`: PostgreSQL connection URL
- `JWT_SECRET`: Secret key for JWT token signing
- `CORS_ALLOWED_ORIGINS`: Allowed CORS origins

## Database Migrations

Database migrations are managed with Flyway and located in `backend/src/main/resources/db/migration/`.

```bash
# Migrations run automatically on application startup
# To run manually:
mvn flyway:migrate

# To clean database (development only):
mvn flyway:clean
```

## API Documentation

When running in development mode, API documentation is available at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI Spec: http://localhost:8080/v3/api-docs

## Security

This application implements zero-knowledge encryption:
- Master passwords never leave the client
- All vault data is encrypted client-side with AES-256-GCM
- Server only stores encrypted blobs
- PBKDF2 with 100,000+ iterations for key derivation

## License

[Your License Here]

## CI/CD

This project uses GitHub Actions for continuous integration and deployment.

### 📚 Documentation CI/CD

- **[📋 Récapitulatif Complet](CICD_SUMMARY.md)** - Vue d'ensemble de tout ce qui a été créé
- **[🚀 Guide d'Implémentation](CICD_IMPLEMENTATION_GUIDE.md)** - Configuration étape par étape (2-3h)
- **[✅ Checklist](CICD_CHECKLIST.md)** - Liste de vérification rapide
- **[🔧 Dépannage](CICD_TROUBLESHOOTING.md)** - Solutions aux problèmes courants
- **[⚡ Démarrage Rapide](QUICK_START.md)** - Setup en 5 minutes
- **[🤝 Contribution](CONTRIBUTING.md)** - Guide pour contribuer

### Workflows

- **CI**: Runs tests, linting, and security scans on every push and PR
- **Deploy to Staging**: Automatically deploys to staging on push to `develop`
- **Deploy to Production**: Deploys to production when a version tag is pushed

### Quick Deployment

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Manual deployment
./scripts/deploy.sh production v1.0.0

# Rollback
./scripts/rollback.sh production v0.9.0
```

See [CI/CD Documentation](.github/README_CICD.md) for complete information.

## Contributing

[Your Contributing Guidelines Here]
