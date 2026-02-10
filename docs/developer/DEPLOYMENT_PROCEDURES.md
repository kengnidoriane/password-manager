# Deployment Procedures

## Overview

This document provides step-by-step procedures for deploying the Password Manager application to various environments. It covers local development, staging, and production deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring and Verification](#monitoring-and-verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **kubectl**: Version 1.25+
- **Helm**: Version 3.10+
- **Terraform**: Version 1.5+ (for infrastructure)
- **Git**: Version 2.30+
- **Node.js**: Version 18+ (for frontend development)
- **Java**: Version 17+ (for backend development)
- **Maven**: Version 3.9+ (for backend builds)

### Access Requirements

- **GitHub**: Repository access with appropriate permissions
- **Container Registry**: Push access to Docker registry
- **Kubernetes Cluster**: kubectl configured with cluster access
- **Cloud Provider**: AWS/Azure/GCP credentials configured
- **Secrets Manager**: Access to secrets management system

### Environment Variables

Create `.env` files for each environment:

```bash
# .env.development
DATABASE_URL=jdbc:postgresql://localhost:5432/passwordmanager
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-dev-secret
FRONTEND_URL=http://localhost:3000

# .env.staging
DATABASE_URL=jdbc:postgresql://staging-db:5432/passwordmanager
REDIS_HOST=staging-redis
JWT_SECRET=your-staging-secret
FRONTEND_URL=https://staging.passwordmanager.com

# .env.production
DATABASE_URL=jdbc:postgresql://prod-db:5432/passwordmanager
REDIS_HOST=prod-redis
JWT_SECRET=your-prod-secret
FRONTEND_URL=https://passwordmanager.com
```

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/password-manager.git
cd password-manager
```

### 2. Start Infrastructure with Docker Compose

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

### 3. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Run database migrations
mvn flyway:migrate

# Build application
mvn clean package -DskipTests

# Run application
mvn spring-boot:run
```

Backend will be available at `http://localhost:8080`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 5. Verify Setup

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Check frontend
curl http://localhost:3000

# Run tests
cd backend && mvn test
cd frontend && npm test
```

## Staging Deployment

### 1. Pre-Deployment Checklist

- [ ] All tests passing in CI/CD
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Secrets updated in secrets manager
- [ ] Staging database backed up

### 2. Build Docker Images

```bash
# Build backend image
cd backend
docker build -t password-manager-backend:staging .

# Build frontend image
cd frontend
docker build -t password-manager-frontend:staging .

# Tag images
docker tag password-manager-backend:staging registry.example.com/password-manager-backend:staging
docker tag password-manager-frontend:staging registry.example.com/password-manager-frontend:staging

# Push to registry
docker push registry.example.com/password-manager-backend:staging
docker push registry.example.com/password-manager-frontend:staging
```

### 3. Deploy to Kubernetes (Staging)

```bash
# Set kubectl context to staging
kubectl config use-context staging

# Create namespace if not exists
kubectl create namespace password-manager-staging --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMaps
kubectl apply -f k8s/staging/configmap.yaml -n password-manager-staging

# Apply Secrets (from secrets manager)
kubectl apply -f k8s/staging/secrets.yaml -n password-manager-staging

# Run database migrations
kubectl apply -f k8s/staging/migration-job.yaml -n password-manager-staging
kubectl wait --for=condition=complete job/db-migration -n password-manager-staging --timeout=300s

# Deploy backend
kubectl apply -f k8s/staging/backend-deployment.yaml -n password-manager-staging
kubectl apply -f k8s/staging/backend-service.yaml -n password-manager-staging

# Deploy frontend
kubectl apply -f k8s/staging/frontend-deployment.yaml -n password-manager-staging
kubectl apply -f k8s/staging/frontend-service.yaml -n password-manager-staging

# Apply Ingress
kubectl apply -f k8s/staging/ingress.yaml -n password-manager-staging

# Wait for rollout
kubectl rollout status deployment/password-manager-backend -n password-manager-staging
kubectl rollout status deployment/password-manager-frontend -n password-manager-staging
```

### 4. Verify Staging Deployment

```bash
# Check pod status
kubectl get pods -n password-manager-staging

# Check logs
kubectl logs -f deployment/password-manager-backend -n password-manager-staging
kubectl logs -f deployment/password-manager-frontend -n password-manager-staging

# Check health endpoints
curl https://api-staging.passwordmanager.com/actuator/health
curl https://staging.passwordmanager.com

# Run smoke tests
npm run test:e2e:staging
```

### 5. Staging Smoke Tests

```bash
# Run automated smoke tests
cd frontend
npm run test:smoke -- --env=staging

# Manual verification checklist:
# - [ ] User registration works
# - [ ] User login works
# - [ ] Credential creation works
# - [ ] Credential retrieval works
# - [ ] Password generation works
# - [ ] Sync works across devices
# - [ ] Security dashboard loads
# - [ ] Audit logs visible
```

## Production Deployment

### 1. Pre-Production Checklist

- [ ] Staging deployment successful
- [ ] All smoke tests passing
- [ ] Security scan completed
- [ ] Performance tests passed
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Stakeholder approval obtained
- [ ] Maintenance window scheduled (if needed)
- [ ] Monitoring alerts configured
- [ ] On-call engineer available

### 2. Production Deployment Strategy

We use **Blue-Green Deployment** for zero-downtime deployments:

```
Current (Blue)          New (Green)
┌──────────────┐       ┌──────────────┐
│   v1.0.0     │       │   v1.1.0     │
│              │       │              │
│ 3 replicas   │       │ 3 replicas   │
└──────────────┘       └──────────────┘
       ▲                      │
       │                      │
       │                      │
   ┌───┴──────────────────────▼───┐
   │     Load Balancer             │
   │  (Switch traffic gradually)   │
   └───────────────────────────────┘
```

### 3. Build Production Images

```bash
# Checkout release branch
git checkout release/v1.1.0

# Build and tag images
docker build -t password-manager-backend:1.1.0 ./backend
docker build -t password-manager-frontend:1.1.0 ./frontend

# Tag for registry
docker tag password-manager-backend:1.1.0 registry.example.com/password-manager-backend:1.1.0
docker tag password-manager-frontend:1.1.0 registry.example.com/password-manager-frontend:1.1.0

# Also tag as latest
docker tag password-manager-backend:1.1.0 registry.example.com/password-manager-backend:latest
docker tag password-manager-frontend:1.1.0 registry.example.com/password-manager-frontend:latest

# Push to registry
docker push registry.example.com/password-manager-backend:1.1.0
docker push registry.example.com/password-manager-frontend:1.1.0
docker push registry.example.com/password-manager-backend:latest
docker push registry.example.com/password-manager-frontend:latest
```

### 4. Database Migration (Production)

```bash
# Set kubectl context to production
kubectl config use-context production

# Backup database first
kubectl exec -it postgres-0 -n password-manager-prod -- \
  pg_dump -U postgres passwordmanager > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations in a job
kubectl apply -f k8s/production/migration-job.yaml -n password-manager-prod

# Monitor migration
kubectl logs -f job/db-migration -n password-manager-prod

# Verify migration success
kubectl wait --for=condition=complete job/db-migration -n password-manager-prod --timeout=600s
```

### 5. Deploy Green Environment

```bash
# Deploy new version (green)
kubectl apply -f k8s/production/backend-deployment-green.yaml -n password-manager-prod
kubectl apply -f k8s/production/frontend-deployment-green.yaml -n password-manager-prod

# Wait for green deployment to be ready
kubectl rollout status deployment/password-manager-backend-green -n password-manager-prod
kubectl rollout status deployment/password-manager-frontend-green -n password-manager-prod

# Verify green environment health
kubectl get pods -l version=green -n password-manager-prod
```

### 6. Smoke Test Green Environment

```bash
# Test green environment directly (before switching traffic)
kubectl port-forward deployment/password-manager-backend-green 8080:8080 -n password-manager-prod &

# Run smoke tests against green
curl http://localhost:8080/actuator/health

# Run automated tests
npm run test:smoke -- --env=production-green

# Kill port-forward
kill %1
```

### 7. Switch Traffic to Green

```bash
# Gradual traffic shift using Ingress weights
# Start with 10% traffic to green
kubectl patch ingress password-manager-ingress -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/metadata/annotations/nginx.ingress.kubernetes.io~1canary-weight", "value": "10"}]'

# Monitor metrics for 5 minutes
# Check error rates, latency, etc.

# If metrics look good, increase to 50%
kubectl patch ingress password-manager-ingress -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/metadata/annotations/nginx.ingress.kubernetes.io~1canary-weight", "value": "50"}]'

# Monitor for another 5 minutes

# If still good, switch 100% to green
kubectl patch service password-manager-backend -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "green"}]'

