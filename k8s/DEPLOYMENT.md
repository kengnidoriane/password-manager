# Kubernetes Deployment Documentation

## Overview

This document provides comprehensive information about deploying the Password Manager application to Kubernetes.

## Directory Structure

```
k8s/
├── README.md                      # Quick start guide
├── DEPLOYMENT.md                  # This file - detailed deployment documentation
├── deploy.sh                      # Automated deployment script
├── rollback.sh                    # Rollback script
├── kustomization.yaml             # Base kustomization configuration
│
├── namespace.yaml                 # Namespace definition
├── secret.yaml                    # Secrets (passwords, keys)
├── configmap-backend.yaml         # Backend configuration
├── configmap-frontend.yaml        # Frontend configuration
│
├── postgres-statefulset.yaml     # PostgreSQL database
├── redis-statefulset.yaml         # Redis cache
├── backend-deployment.yaml        # Backend application
├── backend-service.yaml           # Backend service
├── frontend-deployment.yaml       # Frontend application
├── frontend-service.yaml          # Frontend service
│
├── ingress.yaml                   # Ingress with TLS
├── hpa-backend.yaml               # Backend auto-scaling
├── hpa-frontend.yaml              # Frontend auto-scaling
├── pdb-backend.yaml               # Backend disruption budget
├── pdb-frontend.yaml              # Frontend disruption budget
│
├── networkpolicy.yaml             # Network security policies
├── resourcequota.yaml             # Resource limits
├── servicemonitor.yaml            # Prometheus monitoring
├── backup-cronjob.yaml            # Automated backups
│
└── overlays/                      # Environment-specific configurations
    ├── staging/
    │   ├── kustomization.yaml
    │   ├── patch-ingress.yaml
    │   └── patch-resources.yaml
    └── production/
        ├── kustomization.yaml
        ├── patch-hpa.yaml
        └── patch-pdb.yaml
```

## Architecture

### Components

1. **Frontend (Next.js PWA)**
   - 3 replicas (default), auto-scales to 10
   - 256Mi-512Mi memory, 250m-500m CPU
   - Serves the Progressive Web Application
   - Communicates with backend API

2. **Backend (Spring Boot)**
   - 3 replicas (default), auto-scales to 10
   - 512Mi-1Gi memory, 500m-1000m CPU
   - REST API with JWT authentication
   - Connects to PostgreSQL and Redis

3. **PostgreSQL**
   - StatefulSet with persistent storage
   - 10Gi persistent volume
   - Stores encrypted vault data
   - Automated daily backups

4. **Redis**
   - StatefulSet with persistent storage
   - 5Gi persistent volume
   - Session management and caching
   - LRU eviction policy

5. **Ingress**
   - NGINX Ingress Controller
   - TLS termination
   - Security headers
   - Rate limiting

### Network Architecture

```
Internet
    ↓
[Ingress Controller] (TLS termination, rate limiting)
    ↓
    ├─→ [Frontend Service] → [Frontend Pods]
    │                              ↓
    └─→ [Backend Service] → [Backend Pods]
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
            [PostgreSQL Service]          [Redis Service]
                    ↓                             ↓
            [PostgreSQL Pod]              [Redis Pod]
```

### Security Layers

1. **Network Policies**: Restrict pod-to-pod communication
2. **RBAC**: Role-based access control (to be configured)
3. **Pod Security**: Non-root users, read-only filesystems
4. **Secrets Management**: Kubernetes secrets (consider external vault)
5. **TLS**: End-to-end encryption
6. **Resource Limits**: Prevent resource exhaustion

## Deployment Methods

### Method 1: Using deploy.sh Script (Recommended)

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

This script:
- Checks prerequisites
- Validates secrets
- Deploys all components in order
- Waits for readiness
- Verifies deployment

### Method 2: Using kubectl

