# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Password Manager application to a Kubernetes cluster.

## Architecture Overview

The deployment consists of:
- **Frontend**: Next.js PWA (3 replicas, auto-scaling)
- **Backend**: Spring Boot API (3 replicas, auto-scaling)
- **PostgreSQL**: Database (StatefulSet with persistent storage)
- **Redis**: Session and cache store (StatefulSet with persistent storage)
- **Ingress**: NGINX Ingress Controller with TLS termination

## Prerequisites

1. **Kubernetes Cluster** (v1.24+)
   - Managed Kubernetes (GKE, EKS, AKS) or self-hosted
   - Minimum 3 nodes with 4 CPU and 8GB RAM each

2. **kubectl** configured to access your cluster
   ```bash
   kubectl version --client
   kubectl cluster-info
   ```

3. **NGINX Ingress Controller** installed
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   ```

4. **cert-manager** (optional, for automatic TLS certificates)
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

5. **Metrics Server** (for HPA)
   ```bash
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
   ```

6. **Prometheus Operator** (optional, for monitoring)
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
   ```

## Pre-Deployment Configuration

### 1. Update Secrets

**CRITICAL**: Update `secret.yaml` with secure values before deployment:

```bash
# Generate secure passwords
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
openssl rand -base64 64  # For JWT_SECRET (must be at least 32 characters)
```

Edit `k8s/secret.yaml` and replace all `CHANGE_ME_*` values.

### 2. Update ConfigMaps

Edit `k8s/configmap-backend.yaml` and `k8s/configmap-frontend.yaml`:
- Replace `passwordmanager.example.com` with your actual domain
- Update `CORS_ALLOWED_ORIGINS` with your frontend URL
- Adjust resource limits if needed

### 3. Update Ingress

Edit `k8s/ingress.yaml`:
- Replace `passwordmanager.example.com` with your domain
- Replace `api.passwordmanager.example.com` with your API domain
- Update TLS certificate configuration

### 4. Create TLS Certificates

**Option A: Using cert-manager (recommended)**
```bash
# Create ClusterIssuer for Let's Encrypt
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

**Option B: Using existing certificates**
```bash
kubectl create secret tls password-manager-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n password-manager
```

### 5. Update Container Images

Edit deployment files to use your container registry:
- `k8s/backend-deployment.yaml`: Update `image: ghcr.io/your-username/password-manager-backend:latest`
- `k8s/frontend-deployment.yaml`: Update `image: ghcr.io/your-username/password-manager-frontend:latest`

## Deployment Steps

### Step 1: Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### Step 2: Create Secrets and ConfigMaps
```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap-backend.yaml
kubectl apply -f k8s/configmap-frontend.yaml
```

### Step 3: Deploy Database and Cache
```bash
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l component=postgres -n password-manager --timeout=300s
kubectl wait --for=condition=ready pod -l component=redis -n password-manager --timeout=300s
```

### Step 4: Deploy Backend
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Wait for backend to be ready
kubectl wait --for=condition=available deployment/backend -n password-manager --timeout=300s
```

### Step 5: Deploy Frontend
```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=available deployment/frontend -n password-manager --timeout=300s
```

### Step 6: Deploy Ingress
```bash
kubectl apply -f k8s/ingress.yaml

# Get ingress IP/hostname
kubectl get ingress -n password-manager
```

### Step 7: Deploy Auto-scaling and Disruption Budgets
```bash
kubectl apply -f k8s/hpa-backend.yaml
kubectl apply -f k8s/hpa-frontend.yaml
kubectl apply -f k8s/pdb-backend.yaml
kubectl apply -f k8s/pdb-frontend.yaml
```

### Step 8: Deploy Network Policies and Resource Quotas
```bash
kubectl apply -f k8s/networkpolicy.yaml
kubectl apply -f k8s/resourcequota.yaml
```

### Step 9: Deploy Monitoring (Optional)
```bash
kubectl apply -f k8s/servicemonitor.yaml
```

## Quick Deployment Script

Use the provided script for automated deployment:

```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

## Verification

### Check All Resources
```bash
kubectl get all -n password-manager
```

### Check Pod Status
```bash
kubectl get pods -n password-manager -w
```

### Check Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n password-manager

# Frontend logs
kubectl logs -f deployment/frontend -n password-manager

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n password-manager
```

### Check Ingress
```bash
kubectl describe ingress password-manager-ingress -n password-manager
```

