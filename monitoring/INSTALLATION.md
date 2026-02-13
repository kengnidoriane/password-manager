# Monitoring Stack Installation Guide

## Prerequisites

Before deploying the monitoring stack, ensure you have:

1. **Kubernetes cluster** with kubectl access
2. **Helm 3.x** (optional, for cert-manager)
3. **Domain names** configured
4. **SSL certificates** (via cert-manager or manual)
5. **SMTP credentials** for email alerts
6. **Slack webhook URL** (optional)
7. **PagerDuty service key** (optional)
8. **Sentry account** (optional, can use self-hosted)

## Step 1: Install Frontend Dependencies

The Sentry integration requires the `@sentry/nextjs` package:

```bash
cd frontend
npm install
```

This will install all dependencies including `@sentry/nextjs` which was added to `package.json`.

## Step 2: Create Kubernetes Namespace

```bash
kubectl create namespace monitoring
```

## Step 3: Create Secrets

### 3.1 Grafana Admin Password

```bash
kubectl create secret generic grafana-admin \
  --from-literal=password=your-secure-password \
  -n monitoring
```

### 3.2 Alertmanager Secrets

```bash
kubectl create secret generic alertmanager-secrets \
  --from-literal=smtp-password=your-smtp-password \
  --from-literal=slack-webhook-url=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  --from-literal=pagerduty-service-key=your-pagerduty-key \
  -n monitoring
```

### 3.3 Prometheus Basic Auth

```bash
# Install htpasswd (if not already installed)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd
# Windows: Use online htpasswd generator

# Create password file
htpasswd -c auth admin

# Create secrets
kubectl create secret generic prometheus-basic-auth \
  --from-file=auth \
  -n monitoring

kubectl create secret generic alertmanager-basic-auth \
  --from-file=auth \
  -n monitoring
```

### 3.4 Database Exporter Secrets

```bash
# PostgreSQL Exporter
kubectl create secret generic postgres-exporter-secret \
  --from-literal=data-source-name="postgresql://username:password@postgres.password-manager.svc.cluster.local:5432/passwordmanager?sslmode=disable" \
  -n monitoring

# Redis Exporter
kubectl create secret generic redis-exporter-secret \
  --from-literal=redis-password=your-redis-password \
  -n monitoring
```

### 3.5 Sentry DSN

```bash
kubectl create secret generic sentry-dsn \
  --from-literal=backend-dsn=https://your-backend-dsn@sentry.io/project-id \
  --from-literal=frontend-dsn=https://your-frontend-dsn@sentry.io/project-id \
  -n password-manager
```

## Step 4: Update Configuration

### 4.1 Update Domain Names

Replace `example.com` with your actual domain in these files:

- `k8s/prometheus-deployment.yaml`
- `k8s/grafana-deployment.yaml`
- `k8s/alertmanager-deployment.yaml`
- `k8s/elasticsearch-stack.yaml`
- `monitoring/uptime-monitoring.yaml`

```bash
# Use sed to replace (Linux/macOS)
find k8s monitoring -name "*.yaml" -type f -exec sed -i 's/example\.com/yourdomain.com/g' {} +

# Or manually edit each file
```

### 4.2 Update Email Addresses

Edit `k8s/alertmanager-deployment.yaml` and update email addresses:

- `ops-team@passwordmanager.example.com`
- `oncall@passwordmanager.example.com`
- `security@passwordmanager.example.com`

### 4.3 Update Database Connection Strings

Edit `k8s/exporters-deployment.yaml` and update:

- PostgreSQL connection string
- Redis connection details

## Step 5: Deploy Monitoring Components

### 5.1 Deploy Prometheus

```bash
kubectl apply -f k8s/prometheus-rules.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
```

Wait for Prometheus to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
```

### 5.2 Deploy Grafana

```bash
kubectl apply -f k8s/grafana-dashboards.yaml
kubectl apply -f k8s/grafana-deployment.yaml
```

Wait for Grafana to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s
```

### 5.3 Deploy Alertmanager

```bash
kubectl apply -f k8s/alertmanager-deployment.yaml
```

Wait for Alertmanager to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=alertmanager -n monitoring --timeout=300s
```

### 5.4 Deploy ELK Stack

```bash
kubectl apply -f k8s/elasticsearch-stack.yaml
```

Wait for Elasticsearch to be ready (this may take several minutes):

```bash
kubectl wait --for=condition=ready pod -l app=elasticsearch -n monitoring --timeout=600s
```

### 5.5 Deploy Uptime Monitoring

```bash
kubectl apply -f monitoring/uptime-monitoring.yaml
```

### 5.6 Deploy Exporters

```bash
kubectl apply -f k8s/exporters-deployment.yaml
```

### 5.7 Deploy Sentry Configuration

```bash
kubectl apply -f monitoring/sentry-config.yaml
```

## Step 6: Verify Deployment

### 6.1 Check All Pods

```bash
kubectl get pods -n monitoring
```

All pods should be in `Running` state.

### 6.2 Run Test Script

```bash
# Linux/macOS
chmod +x monitoring/test-alerting.sh
./monitoring/test-alerting.sh