kubectl patch service password-manager-frontend -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "green"}]'
```

### 8. Monitor Production Deployment

```bash
# Watch pod status
watch kubectl get pods -n password-manager-prod

# Monitor logs
kubectl logs -f deployment/password-manager-backend-green -n password-manager-prod

# Check metrics
kubectl top pods -n password-manager-prod

# Monitor application metrics (Grafana)
open https://grafana.example.com/d/password-manager

# Check error rates
kubectl logs -f deployment/password-manager-backend-green -n password-manager-prod | grep ERROR
```

### 9. Cleanup Blue Environment

```bash
# After 24 hours of successful green deployment, remove blue
kubectl delete deployment password-manager-backend-blue -n password-manager-prod
kubectl delete deployment password-manager-frontend-blue -n password-manager-prod

# Rename green to blue for next deployment
kubectl patch deployment password-manager-backend-green -n password-manager-prod \
  --type=json -p='[{"op": "replace", "path": "/metadata/name", "value": "password-manager-backend-blue"}]'
```

## Rollback Procedures

### Immediate Rollback (Within 1 Hour)

If critical issues are detected immediately after deployment:

```bash
# Switch traffic back to blue (previous version)
kubectl patch service password-manager-backend -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "blue"}]'

kubectl patch service password-manager-frontend -n password-manager-prod --type=json \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "blue"}]'