```bash
# Deploy in order
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f configmap-backend.yaml
kubectl apply -f configmap-frontend.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f redis-statefulset.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa-backend.yaml
kubectl apply -f hpa-frontend.yaml
kubectl apply -f pdb-backend.yaml
kubectl apply -f pdb-frontend.yaml
kubectl apply -f networkpolicy.yaml
kubectl apply -f resourcequota.yaml
```

### Method 3: Using Kustomize

```bash
# Deploy base configuration
kubectl apply -k .

# Deploy staging environment
kubectl apply -k overlays/staging/

# Deploy production environment
kubectl apply -k overlays/production/
```

## Environment-Specific Deployments

### Staging Environment

```bash
kubectl apply -k overlays/staging/
```

Staging configuration:
- 2 replicas per service
- Lower resource limits
- Debug logging enabled
- Separate domain: staging.passwordmanager.example.com

### Production Environment

```bash
kubectl apply -k overlays/production/
```

Production configuration:
- 5 replicas per service (scales to 20)
- Higher resource limits
- Warn-level logging
- Production domain: passwordmanager.example.com
- Stricter PDB (min 3 available)

## Configuration Management

### Secrets

**CRITICAL**: Update all secrets before deployment!

```bash
# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Update secret.yaml with generated values
# Or create secret directly:
kubectl create secret generic password-manager-secrets \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  --from-literal=POSTGRES_DB=password_manager \
  --from-literal=REDIS_PASSWORD=$REDIS_PASSWORD \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  -n password-manager
```

### ConfigMaps

Update domain names in:
- `configmap-backend.yaml`: CORS_ALLOWED_ORIGINS
- `configmap-frontend.yaml`: NEXT_PUBLIC_API_URL
- `ingress.yaml`: host rules

### TLS Certificates

**Option A: cert-manager (Recommended)**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@passwordmanager.example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

**Option B: Manual Certificates**

```bash
kubectl create secret tls password-manager-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n password-manager
```

## Monitoring and Observability

### Prometheus Integration

If Prometheus Operator is installed:

```bash
kubectl apply -f servicemonitor.yaml
```

Access metrics:
- Backend: `http://backend-service:8080/actuator/prometheus`
- Grafana dashboards: Import Spring Boot dashboard

### Logging

View logs:
```bash
# Backend logs
kubectl logs -f deployment/backend -n password-manager

# Frontend logs
kubectl logs -f deployment/frontend -n password-manager

# All pods
kubectl logs -f -l app=password-manager -n password-manager
```

### Health Checks

```bash
# Backend health
kubectl exec -it deployment/backend -n password-manager -- \
  curl http://localhost:8080/actuator/health

# Frontend health
kubectl exec -it deployment/frontend -n password-manager -- \
  curl http://localhost:3000
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n password-manager

# Scale frontend
kubectl scale deployment frontend --replicas=5 -n password-manager
```

### Auto-scaling

HPA automatically scales based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

View HPA status:
```bash
kubectl get hpa -n password-manager
kubectl describe hpa backend-hpa -n password-manager
```

## Backup and Restore

### Automated Backups

Deploy backup CronJob:
```bash
kubectl apply -f backup-cronjob.yaml
```

Backups run daily at 2 AM and are stored for 7 days.

### Manual Backup

```bash
# Create backup
kubectl exec -it postgres-0 -n password-manager -- \
  pg_dump -U postgres password_manager > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql
```

### Restore

```bash
# Restore from backup
kubectl exec -i postgres-0 -n password-manager -- \
  psql -U postgres password_manager < backup.sql
```

## Updates and Rollouts

### Update Container Images

```bash
# Update backend
kubectl set image deployment/backend \
  backend=ghcr.io/your-username/password-manager-backend:v1.1.0 \
  -n password-manager

# Update frontend
kubectl set image deployment/frontend \
  frontend=ghcr.io/your-username/password-manager-frontend:v1.1.0 \
  -n password-manager
```

### Monitor Rollout