# Windows
monitoring\test-alerting.bat
```

## Step 7: Access Services

### 7.1 Port Forward (for testing)

```bash
# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Alertmanager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# Kibana
kubectl port-forward -n monitoring svc/kibana 5601:5601
```

### 7.2 Access via Ingress (production)

Once DNS is configured and SSL certificates are issued:

- Prometheus: https://prometheus.yourdomain.com
- Grafana: https://grafana.yourdomain.com
- Alertmanager: https://alertmanager.yourdomain.com
- Kibana: https://kibana.yourdomain.com

## Step 8: Configure Kibana

1. Access Kibana: http://localhost:5601
2. Go to Management > Stack Management > Index Patterns
3. Create index pattern: `password-manager-*`
4. Select time field: `@timestamp`
5. Click "Create index pattern"

## Step 9: Configure Grafana

1. Access Grafana: http://localhost:3000
2. Login with admin credentials
3. Verify datasources are configured:
   - Go to Configuration > Data Sources
   - Should see Prometheus and Elasticsearch
4. Verify dashboards are loaded:
   - Go to Dashboards
   - Should see 4 pre-configured dashboards

## Step 10: Test Alerting

### 10.1 Trigger a Test Alert

```bash
# Create a pod that will fail
kubectl run test-alert --image=busybox --restart=Never -n password-manager -- sleep 10

# Delete it to trigger PodNotReady alert
kubectl delete pod test-alert -n password-manager --force --grace-period=0
```

### 10.2 Check Alertmanager

1. Access Alertmanager: http://localhost:9093
2. Check for active alerts
3. Verify alert routing

### 10.3 Check Email/Slack

Verify that notifications are received via configured channels.

## Step 11: Update Application Deployments

Update backend and frontend deployments to include Sentry environment variables:

### Backend Deployment

Add to `k8s/backend-deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
        - name: backend
          envFrom:
            - configMapRef:
                name: sentry-config-backend
            - secretRef:
                name: sentry-dsn
```

### Frontend Deployment

Add to `k8s/frontend-deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
        - name: frontend
          envFrom:
            - configMapRef:
                name: sentry-config-frontend
            - secretRef:
                name: sentry-dsn
```

Redeploy applications:

```bash
kubectl rollout restart deployment/password-manager-backend -n password-manager
kubectl rollout restart deployment/password-manager-frontend -n password-manager
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n monitoring

# Check pod logs
kubectl logs -n monitoring <pod-name>

# Describe pod for events
kubectl describe pod -n monitoring <pod-name>
```

### Prometheus Not Scraping

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Check ServiceMonitor/PodMonitor
kubectl get servicemonitor -n monitoring
kubectl get podmonitor -n monitoring
```

### Grafana Dashboards Not Loading

```bash
# Check Grafana logs
kubectl logs -n monitoring -l app=grafana

# Verify ConfigMap
kubectl get configmap grafana-dashboards -n monitoring -o yaml

# Check datasource configuration
kubectl logs -n monitoring -l app=grafana | grep -i datasource
```

### Alerts Not Firing

```bash
# Check Prometheus rules
kubectl get prometheusrules -n monitoring

# Check Alertmanager configuration
kubectl logs -n monitoring -l app=alertmanager

# Verify Alertmanager is receiving alerts
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
# Visit: http://localhost:9093/#/alerts
```

### Elasticsearch Not Starting

```bash
# Check Elasticsearch logs
kubectl logs -n monitoring elasticsearch-0

# Check cluster health
kubectl port-forward -n monitoring svc/elasticsearch-client 9200:9200
curl http://localhost:9200/_cluster/health

# Common issues:
# - Insufficient memory (increase limits)
# - vm.max_map_count too low (check init container)
# - Storage issues (check PVC)
```

### Logs Not in Kibana

```bash
# Check Filebeat
kubectl get pods -n monitoring -l app=filebeat
kubectl logs -n monitoring -l app=filebeat

# Check Logstash
kubectl logs -n monitoring -l app=logstash

# Verify Elasticsearch indices
curl http://localhost:9200/_cat/indices | grep password-manager
```

## Maintenance

### Backup Prometheus Data

```bash
kubectl exec -n monitoring prometheus-xxx -- \
  tar czf /tmp/prometheus-backup.tar.gz /prometheus

kubectl cp monitoring/prometheus-xxx:/tmp/prometheus-backup.tar.gz \
  ./prometheus-backup-$(date +%Y%m%d).tar.gz
```

### Backup Grafana Dashboards

Export dashboards via Grafana UI:
1. Go to Dashboard
2. Click Share
3. Export > Save to file

### Update Secrets

```bash
# Delete old secret
kubectl delete secret alertmanager-secrets -n monitoring

# Create new secret
kubectl create secret generic alertmanager-secrets \
  --from-literal=smtp-password=new-password \
  -n monitoring

# Restart deployment
kubectl rollout restart deployment/alertmanager -n monitoring
```

### Scale Components

```bash
# Scale Elasticsearch
kubectl scale statefulset elasticsearch -n monitoring --replicas=5

# Scale Logstash
kubectl scale deployment logstash -n monitoring --replicas=3
```

## Next Steps

1. Configure production SSL certificates
2. Set up automated backups
3. Configure log retention policies
4. Create custom dashboards
5. Fine-tune alert thresholds
6. Set up SLO/SLI monitoring
7. Configure synthetic monitoring
8. Train team on monitoring tools

## Support

For detailed information, see:
- [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md) - Comprehensive guide
- [README.md](README.md) - Quick reference
- [MONITORING_ALERTING_IMPLEMENTATION.md](../MONITORING_ALERTING_IMPLEMENTATION.md) - Implementation summary