# Verify rollback
kubectl get pods -l version=blue -n password-manager-prod
curl https://api.passwordmanager.com/actuator/health

# Delete green deployment
kubectl delete deployment password-manager-backend-green -n password-manager-prod
kubectl delete deployment password-manager-frontend-green -n password-manager-prod
```

### Database Rollback

If database migration needs to be rolled back:

```bash
# Restore from backup
kubectl exec -it postgres-0 -n password-manager-prod -- \
  psql -U postgres -d passwordmanager < backup-20240210-120000.sql

# Or use point-in-time recovery (if available)
# This depends on your database setup (RDS, Cloud SQL, etc.)
```

### Rollback Checklist

- [ ] Identify issue and severity
- [ ] Notify stakeholders
- [ ] Switch traffic to previous version
- [ ] Verify application functionality
- [ ] Check database consistency
- [ ] Monitor error rates
- [ ] Document incident
- [ ] Schedule post-mortem

## Monitoring and Verification

### Health Checks

```bash
# Backend health
curl https://api.passwordmanager.com/actuator/health

# Frontend health
curl https://passwordmanager.com

# Database connectivity
kubectl exec -it postgres-0 -n password-manager-prod -- \
  psql -U postgres -c "SELECT 1"

# Redis connectivity
kubectl exec -it redis-0 -n password-manager-prod -- \
  redis-cli ping