```bash
kubectl rollout status deployment/backend -n password-manager
kubectl rollout status deployment/frontend -n password-manager
```

### Rollback

Use the rollback script:
```bash
chmod +x rollback.sh
./rollback.sh
```

Or manually:
```bash
kubectl rollout undo deployment/backend -n password-manager
kubectl rollout undo deployment/frontend -n password-manager
```

## Troubleshooting

### Common Issues

**1. Pods Not Starting**
```bash
# Check pod status
kubectl get pods -n password-manager

# Describe pod
kubectl describe pod <pod-name> -n password-manager

# Check logs
kubectl logs <pod-name> -n password-manager
```

**2. Database Connection Errors**
```bash
# Verify PostgreSQL is running
kubectl get pods -l component=postgres -n password-manager

# Test connection
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres -d password_manager -c "SELECT 1"

# Check backend can reach database
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv postgres-service 5432
```

**3. Ingress Not Working**
```bash
# Check ingress status
kubectl describe ingress -n password-manager

# Verify ingress controller
kubectl get pods -n ingress-nginx

# Check TLS secret
kubectl get secret password-manager-tls -n password-manager
```

**4. High Resource Usage**
```bash
# Check resource usage
kubectl top pods -n password-manager
kubectl top nodes

# Check HPA status
kubectl get hpa -n password-manager

# Adjust resource limits if needed
kubectl edit deployment backend -n password-manager
```

### Debug Commands

```bash
# Get all resources
kubectl get all -n password-manager

# Get events
kubectl get events -n password-manager --sort-by='.lastTimestamp'

# Execute shell in pod
kubectl exec -it <pod-name> -n password-manager -- /bin/sh

# Port forward for local testing
kubectl port-forward svc/backend-service 8080:8080 -n password-manager
kubectl port-forward svc/frontend-service 3000:3000 -n password-manager
```

## Security Hardening

### 1. Use External Secrets Management

Consider using:
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager

### 2. Enable Pod Security Standards

```bash
kubectl label namespace password-manager \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### 3. Configure RBAC

Create service accounts with minimal permissions:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: password-manager-backend
  namespace: password-manager
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: password-manager-backend
  namespace: password-manager
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
```

### 4. Enable Audit Logging

Configure Kubernetes audit logging to track all API calls.

### 5. Regular Security Scans

```bash
# Scan images for vulnerabilities
trivy image ghcr.io/your-username/password-manager-backend:latest
trivy image ghcr.io/your-username/password-manager-frontend:latest

# Scan Kubernetes manifests
kubesec scan k8s/*.yaml
```

## Performance Optimization

### 1. Resource Tuning

Monitor and adjust:
- CPU/Memory requests and limits
- HPA thresholds
- Database connection pool sizes
- Redis memory limits

### 2. Database Optimization

```bash
# Check slow queries
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres -d password_manager -c \
  "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

### 3. Caching Strategy

- Redis for session storage
- Application-level caching
- CDN for static assets

## Disaster Recovery

### 1. Backup Strategy

- Automated daily backups
- Off-site backup storage
- Regular restore testing

### 2. High Availability

- Multi-zone deployment
- Database replication
- Redis sentinel/cluster

### 3. Recovery Procedures

Document and test:
- Database restore
- Application rollback
- Disaster recovery runbook

## Production Checklist

- [ ] Secrets updated with secure values
- [ ] Domain names configured
- [ ] TLS certificates configured
- [ ] Container images tagged with versions
- [ ] Resource limits appropriate
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested
- [ ] Security policies applied
- [ ] Load testing completed
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Team trained on operations

## Support and Maintenance

### Regular Tasks

- Monitor resource usage
- Review logs for errors
- Check backup success
- Update dependencies
- Security patches
- Performance tuning

### Maintenance Windows

Schedule regular maintenance for:
- Kubernetes upgrades
- Database maintenance
- Certificate renewal
- Security updates

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Kustomize Documentation](https://kustomize.io/)
