# Kubernetes Quick Start Guide

## Prerequisites Checklist

- [ ] Kubernetes cluster (v1.24+) with 3+ nodes
- [ ] kubectl installed and configured
- [ ] NGINX Ingress Controller installed
- [ ] Metrics Server installed (for auto-scaling)
- [ ] Domain name configured
- [ ] TLS certificates ready (or cert-manager installed)

## 5-Minute Deployment

### Step 1: Update Configuration (2 minutes)

```bash
cd k8s

# 1. Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "REDIS_PASSWORD: $REDIS_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"

# 2. Update secret.yaml with these values
# Replace all CHANGE_ME_* placeholders

# 3. Update domain names in:
# - configmap-backend.yaml (CORS_ALLOWED_ORIGINS)
# - configmap-frontend.yaml (NEXT_PUBLIC_API_URL)
# - ingress.yaml (host rules)

# 4. Update container images in:
# - backend-deployment.yaml
# - frontend-deployment.yaml
```

### Step 2: Deploy (3 minutes)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run automated deployment
./deploy.sh

# The script will:
# ✓ Check prerequisites
# ✓ Create namespace
# ✓ Deploy secrets and configs
# ✓ Deploy databases (PostgreSQL, Redis)
# ✓ Deploy backend and frontend
# ✓ Configure ingress
# ✓ Set up auto-scaling
# ✓ Apply security policies
```

### Step 3: Verify

```bash
# Check all pods are running
kubectl get pods -n password-manager

# Check services
kubectl get svc -n password-manager

# Check ingress
kubectl get ingress -n password-manager

# Test health endpoints
curl https://api.passwordmanager.example.com/actuator/health
curl https://passwordmanager.example.com
```

## Common Commands

### View Status
```bash
kubectl get all -n password-manager
kubectl get hpa -n password-manager
kubectl top pods -n password-manager
```

### View Logs
```bash
# Backend
kubectl logs -f deployment/backend -n password-manager

# Frontend
kubectl logs -f deployment/frontend -n password-manager

# All pods
kubectl logs -f -l app=password-manager -n password-manager
```

### Scale Manually
```bash
kubectl scale deployment backend --replicas=5 -n password-manager
kubectl scale deployment frontend --replicas=5 -n password-manager
```

### Update Images
```bash
kubectl set image deployment/backend \
  backend=ghcr.io/your-username/password-manager-backend:v1.1.0 \
  -n password-manager

kubectl set image deployment/frontend \
  frontend=ghcr.io/your-username/password-manager-frontend:v1.1.0 \
  -n password-manager
```

### Rollback
```bash
chmod +x rollback.sh
./rollback.sh
```

### Backup Database
```bash
kubectl exec -it postgres-0 -n password-manager -- \
  pg_dump -U postgres password_manager > backup.sql
```

### Delete Everything
```bash
kubectl delete namespace password-manager
```

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n password-manager
kubectl logs <pod-name> -n password-manager
```

### Database Connection Issues
```bash
# Check PostgreSQL
kubectl get pods -l component=postgres -n password-manager
kubectl logs postgres-0 -n password-manager

# Test connection from backend
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv postgres-service 5432
```

### Ingress Not Working
```bash
kubectl describe ingress -n password-manager
kubectl get secret password-manager-tls -n password-manager
```

## Environment-Specific Deployments

### Staging
```bash
kubectl apply -k overlays/staging/
```

### Production
```bash
kubectl apply -k overlays/production/
```

## Need More Help?

- **Quick Start**: This file
- **Detailed Guide**: README.md
- **Full Documentation**: DEPLOYMENT.md
- **Summary**: KUBERNETES_MANIFESTS_SUMMARY.md

## Support

For issues:
1. Check logs: `kubectl logs -f <pod-name> -n password-manager`
2. Check events: `kubectl get events -n password-manager`
3. Review documentation in README.md and DEPLOYMENT.md