```

### Metrics to Monitor

1. **Application Metrics**:
   - Request rate (requests/second)
   - Error rate (%)
   - Response time (p50, p95, p99)
   - Active sessions

2. **Infrastructure Metrics**:
   - CPU usage (%)
   - Memory usage (%)
   - Disk I/O
   - Network traffic

3. **Business Metrics**:
   - User registrations
   - Login success rate
   - Vault operations
   - Sync events

### Alerting

Configure alerts for:

- Error rate > 1%
- Response time p99 > 1000ms
- CPU usage > 80%
- Memory usage > 85%
- Database connection pool exhausted
- Redis connection failures

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n password-manager-prod

# Check logs
kubectl logs <pod-name> -n password-manager-prod

# Common causes:
# - Image pull errors (check registry access)
# - Resource limits (check CPU/memory)
# - ConfigMap/Secret missing
# - Health check failures
```

#### 2. Database Connection Failures

```bash
# Check database pod
kubectl get pods -l app=postgres -n password-manager-prod

# Check database logs
kubectl logs postgres-0 -n password-manager-prod

# Test connection from application pod
kubectl exec -it <backend-pod> -n password-manager-prod -- \
  psql -h postgres -U postgres -d passwordmanager

# Common causes:
# - Wrong credentials
# - Network policy blocking
# - Database not ready
# - Connection pool exhausted
```

#### 3. High Memory Usage

```bash
# Check memory usage
kubectl top pods -n password-manager-prod

# Check for memory leaks
kubectl exec -it <backend-pod> -n password-manager-prod -- \
  jmap -heap 1

# Restart pod if needed
kubectl delete pod <pod-name> -n password-manager-prod

# Increase memory limits if necessary
kubectl patch deployment password-manager-backend -n password-manager-prod \
  --type=json -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/resources/limits/memory", "value": "2Gi"}]'
```

#### 4. Slow Response Times

```bash
# Check database query performance
kubectl exec -it postgres-0 -n password-manager-prod -- \
  psql -U postgres -d passwordmanager -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Check Redis performance
kubectl exec -it redis-0 -n password-manager-prod -- \
  redis-cli --latency

# Check application logs for slow operations
kubectl logs <backend-pod> -n password-manager-prod | grep "took.*ms"

# Common causes:
# - Missing database indexes
# - N+1 query problems
# - Large result sets
# - Network latency
```

### Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **DevOps Team**: devops@example.com
- **Security Team**: security@example.com
- **Database Admin**: dba@example.com

### Incident Response

1. **Detect**: Monitoring alerts or user reports
2. **Assess**: Determine severity and impact
3. **Respond**: Implement fix or rollback
4. **Communicate**: Notify stakeholders
5. **Resolve**: Verify fix is working
6. **Document**: Write incident report
7. **Review**: Conduct post-mortem

## Automation with CI/CD

### GitHub Actions Workflow

The deployment is automated using GitHub Actions:

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Push Images
        run: |
          docker build -t registry.example.com/password-manager-backend:${{ github.ref_name }} ./backend
          docker push registry.example.com/password-manager-backend:${{ github.ref_name }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/password-manager-backend \
            backend=registry.example.com/password-manager-backend:${{ github.ref_name }} \
            -n password-manager-prod
      
      - name: Wait for Rollout
        run: |
          kubectl rollout status deployment/password-manager-backend -n password-manager-prod
      
      - name: Run Smoke Tests
        run: |
          npm run test:smoke -- --env=production
```

### Manual Deployment Trigger

To manually trigger a deployment:

```bash
# Tag release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# This will trigger the GitHub Actions workflow
```

## Security Considerations

1. **Secrets Management**: Never commit secrets to Git
2. **Image Scanning**: Scan Docker images for vulnerabilities
3. **Network Policies**: Restrict pod-to-pod communication
4. **RBAC**: Use least-privilege access for kubectl
5. **Audit Logging**: Enable Kubernetes audit logs
6. **TLS**: Use TLS for all external communication

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Helm Documentation](https://helm.sh/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Internal Runbook](https://wiki.example.com/password-manager/runbook)