### Test Health Endpoints
```bash
# Backend health
curl https://api.passwordmanager.example.com/actuator/health

# Frontend health
curl https://passwordmanager.example.com
```

## Scaling

### Manual Scaling
```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n password-manager

# Scale frontend
kubectl scale deployment frontend --replicas=5 -n password-manager
```

### Auto-scaling Status
```bash
kubectl get hpa -n password-manager
```

## Updates and Rollouts

### Update Container Image
```bash
# Update backend
kubectl set image deployment/backend backend=ghcr.io/your-username/password-manager-backend:v1.1.0 -n password-manager

# Update frontend
kubectl set image deployment/frontend frontend=ghcr.io/your-username/password-manager-frontend:v1.1.0 -n password-manager
```

### Check Rollout Status
```bash
kubectl rollout status deployment/backend -n password-manager
kubectl rollout status deployment/frontend -n password-manager
```

### Rollback
```bash
kubectl rollout undo deployment/backend -n password-manager
kubectl rollout undo deployment/frontend -n password-manager
```

## Backup and Restore

### Backup PostgreSQL
```bash
# Create backup
kubectl exec -it postgres-0 -n password-manager -- pg_dump -U postgres password_manager > backup.sql

# Or use a CronJob for automated backups
kubectl apply -f k8s/backup-cronjob.yaml
```

### Restore PostgreSQL
```bash
kubectl exec -i postgres-0 -n password-manager -- psql -U postgres password_manager < backup.sql
```

## Monitoring and Debugging

### View Metrics
```bash
# CPU and Memory usage
kubectl top pods -n password-manager
kubectl top nodes
```

### Debug Pod Issues
```bash
# Describe pod
kubectl describe pod <pod-name> -n password-manager

# Get events
kubectl get events -n password-manager --sort-by='.lastTimestamp'

# Execute commands in pod
kubectl exec -it <pod-name> -n password-manager -- /bin/sh
```

### Check Resource Quotas
```bash
kubectl describe resourcequota password-manager-quota -n password-manager
```

## Cleanup

### Delete All Resources
```bash
kubectl delete namespace password-manager
```

### Delete Specific Components
```bash
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/postgres-statefulset.yaml
kubectl delete -f k8s/redis-statefulset.yaml
```

## Troubleshooting

### Pods Not Starting
1. Check pod events: `kubectl describe pod <pod-name> -n password-manager`
2. Check logs: `kubectl logs <pod-name> -n password-manager`
3. Verify secrets and configmaps are created
4. Check resource quotas and limits

### Database Connection Issues
1. Verify PostgreSQL is running: `kubectl get pods -l component=postgres -n password-manager`
2. Check database credentials in secrets
3. Test connection from backend pod:
   ```bash
   kubectl exec -it <backend-pod> -n password-manager -- curl postgres-service:5432
   ```

### Ingress Not Working
1. Verify ingress controller is installed
2. Check ingress status: `kubectl describe ingress -n password-manager`
3. Verify DNS records point to ingress IP
4. Check TLS certificates: `kubectl get secret password-manager-tls -n password-manager`

### High Memory/CPU Usage
1. Check metrics: `kubectl top pods -n password-manager`
2. Review HPA status: `kubectl get hpa -n password-manager`
3. Adjust resource limits in deployment files
4. Scale manually if needed

## Security Best Practices

1. **Secrets Management**: Use external secret management (HashiCorp Vault, AWS Secrets Manager)
2. **Network Policies**: Ensure network policies are applied
3. **RBAC**: Configure proper Role-Based Access Control
4. **Pod Security**: Use Pod Security Standards/Policies
5. **Image Scanning**: Scan container images for vulnerabilities
6. **TLS**: Always use TLS for external communication
7. **Audit Logging**: Enable Kubernetes audit logging
8. **Regular Updates**: Keep Kubernetes and dependencies updated

## Production Checklist

- [ ] Secrets updated with secure values
- [ ] Domain names configured correctly
- [ ] TLS certificates configured
- [ ] Container images pushed to registry
- [ ] Resource limits appropriate for workload
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Security policies applied
- [ ] Load testing completed
- [ ] Rollback procedure tested

## Support

For issues or questions:
- Check logs: `kubectl logs -f <pod-name> -n password-manager`
- Review events: `kubectl get events -n password-manager`
- Consult main README.md for application-specific issues
