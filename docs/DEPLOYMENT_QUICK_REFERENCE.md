# Staging Deployment - Quick Reference Card

## Prerequisites Check

```bash
# Verify tools are installed
terraform --version  # v1.5+
kubectl version      # v1.24+
aws --version        # v2.0+
docker --version     # v20.10+
jq --version         # Latest

# Verify AWS access
aws sts get-caller-identity

# Verify kubectl access
kubectl cluster-info
```

## Quick Deployment (5 Commands)

```bash
# 1. Navigate to scripts
cd scripts

# 2. Make scripts executable
chmod +x *.sh

# 3. Deploy to staging (automated)
./deploy-staging.sh
# Select option 8 (All of the above)

# 4. Verify deployment
./verify-deployment.sh password-manager staging

# 5. Run smoke tests
./smoke-tests.sh staging
```

## Manual Deployment Steps

### Step 1: Terraform (20-30 min)
```bash
cd terraform
terraform init
terraform plan -var-file="environments/staging.tfvars" -out=tfplan
terraform apply tfplan
terraform output > outputs.txt
```

### Step 2: Configure kubectl (1 min)
```bash
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
aws eks update-kubeconfig --region us-east-1 --name $CLUSTER_NAME
kubectl get nodes
```

### Step 3: Database Migrations (2-5 min)
```bash
DB_ENDPOINT=$(terraform output -raw postgresql_endpoint)
DB_NAME=$(terraform output -raw postgresql_database_name)
DB_USER=$(terraform output -raw postgresql_master_username)
DB_PASSWORD=$(terraform output -raw postgresql_master_password)

docker run --rm \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_ENDPOINT/$DB_NAME" \
  -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
  -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
  -e SPRING_FLYWAY_ENABLED=true \
  ghcr.io/your-org/password-manager-backend:staging \
  java -jar app.jar --spring.flyway.migrate
```

### Step 4: Deploy to Kubernetes (5-10 min)
```bash
cd ../k8s
kubectl apply -k overlays/staging/
kubectl wait --for=condition=available deployment/backend -n password-manager --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n password-manager --timeout=300s
```

### Step 5: Verify (2 min)
```bash
cd ../scripts
./verify-deployment.sh password-manager staging
./smoke-tests.sh staging
```

## Common Commands

### Check Status
```bash
# Pods
kubectl get pods -n password-manager

# Services
kubectl get svc -n password-manager

# Ingress
kubectl get ingress -n password-manager

# HPA
kubectl get hpa -n password-manager

# Resource usage
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

# Recent events
kubectl get events -n password-manager --sort-by='.lastTimestamp'
```

### Test Endpoints
```bash
APP_URL="staging.passwordmanager.example.com"

# Health check
curl https://$APP_URL/api/v1/health

# Actuator health
curl https://$APP_URL/actuator/health

# Frontend
curl -I https://$APP_URL/
```

### Scale Manually
```bash
# Scale up
kubectl scale deployment backend --replicas=5 -n password-manager
kubectl scale deployment frontend --replicas=5 -n password-manager

# Scale down
kubectl scale deployment backend --replicas=2 -n password-manager
kubectl scale deployment frontend --replicas=2 -n password-manager
```

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n password-manager
kubectl logs <pod-name> -n password-manager
```

### Database Connection Issues
```bash
# Test from backend pod
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv <db-endpoint> 5432

# Check health
kubectl exec -it deployment/backend -n password-manager -- \
  curl http://localhost:8080/actuator/health
```

### Ingress Not Working
```bash
kubectl describe ingress -n password-manager
kubectl get secret password-manager-tls -n password-manager
dig staging.passwordmanager.example.com
```

## Rollback

### Kubernetes Rollback
```bash
cd k8s
./rollback.sh

# Or manually
kubectl rollout undo deployment/backend -n password-manager
kubectl rollout undo deployment/frontend -n password-manager
```

### Terraform Rollback
```bash
cd terraform
terraform destroy -var-file="environments/staging.tfvars"
# Then reapply previous version
```

## Monitoring

### Access Grafana
```bash
# Get password
cd terraform
GRAFANA_PASSWORD=$(terraform output -raw grafana_admin_password)
echo $GRAFANA_PASSWORD

# Port forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser to http://localhost:3000
# Login: admin / <GRAFANA_PASSWORD>
```

### Access Prometheus
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open browser to http://localhost:9090
```

## Smoke Tests

### Run All Tests
```bash
cd scripts
./smoke-tests.sh staging
```

### Individual Tests
```bash
# Frontend
curl -I https://staging.passwordmanager.example.com/

# Backend health
curl https://staging.passwordmanager.example.com/api/v1/health

# Actuator
curl https://staging.passwordmanager.example.com/actuator/health

# Registration endpoint
curl -X POST https://staging.passwordmanager.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" -d '{}'

# Login endpoint
curl -X POST https://staging.passwordmanager.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{}'
```

## Emergency Contacts

- **DevOps Team:** devops@example.com
- **On-Call Engineer:** oncall@example.com
- **Slack Channel:** #password-manager-ops

## Important URLs

- **Staging App:** https://staging.passwordmanager.example.com
- **Staging API:** https://staging.passwordmanager.example.com/api/v1
- **Swagger UI:** https://staging.passwordmanager.example.com/swagger-ui.html
- **Grafana:** Port forward to localhost:3000
- **Prometheus:** Port forward to localhost:9090

## Deployment Checklist

- [ ] Prerequisites verified
- [ ] Terraform applied
- [ ] kubectl configured
- [ ] Database migrations run
- [ ] Application deployed
- [ ] Monitoring configured
- [ ] Smoke tests passed
- [ ] Verification passed
- [ ] Team notified
- [ ] Documentation updated

---

**Keep this card handy during deployments!**
