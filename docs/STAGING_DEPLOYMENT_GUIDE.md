# Staging Deployment Guide

This guide provides step-by-step instructions for deploying the Password Manager application to the staging environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Smoke Tests](#smoke-tests)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

Ensure the following tools are installed:

- **Terraform** (v1.5+): Infrastructure as Code
- **kubectl** (v1.24+): Kubernetes CLI
- **AWS CLI** (v2.0+): AWS command-line interface
- **Docker** (v20.10+): Container runtime
- **jq**: JSON processor for scripts
- **curl**: HTTP client for testing

### AWS Configuration

```bash
# Configure AWS credentials
aws configure

# Verify configuration
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

### Access Requirements

- AWS account with appropriate IAM permissions
- Access to GitHub Container Registry (GHCR)
- SSH access to bastion host (if applicable)
- VPN connection to private network (if applicable)

## Pre-Deployment Checklist

### 1. Code Preparation

- [ ] All code changes merged to `develop` branch
- [ ] All tests passing in CI/CD pipeline
- [ ] Code review completed and approved
- [ ] Version number updated (if applicable)

### 2. Configuration Review

- [ ] Review `terraform/environments/staging.tfvars`
- [ ] Verify domain names in configuration files
- [ ] Check resource limits and scaling parameters
- [ ] Verify database backup retention settings

### 3. Secrets Management

- [ ] Database passwords generated and stored securely
- [ ] Redis auth tokens generated
- [ ] JWT secrets generated
- [ ] TLS certificates obtained or cert-manager configured

### 4. Infrastructure Validation

```bash
cd terraform
terraform validate
terraform fmt -check -recursive
```

### 5. Docker Images

- [ ] Backend image built and pushed to registry
- [ ] Frontend image built and pushed to registry
- [ ] Images tagged with appropriate version

```bash
# Build and push images
cd scripts
./build-images.sh staging
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

Use the automated deployment script:

```bash
cd scripts
chmod +x deploy-staging.sh
./deploy-staging.sh
```

The script will guide you through:
1. Terraform infrastructure deployment
2. Kubernetes cluster configuration
3. Database migrations
4. Application deployment
5. Monitoring setup
6. Smoke tests
7. Verification

### Option 2: Manual Deployment

#### Step 1: Apply Terraform Configuration

```bash
cd terraform

# Initialize Terraform (if not already done)
terraform init

# Plan infrastructure changes
terraform plan -var-file="environments/staging.tfvars" -out=tfplan

# Review the plan carefully
# Look for:
# - Resources to be created/modified/destroyed
# - Any unexpected changes
# - Cost implications

# Apply the plan
terraform apply tfplan

# Save outputs
terraform output > outputs.txt
terraform output -json > outputs.json
```

**Expected Duration:** 20-30 minutes (EKS cluster creation is the longest step)

#### Step 2: Configure kubectl

```bash
# Get cluster name from Terraform outputs
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
AWS_REGION=$(terraform output -raw aws_region)

# Update kubeconfig
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

# Verify connection
kubectl cluster-info
kubectl get nodes

# Expected output: 3+ nodes in Ready state
```

#### Step 3: Run Database Migrations

```bash
# Get database credentials from Terraform outputs
DB_ENDPOINT=$(terraform output -raw postgresql_endpoint)
DB_NAME=$(terraform output -raw postgresql_database_name)
DB_USER=$(terraform output -raw postgresql_master_username)
DB_PASSWORD=$(terraform output -raw postgresql_master_password)

# Run migrations using backend container
docker run --rm \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_ENDPOINT/$DB_NAME" \
  -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
  -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
  -e SPRING_FLYWAY_ENABLED=true \
  ghcr.io/your-org/password-manager-backend:staging \
  java -jar app.jar --spring.flyway.migrate

# Verify migrations
# Connect to database and check flyway_schema_history table
```

#### Step 4: Deploy to Kubernetes

```bash
cd ../k8s

# Update secrets (if not using external secrets manager)
kubectl create secret generic password-manager-secrets \
  --from-literal=POSTGRES_USER=$DB_USER \
  --from-literal=POSTGRES_PASSWORD=$DB_PASSWORD \
  --from-literal=POSTGRES_DB=$DB_NAME \
  --from-literal=REDIS_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=JWT_SECRET=$(openssl rand -base64 64) \
  -n password-manager \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy using Kustomize
kubectl apply -k overlays/staging/

# Wait for deployments to be ready
kubectl wait --for=condition=available deployment/backend -n password-manager --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n password-manager --timeout=300s

# Check deployment status
kubectl get pods -n password-manager
kubectl get svc -n password-manager
kubectl get ingress -n password-manager
```

**Expected Duration:** 5-10 minutes

#### Step 5: Configure Monitoring and Logging

```bash
# Deploy ServiceMonitor (if Prometheus Operator is installed)
kubectl apply -f servicemonitor.yaml

# Get Grafana credentials
cd ../terraform
GRAFANA_PASSWORD=$(terraform output -raw grafana_admin_password)

echo "Grafana admin password: $GRAFANA_PASSWORD"
echo "Access Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"

# Verify monitoring stack
kubectl get pods -n monitoring
```

#### Step 6: Run Smoke Tests

```bash
cd ../scripts
chmod +x smoke-tests.sh

# Get application URL
APP_URL=$(cd ../terraform && terraform output -raw cloudfront_domain_name)

# Run smoke tests
./smoke-tests.sh staging "https://$APP_URL"
```

**Expected Result:** All tests should pass

#### Step 7: Verify Deployment

```bash
chmod +x verify-deployment.sh
./verify-deployment.sh password-manager staging
```

**Expected Result:** All verification checks should pass

## Post-Deployment Verification

### 1. Application Health

```bash
# Check backend health
curl https://staging.passwordmanager.example.com/api/v1/health

# Expected response:
# {"status":"UP"}

# Check actuator health
curl https://staging.passwordmanager.example.com/actuator/health

# Expected response includes:
# - status: UP
# - db: UP
# - redis: UP
```

### 2. Frontend Accessibility

```bash
# Check frontend
curl -I https://staging.passwordmanager.example.com/

# Expected: HTTP 200 OK
```

### 3. Database Connectivity

```bash
# From backend pod
kubectl exec -it deployment/backend -n password-manager -- \
  curl -s http://localhost:8080/actuator/health | jq '.components.db'

# Expected: {"status":"UP"}
```

### 4. Redis Connectivity

```bash
# From backend pod
kubectl exec -it deployment/backend -n password-manager -- \
  curl -s http://localhost:8080/actuator/health | jq '.components.redis'

# Expected: {"status":"UP"}
```

### 5. Monitoring Dashboards

```bash
# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser to http://localhost:3000
# Login with admin / <GRAFANA_PASSWORD>
# Verify dashboards are showing data
```

### 6. Log Aggregation

```bash
# Check application logs
kubectl logs -f deployment/backend -n password-manager --tail=100
kubectl logs -f deployment/frontend -n password-manager --tail=100

# Look for:
# - No error messages
# - Successful startup messages
# - Database connection established
# - Redis connection established
```

## Smoke Tests

### Automated Smoke Tests

Run the comprehensive smoke test suite:

```bash
cd scripts
./smoke-tests.sh staging
```

### Manual Smoke Tests

#### Test 1: User Registration

```bash
curl -X POST https://staging.passwordmanager.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "authKeyHash": "test-hash",
    "salt": "test-salt",
    "iterations": 100000
  }'

# Expected: 201 Created with recovery key
```

#### Test 2: User Login

```bash
curl -X POST https://staging.passwordmanager.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "authKeyHash": "test-hash"
  }'

# Expected: 200 OK with JWT token
```

#### Test 3: Vault Operations

```bash
# Get JWT token from login response
TOKEN="<jwt-token>"

# Create credential
curl -X POST https://staging.passwordmanager.example.com/api/v1/vault/credential \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedData": "encrypted-data",
    "iv": "initialization-vector",
    "authTag": "auth-tag"
  }'

# Expected: 201 Created with credential ID
```

#### Test 4: Security Features

```bash
# Test rate limiting
for i in {1..30}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://staging.passwordmanager.example.com/api/v1/health
done

# Expected: Some requests return 429 (Too Many Requests)
```

### Feature Verification Checklist

- [ ] User registration works
- [ ] User login works
- [ ] 2FA setup works
- [ ] Password generation works
- [ ] Credential CRUD operations work
- [ ] Search functionality works
- [ ] Folder and tag management works
- [ ] Import/export works
- [ ] Sharing works
- [ ] Security dashboard works
- [ ] Audit logs work
- [ ] Offline mode works (PWA)
- [ ] Sync works across devices

## Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod status
kubectl get pods -n password-manager

# Describe pod
kubectl describe pod <pod-name> -n password-manager

# Check logs
kubectl logs <pod-name> -n password-manager

# Common causes:
# - Image pull errors (check image name and registry access)
# - Resource limits too low
# - Missing secrets or configmaps
# - Database connection issues
```

### Issue: Database Connection Errors

```bash
# Check database endpoint
cd terraform
terraform output postgresql_endpoint

# Test connection from backend pod
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv <db-endpoint> 5432

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Verify database is running
aws rds describe-db-instances --db-instance-identifier password-manager-staging
```

### Issue: Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress -n password-manager

# Check ingress controller
kubectl get pods -n ingress-nginx

# Check TLS secret
kubectl get secret password-manager-tls -n password-manager

# Verify DNS
dig staging.passwordmanager.example.com
nslookup staging.passwordmanager.example.com
```

### Issue: High Resource Usage

```bash
# Check resource usage
kubectl top pods -n password-manager
kubectl top nodes

# Check HPA status
kubectl get hpa -n password-manager

# Adjust resource limits if needed
kubectl edit deployment backend -n password-manager
```

### Issue: Smoke Tests Failing

```bash
# Check application logs
kubectl logs -f deployment/backend -n password-manager
kubectl logs -f deployment/frontend -n password-manager

# Check health endpoints
curl -v https://staging.passwordmanager.example.com/api/v1/health
curl -v https://staging.passwordmanager.example.com/actuator/health

# Check recent events
kubectl get events -n password-manager --sort-by='.lastTimestamp'
```

## Rollback Procedures

### Rollback Kubernetes Deployment

```bash
cd k8s

# Use rollback script
chmod +x rollback.sh
./rollback.sh

# Or manually
kubectl rollout undo deployment/backend -n password-manager
kubectl rollout undo deployment/frontend -n password-manager

# Verify rollback
kubectl rollout status deployment/backend -n password-manager
kubectl rollout status deployment/frontend -n password-manager
```

### Rollback Terraform Changes

```bash
cd terraform

# Revert to previous state
terraform state pull > backup.tfstate

# Or destroy and recreate
terraform destroy -var-file="environments/staging.tfvars"
terraform apply -var-file="environments/staging.tfvars"
```

### Rollback Database Migrations

```bash
# Connect to database
kubectl exec -it postgres-0 -n password-manager -- psql -U postgres -d password_manager

# Check migration history
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;

# Manually revert migrations if needed
# (Flyway doesn't support automatic rollback)
```

## Post-Deployment Tasks

### 1. Update Documentation

- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Update runbook with new procedures

### 2. Notify Team

- [ ] Send deployment notification to team
- [ ] Update status page
- [ ] Schedule post-deployment review

### 3. Monitor Application

- [ ] Monitor error rates for 24 hours
- [ ] Check performance metrics
- [ ] Review audit logs
- [ ] Monitor resource usage

### 4. Schedule Follow-up

- [ ] Schedule production deployment
- [ ] Plan for any necessary hotfixes
- [ ] Review and update deployment procedures

## Additional Resources

- [Terraform Deployment Guide](../terraform/DEPLOYMENT_GUIDE.md)
- [Kubernetes Deployment Documentation](../k8s/DEPLOYMENT.md)
- [CI/CD Pipeline Documentation](CICD_PIPELINE.md)
- [Troubleshooting Guide](../CICD_TROUBLESHOOTING.md)

## Support

For deployment issues:
1. Check this guide
2. Review application logs
3. Check monitoring dashboards
4. Contact DevOps team
5. Escalate to on-call engineer if critical

## Deployment Checklist

Use this checklist for each staging deployment:

- [ ] Pre-deployment checklist completed
- [ ] Terraform configuration applied
- [ ] kubectl configured
- [ ] Database migrations run
- [ ] Application deployed to Kubernetes
- [ ] Monitoring and logging configured
- [ ] Smoke tests passed
- [ ] Deployment verification passed
- [ ] All features verified
- [ ] Team notified
- [ ] Documentation updated
- [ ] Monitoring in place

---

**Last Updated:** 2024-01-XX  
**Version:** 1.0  
**Maintained By:** DevOps Team
