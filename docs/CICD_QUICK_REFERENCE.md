# CI/CD Quick Reference Guide

## Quick Commands

### Local Testing (Before Push)

**Frontend:**
```bash
cd frontend
npm run lint              # Run ESLint
npm run format            # Run Prettier
npm test                  # Run tests
npm run test:coverage     # Run tests with coverage
npm run build             # Build production bundle
npm run check-bundle-size # Check bundle size
```

**Backend:**
```bash
cd backend
mvn checkstyle:check      # Run Checkstyle
mvn test                  # Run tests
mvn jacoco:report         # Generate coverage report
mvn dependency-check:check # Run OWASP check
mvn clean package         # Build JAR
```

## Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | Push/PR to main/develop | Run tests and quality checks |
| Code Quality | Push/PR/Weekly | Advanced code analysis |
| PR Checks | PR opened/updated | Validate PR requirements |
| Deploy Staging | Push to develop | Deploy to staging environment |
| Deploy Production | Tag v*.*.* | Deploy to production |
| Dependency Updates | Weekly/Manual | Update dependencies |
| E2E Tests | Push/PR/Manual | Run end-to-end tests |

## Common CI/CD Tasks

### Creating a Release

1. Ensure all tests pass on `main`
2. Create and push a tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically:
   - Build Docker images
   - Deploy to production
   - Create GitHub Release

### Manual Staging Deployment

1. Go to Actions → Deploy to Staging
2. Click "Run workflow"
3. Select `develop` branch
4. Click "Run workflow"

### Manual Production Deployment

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter version (e.g., v1.0.0)
4. Click "Run workflow"

### Fixing Failed CI

**If tests fail:**
```bash
# Run tests locally
npm test                  # Frontend
mvn test                  # Backend

# Fix issues and commit
git add .
git commit -m "fix(tests): resolve failing tests"
git push
```

**If linting fails:**
```bash
# Auto-fix linting issues
npm run lint:fix          # Frontend
mvn checkstyle:check      # Backend (manual fixes)

git add .
git commit -m "style: fix linting issues"
git push
```

**If security scan fails:**
```bash
# Update vulnerable dependencies
npm audit fix             # Frontend
mvn versions:use-latest-releases  # Backend

git add .
git commit -m "chore(deps): update vulnerable dependencies"
git push
```

## PR Checklist

Before creating a PR:
- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] Coverage meets minimum threshold
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Commit messages follow convention

PR title format:
```
<type>(<scope>): <description>

Examples:
feat(auth): add biometric authentication
fix(vault): resolve sync conflict issue
docs(api): update endpoint documentation
```

## Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Backend | 70% line coverage |
| Frontend | Tracked (no minimum) |

View coverage reports:
- **Backend:** `backend/target/site/jacoco/index.html`
- **Frontend:** `frontend/coverage/lcov-report/index.html`

## Security Scan Results

View security findings:
1. Go to repository → Security tab
2. Check:
   - Code scanning alerts (CodeQL, Trivy)
   - Dependabot alerts
   - Secret scanning alerts

## Deployment Status

Check deployment status:
1. Go to Actions tab
2. Select deployment workflow
3. View logs and status
4. Check environment URLs:
   - Staging: https://staging.your-domain.com
   - Production: https://your-domain.com

## Rollback Procedure

### Staging Rollback
```bash
# SSH to staging server
ssh user@staging-server

# Navigate to app directory
cd /opt/password-manager

# Pull previous version
docker-compose down
docker-compose pull
docker-compose up -d
```

### Production Rollback
1. Go to Actions → Deploy to Production
2. Find last successful deployment
3. Click "Re-run jobs"
4. Or use rollback script:
   ```bash
   ./scripts/rollback.sh v1.0.0
   ```

## Troubleshooting

### "Tests pass locally but fail in CI"

**Possible causes:**
- Environment differences
- Missing environment variables
- Database/Redis connection issues

**Solution:**
```bash
# Check CI logs for specific error
# Ensure .env.example is up to date
# Verify test database configuration
```

### "Docker build fails"

**Possible causes:**
- Dockerfile syntax error
- Missing dependencies
- Build context issues

**Solution:**
```bash
# Test Docker build locally
docker build -t test-image ./backend
docker build -t test-image ./frontend

# Check Dockerfile and .dockerignore
```

### "Deployment succeeds but app doesn't work"

**Possible causes:**
- Missing environment variables
- Database migration issues
- Configuration errors

**Solution:**
```bash
# Check application logs
docker-compose logs backend
docker-compose logs frontend

# Verify environment variables
# Check database migrations
```

## Useful Links

- [Full CI/CD Documentation](./CICD_PIPELINE.md)
- [GitHub Actions Logs](../../actions)
- [Security Alerts](../../security)
- [Codecov Dashboard](https://codecov.io/gh/your-org/password-manager)
- [SonarCloud Dashboard](https://sonarcloud.io/dashboard?id=password-manager)

## Getting Help

1. Check workflow logs in GitHub Actions
2. Review this quick reference
3. Read full documentation
4. Ask in team chat
5. Create issue if bug found

## Maintenance Schedule

| Task | Frequency | Day/Time |
|------|-----------|----------|
| Dependency updates | Weekly | Monday 9 AM UTC |
| Security scans | Weekly | Sunday 2 AM UTC |
| E2E tests | On push | Automatic |
| Code quality analysis | On push | Automatic |

## Environment Variables Reference

### Required for CI

Set in GitHub repository settings → Secrets:

```
CODECOV_TOKEN
SONAR_TOKEN
SNYK_TOKEN
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
PROD_HOST
PROD_USER
PROD_SSH_KEY
```

### Required for Deployment

Set in deployment environment:

```
DATABASE_URL
REDIS_URL
JWT_SECRET
API_URL
NEXT_PUBLIC_API_URL
```

## Status Badges

Add to README.md:

```markdown
![CI](https://github.com/your-org/password-manager/workflows/CI/badge.svg)
![Code Quality](https://github.com/your-org/password-manager/workflows/Code%20Quality/badge.svg)
[![codecov](https://codecov.io/gh/your-org/password-manager/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/password-manager)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=password-manager&metric=alert_status)](https://sonarcloud.io/dashboard?id=password-manager)
```
