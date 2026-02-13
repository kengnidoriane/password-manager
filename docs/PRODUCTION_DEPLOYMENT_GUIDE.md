# Production Deployment Guide
## Password Manager Application

**Version:** 1.0.0  
**Last Updated:** February 12, 2026  
**Environment:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Strategy](#deployment-strategy)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)
9. [Launch Announcement](#launch-announcement)

---

## Overview

This guide provides comprehensive instructions for deploying the Password Manager application to production. The deployment uses a blue-green strategy to minimize downtime and enable quick rollback if issues arise.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   CDN   │ (CloudFront)
                    │ (Static)│
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ Ingress │ (ALB + TLS)
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Frontend │     │ Backend │     │  API    │
   │  Pods   │     │  Pods   │     │Gateway  │
   └─────────┘     └────┬────┘     └─────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │PostgreSQL│    │  Redis  │    │  S3     │
   │   RDS    │    │ElastiCache   │Backups  │
   └──────────┘    └─────────┘    └─────────┘
```

### Deployment Components

- **Infrastructure:** AWS (EKS, RDS, ElastiCache, S3, CloudFront)
- **Orchestration:** Kubernetes with Kustomize
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack
- **Error Tracking:** Sentry

---

## Pre-Deployment Checklist

### 1. Prerequisites

Ensure all required tools are installed:

- [ ] Terraform v1.5+
- [ ] kubectl v1.24+
- [ ] AWS CLI v2.0+
- [ ] Docker v20.10+
- [ ] jq (for JSON parsing)

Verify installations:
```bash
terraform --version
kubectl version --client
aws --version
docker --version
jq --version
```

### 2. AWS Configuration

- [ ] AWS credentials configured (`aws configure`)
- [ ] Correct AWS account selected
- [ ] IAM permissions verified (EKS, RDS, S3, CloudFront, Route53)
- [ ] AWS region set to `us-east-1` (or your target region)

Verify:
```bash
aws sts get-caller-identity
aws configure get region
```

### 3. Code and Tests

- [ ] All tests passing (frontend + backend)
- [ ] Code quality checks passed (ESLint, Checkstyle)
- [ ] Security scans completed (OWASP, npm audit)
- [ ] Performance tests passed
- [ ] Browser compatibility verified
- [ ] Accessibility tests passed

Run final test suite:
```bash
# Frontend
cd frontend
npm test
npm run lint

# Backend
cd backend
mvn clean test
mvn checkstyle:check
```

### 4. Configuration

- [ ] Production environment variables configured
- [ ] Secrets generated and stored securely
- [ ] Domain names configured (DNS records)
- [ ] SSL/TLS certificates ready
- [ ] Database credentials secured
- [ ] API keys and tokens configured

### 5. Infrastructure

- [ ] Terraform configuration reviewed
- [ ] Production tfvars file updated
- [ ] Resource quotas appropriate
- [ ] Auto-scaling configured
- [ ] Backup strategy in place

### 6. Monitoring and Alerting

- [ ] Prometheus configured
- [ ] Grafana dashboards created
- [ ] Alert rules defined
- [ ] Alert channels configured (email, Slack)
- [ ] Sentry error tracking configured

### 7. Documentation

- [ ] API documentation complete (Swagger)
- [ ] User documentation ready
- [ ] Deployment runbook reviewed
- [ ] Rollback procedures documented
- [ ] Support contacts updated

### 8. Team Readiness

- [ ] Deployment team briefed
- [ ] Support team on standby
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled
- [ ] Communication plan ready

---

## Deployment Strategy

### Blue-Green Deployment

We use a blue-green deployment strategy to minimize downtime and enable quick rollback:

1. **Blue (Current):** Existing production environment
2. **Green (New):** New version deployed alongside blue
3. **Switch:** Traffic gradually shifted from blue to green
4. **Verify:** Monitor green environment for issues
5. **Decommission:** Remove blue environment if green is stable

### Deployment Phases

```
Phase 1: Infrastructure (Terraform)
  ├─ VPC and Networking
  ├─ EKS Cluster
  ├─ RDS PostgreSQL
  ├─ ElastiCache Redis
  ├─ S3 Buckets
  └─ CloudFront CDN

Phase 2: Database Migrations
  └─ Flyway migrations

Phase 3: Backend Deployment
  ├─ Deploy new pods (green)
  ├─ Health checks
  └─ Switch traffic

Phase 4: Frontend Deployment
  ├─ Build static assets
  ├─ Upload to S3
  └─ Invalidate CDN cache

Phase 5: Verification
  ├─ Health checks
  ├─ Smoke tests
  └─ Monitoring

Phase 6: Monitoring
  └─ 24-48 hour observation period
```

---

## Step-by-Step Deployment

### Option 1: Automated Deployment (Recommended)

Use the automated deployment script:

```bash
# Linux/macOS
cd scripts
chmod +x deploy-production.sh
./deploy-production.sh --version v1.0.0

# Windows
cd scripts
deploy-production.bat --version v1.0.0
```

The script will:
1. Check prerequisites
2. Prompt for confirmation
3. Deploy infrastructure with Terraform
4. Run database migrations
5. Deploy backend with blue-green strategy
6. Deploy frontend to CDN
7. Verify health checks
8. Monitor for initial period
9. Generate deployment record

### Option 2: Manual Deployment

Follow these steps for manual deployment:

#### Step 1: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="environments/production.tfvars" -out=tfplan

# Apply the configuration
terraform apply tfplan

# Save outputs
terraform output -json > terraform-outputs.json

# Extract key outputs
export EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
export DB_ENDPOINT=$(terraform output -raw postgresql_endpoint)
export REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
export CDN_DOMAIN=$(terraform output -raw cdn_domain_name)

cd ..
```

**Expected Duration:** 20-30 minutes

#### Step 2: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name $EKS_CLUSTER_NAME

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

#### Step 3: Run Database Migrations

```bash
# Get database credentials
cd terraform
export DB_NAME=$(terraform output -raw postgresql_database_name)
export DB_USER=$(terraform output -raw postgresql_master_username)
export DB_PASSWORD=$(terraform output -raw postgresql_master_password)
cd ..

# Run Flyway migrations
docker run --rm \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_ENDPOINT/$DB_NAME" \
  -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
  -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
  -e SPRING_FLYWAY_ENABLED=true \
  ghcr.io/your-org/password-manager-backend:v1.0.0 \
  java -jar app.jar --spring.flyway.migrate
```

**Expected Duration:** 2-5 minutes

#### Step 4: Deploy Backend (Blue-Green)

```bash
cd k8s

# Check current deployment
kubectl get deployment backend -n password-manager

# Deploy new version (green)
kubectl set image deployment/backend \
  backend=ghcr.io/your-org/password-manager-backend:v1.0.0 \
  -n password-manager

# Wait for rollout to complete
kubectl rollout status deployment/backend -n password-manager --timeout=600s

# Verify health
kubectl port-forward -n password-manager deployment/backend 8080:8080 &
curl http://localhost:8080/actuator/health
kill %1
```

**Expected Duration:** 5-10 minutes

#### Step 5: Deploy Frontend to CDN

```bash
cd ../frontend

# Build production bundle
npm run build

# Get S3 bucket from Terraform
cd ../terraform
export S3_BUCKET=$(terraform output -raw frontend_s3_bucket)
export DISTRIBUTION_ID=$(terraform output -raw cdn_distribution_id)
cd ..

# Sync to S3
aws s3 sync frontend/out/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

**Expected Duration:** 5-10 minutes

#### Step 6: Verify Deployment

```bash
cd k8s

# Check all pods are running
kubectl get pods -n password-manager

# Check services
kubectl get svc -n password-manager

# Check ingress
kubectl get ingress -n password-manager

# Get application URL
export APP_URL=$(kubectl get ingress -n password-manager -o jsonpath='{.items[0].spec.rules[0].host}')

# Test endpoints
curl -I https://$APP_URL/
curl https://$APP_URL/api/v1/health
curl https://$APP_URL/actuator/health
```

#### Step 7: Run Smoke Tests

```bash
cd ../scripts
chmod +x smoke-tests.sh
./smoke-tests.sh production
```

---

## Post-Deployment Verification

### 1. Health Checks

Verify all services are healthy:

```bash
# Backend health
curl https://passwordmanager.example.com/api/v1/health

# Actuator health
curl https://passwordmanager.example.com/actuator/health

# Frontend
curl -I https://passwordmanager.example.com/

# Database connectivity
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv postgres-service 5432

# Redis connectivity
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv redis-service 6379
```

### 2. Functional Tests

Test critical user flows:

1. **User Registration**
   - Navigate to registration page
   - Create new account
   - Verify email (if enabled)
   - Receive recovery key

2. **User Login**
   - Login with credentials
   - 2FA verification (if enabled)
   - Session established

3. **Vault Operations**
   - Create new credential
   - Search for credential
   - Copy password to clipboard
   - Edit credential
   - Delete credential

4. **Password Generation**
   - Generate password
   - Customize options
   - Save to vault

5. **Sync**
   - Make changes on one device
   - Verify sync to another device

### 3. Performance Checks

Monitor key performance metrics:

```bash
# Response times
curl -w "@curl-format.txt" -o /dev/null -s https://passwordmanager.example.com/api/v1/health

# Resource usage
kubectl top pods -n password-manager
kubectl top nodes

# Database connections
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres -d password_manager -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

### 4. Security Verification

Verify security measures:

```bash
# Check TLS certificate
openssl s_client -connect passwordmanager.example.com:443 -servername passwordmanager.example.com

# Check security headers
curl -I https://passwordmanager.example.com/ | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"

# Verify rate limiting
for i in {1..10}; do curl https://passwordmanager.example.com/api/v1/auth/login; done
```

---

## Monitoring and Alerting

### Access Monitoring Dashboards

#### Grafana

```bash
# Port forward to Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Get admin password
cd terraform
terraform output -raw grafana_admin_password

# Open browser to http://localhost:3000
# Login: admin / <password>
```

**Key Dashboards:**
- Application Overview
- Infrastructure Metrics
- Database Performance
- Security Dashboard

#### Prometheus

```bash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open browser to http://localhost:9090
```

### Key Metrics to Monitor

**Application Metrics:**
- Request rate (requests/second)
- Error rate (%)
- Response time (p50, p95, p99)
- Active sessions
- Vault operations/minute

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network traffic
- Pod restarts

**Database Metrics:**
- Connection count
- Query duration
- Slow queries
- Deadlocks
- Replication lag

**Business Metrics:**
- User registrations
- Active users
- Vault operations
- Password generations
- Security alerts

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 1% | > 5% |
| Response Time | > 1s | > 2s |
| CPU Usage | > 70% | > 85% |
| Memory Usage | > 75% | > 90% |
| Database Connections | > 80% | > 95% |
| Failed Logins | > 10/min | > 50/min |

### Alert Channels

- **Email:** production-alerts@example.com
- **Slack:** #password-manager-alerts
- **PagerDuty:** On-call engineer
- **SMS:** Critical alerts only

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Error rate > 10%
- Critical functionality broken
- Data corruption detected
- Security vulnerability discovered
- Performance degradation > 50%

### Automated Rollback

```bash
cd k8s
chmod +x rollback.sh
./rollback.sh
```

### Manual Rollback

#### Rollback Backend

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n password-manager

# Verify rollback
kubectl rollout status deployment/backend -n password-manager

# Check pods
kubectl get pods -n password-manager -l app=backend
```

#### Rollback Frontend

```bash
# Get previous version from S3
aws s3 sync s3://backup-bucket/frontend-v0.9.0/ s3://production-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

#### Rollback Database

```bash
# Restore from backup
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres password_manager < backup-YYYYMMDD.sql
```

#### Rollback Infrastructure

```bash
cd terraform

# Revert to previous state
terraform apply -var-file="environments/production.tfvars" -target=module.eks

# Or destroy and recreate
terraform destroy -var-file="environments/production.tfvars"
terraform apply -var-file="environments/production.tfvars"
```

### Post-Rollback

1. Verify all services are healthy
2. Run smoke tests
3. Notify stakeholders
4. Investigate root cause
5. Document incident
6. Plan fix and redeployment

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

**Symptoms:** Pods stuck in `Pending` or `CrashLoopBackOff`

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n password-manager
kubectl logs <pod-name> -n password-manager
```

**Solutions:**
- Check resource limits
- Verify image exists
- Check secrets and configmaps
- Review application logs

#### 2. Database Connection Errors

**Symptoms:** Backend logs show connection errors

**Diagnosis:**
```bash
# Test connectivity
kubectl exec -it deployment/backend -n password-manager -- \
  nc -zv postgres-service 5432

# Check database status
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres -c "SELECT 1"
```

**Solutions:**
- Verify database credentials
- Check network policies
- Verify security groups
- Check database is running

#### 3. High Error Rate

**Symptoms:** Increased 5xx errors in logs

**Diagnosis:**
```bash
# Check application logs
kubectl logs -f deployment/backend -n password-manager | grep ERROR

# Check metrics
kubectl top pods -n password-manager
```

**Solutions:**
- Scale up pods
- Check database performance
- Review recent changes
- Check external dependencies

#### 4. Slow Response Times

**Symptoms:** Requests taking > 2 seconds

**Diagnosis:**
```bash
# Check pod resources
kubectl top pods -n password-manager

# Check database queries
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres -d password_manager -c \
  "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

**Solutions:**
- Optimize database queries
- Increase cache TTL
- Scale horizontally
- Add database indexes

#### 5. CDN Issues

**Symptoms:** Frontend not loading or showing old version

**Diagnosis:**
```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id $DISTRIBUTION_ID

# Check S3 bucket
aws s3 ls s3://$S3_BUCKET/
```

**Solutions:**
- Invalidate CDN cache
- Verify S3 sync completed
- Check CloudFront origin settings
- Verify DNS records

### Emergency Contacts

- **DevOps Team:** devops@example.com
- **On-Call Engineer:** oncall@example.com
- **Security Team:** security@example.com
- **Database Admin:** dba@example.com
- **Slack Channel:** #password-manager-ops

---

## Launch Announcement

### Internal Announcement

**To:** All Employees  
**Subject:** Password Manager Production Launch

Dear Team,

We're excited to announce that the Password Manager application is now live in production!

**Access URL:** https://passwordmanager.example.com

**Key Features:**
- Secure password storage with zero-knowledge encryption
- Password generation and strength analysis
- Multi-device sync
- Offline support
- Security dashboard
- Import/export functionality

**Getting Started:**
1. Visit the URL above
2. Create an account
3. Save your recovery key (important!)
4. Start adding passwords

**Support:**
- User Guide: https://passwordmanager.example.com/docs
- Support Email: support@example.com
- Slack: #password-manager-support

Thank you to everyone who contributed to this launch!

### External Announcement

**Blog Post Title:** Introducing Our New Password Manager

**Content:**
- Overview of features
- Security highlights
- Getting started guide
- Migration instructions
- FAQ
- Support information

**Social Media:**
- Twitter/X announcement
- LinkedIn post
- Company blog
- Newsletter

### User Communication Plan

**Week 1:**
- Launch announcement
- Getting started emails
- Tutorial videos
- Live Q&A sessions

**Week 2-4:**
- Feature highlights
- Security tips
- User testimonials
- Usage statistics

**Ongoing:**
- Monthly newsletters
- Feature updates
- Security advisories
- Best practices

---

## Post-Launch Checklist

### Day 1

- [ ] Monitor error rates every hour
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Respond to support tickets
- [ ] Update status page

### Week 1

- [ ] Daily monitoring reviews
- [ ] Collect user feedback
- [ ] Address critical issues
- [ ] Optimize performance
- [ ] Update documentation

### Week 2-4

- [ ] Weekly performance reviews
- [ ] Analyze usage patterns
- [ ] Plan improvements
- [ ] Security review
- [ ] Capacity planning

### Month 1

- [ ] Comprehensive review
- [ ] User satisfaction survey
- [ ] Performance optimization
- [ ] Feature prioritization
- [ ] Lessons learned document

---

## Success Criteria

The deployment is considered successful when:

- [ ] All services are healthy and stable
- [ ] Error rate < 0.1%
- [ ] Response time p95 < 500ms
- [ ] No critical bugs reported
- [ ] User feedback is positive
- [ ] All monitoring alerts are green
- [ ] 24-48 hour observation period completed
- [ ] Stakeholder approval received

---

## Appendix

### A. Configuration Files

- `terraform/environments/production.tfvars`
- `k8s/overlays/production/kustomization.yaml`
- `.env.production`

### B. Scripts

- `scripts/deploy-production.sh`
- `scripts/deploy-production.bat`
- `scripts/rollback.sh`
- `scripts/smoke-tests.sh`
- `scripts/verify-deployment.sh`

### C. Documentation

- API Documentation: `/swagger-ui.html`
- User Guide: `docs/`
- Developer Guide: `docs/API_INTEGRATION_GUIDE.md`
- CI/CD Guide: `docs/CICD_PIPELINE.md`

### D. Monitoring

- Grafana Dashboards: Port forward to 3000
- Prometheus: Port forward to 9090
- Kibana: Port forward to 5601
- Sentry: https://sentry.io/your-org/password-manager

---

**Document Version:** 1.0.0  
**Last Updated:** February 12, 2026  
**Next Review:** March 12, 2026
