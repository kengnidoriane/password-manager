# Production Deployment - Quick Reference Card

## 🚀 Quick Deploy (5 Commands)

```bash
# 1. Navigate to scripts
cd scripts

# 2. Make script executable (Linux/macOS only)
chmod +x deploy-production.sh

# 3. Deploy to production
./deploy-production.sh --version v1.0.0

# 4. Verify deployment
./verify-deployment.sh password-manager production

# 5. Run smoke tests
./smoke-tests.sh production
```

**Windows:**
```cmd
cd scripts
deploy-production.bat --version v1.0.0
verify-deployment.bat password-manager production
smoke-tests.bat production
```

---

## ⚡ Prerequisites (2 minutes)

```bash
# Verify tools
terraform --version  # v1.5+
kubectl version      # v1.24+
aws --version        # v2.0+
docker --version     # v20.10+

# Verify AWS access
aws sts get-caller-identity

# Verify kubectl access
kubectl cluster-info
```

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] AWS credentials configured
- [ ] Production secrets generated
- [ ] Domain names configured
- [ ] SSL certificates ready
- [ ] Team notified
- [ ] Maintenance window scheduled

---

## 🔧 Manual Deployment (6 Steps)

### 1. Terraform (20-30 min)
```bash
cd terraform
terraform init
terraform plan -var-file="environments/production.tfvars" -out=tfplan
terraform apply tfplan
```

### 2. Configure kubectl (1 min)
```bash
aws eks update-kubeconfig --region us-east-1 --name $(terraform output -raw eks_cluster_name)
kubectl get nodes
```

### 3. Database Migrations (2-5 min)
```bash
docker run --rm \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://$(terraform output -raw postgresql_endpoint)/$(terraform output -raw postgresql_database_name)" \
  -e SPRING_DATASOURCE_USERNAME="$(terraform output -raw postgresql_master_username)" \
  -e SPRING_DATASOURCE_PASSWORD="$(terraform output -raw postgresql_master_password)" \
  -e SPRING_FLYWAY_ENABLED=true \
  ghcr.io/your-org/password-manager-backend:v1.0.0 \
  java -jar app.jar --spring.flyway.migrate
```

### 4. Deploy Backend (5-10 min)
```bash
cd k8s
kubectl set image deployment/backend backend=ghcr.io/your-org/password-manager-backend:v1.0.0 -n password-manager
kubectl rollout status deployment/backend -n password-manager --timeout=600s
```

### 5. Deploy Frontend (5-10 min)
```bash
cd frontend
npm run build
aws s3 sync out/ s3://$(cd ../terraform && terraform output -raw frontend_s3_bucket)/ --delete
aws cloudfront create-invalidation --distribution-id $(cd ../terraform && terraform output -raw cdn_distribution_id) --paths "/*"
```

### 6. Verify (5 min)
```bash
cd scripts
./smoke-tests.sh production
./verify-deployment.sh password-manager production
```

---

## 🏥 Health Checks

```bash
# Frontend
curl -I https://passwordmanager.example.com/

# Backend API
curl https://passwordmanager.example.com/api/v1/health

# Actuator
curl https://passwordmanager.example.com/actuator/health

# All pods
kubectl get pods -n password-manager

# Services
kubectl get svc -n password-manager

# Ingress
kubectl get ingress -n password-manager
```

---

## 📊 Monitoring

### Grafana
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000
# Login: admin / <password from terraform output>
```

### Prometheus
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090
```

### Key Metrics
- Error rate < 0.1%
- Response time p95 < 500ms
- CPU usage < 70%
- Memory usage < 75%

---

## 🔄 Rollback

### Automated
```bash
cd k8s
./rollback.sh
```

### Manual
```bash
# Backend
kubectl rollout undo deployment/backend -n password-manager

# Frontend
aws s3 sync s3://backup-bucket/frontend-v0.9.0/ s3://production-bucket/ --delete
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Database
kubectl exec -it postgres-0 -n password-manager -- \
  psql -U postgres password_manager < backup-YYYYMMDD.sql
```

---

## 🐛 Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n password-manager
kubectl logs <pod-name> -n password-manager
```

### Database Connection Issues
```bash
kubectl exec -it deployment/backend -n password-manager -- nc -zv postgres-service 5432
```

### High Error Rate
```bash
kubectl logs -f deployment/backend -n password-manager | grep ERROR
kubectl top pods -n password-manager
```

### CDN Issues
```bash
aws cloudfront get-distribution --id $DISTRIBUTION_ID
aws s3 ls s3://$S3_BUCKET/
```

---

## 📞 Emergency Contacts

- **DevOps:** devops@example.com
- **On-Call:** oncall@example.com
- **Security:** security@example.com
- **Slack:** #password-manager-ops

---

## 📚 Documentation

- **Full Guide:** `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Launch Templates:** `docs/LAUNCH_ANNOUNCEMENT_TEMPLATE.md`
- **API Docs:** `/swagger-ui.html`
- **Troubleshooting:** See full guide

---

## ✅ Success Criteria

- [ ] All services healthy
- [ ] Error rate < 0.1%
- [ ] Response time p95 < 500ms
- [ ] No critical bugs
- [ ] Monitoring alerts green
- [ ] 24-48 hour observation complete

---

## 🎯 Post-Deployment

### Day 1
- Monitor error rates hourly
- Check performance metrics
- Review user feedback
- Respond to support tickets

### Week 1
- Daily monitoring reviews
- Collect user feedback
- Address critical issues
- Optimize performance

### Month 1
- Comprehensive review
- User satisfaction survey
- Performance optimization
- Feature prioritization

---

## 📝 Deployment Record

Location: `deployments/production-YYYYMMDD-HHMMSS.txt`

Contains:
- Deployment timestamp
- Version deployed
- Deployed by
- AWS account
- Component status
- Infrastructure details

---

**Keep this card handy during deployment!**

**Version:** 1.0.0  
**Last Updated:** February 12, 2026
