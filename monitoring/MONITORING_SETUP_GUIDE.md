# Monitoring and Alerting Setup Guide

This guide covers the complete setup of monitoring and alerting infrastructure for the Password Manager application.

## Overview

The monitoring stack consists of:

1. **Prometheus** - Metrics collection and storage
2. **Grafana** - Visualization and dashboards
3. **Alertmanager** - Alert routing and notification
4. **ELK Stack** - Log aggregation and analysis (Elasticsearch, Logstash, Kibana)
5. **Blackbox Exporter** - Uptime monitoring
6. **Sentry** - Error tracking and performance monitoring
7. **Exporters** - PostgreSQL, Redis, and Node metrics

## Prerequisites

- Kubernetes cluster with kubectl access
- Helm 3.x installed (optional, for cert-manager)
- Domain names configured for:
  - prometheus.example.com
  - grafana.example.com
  - alertmanager.example.com
  - kibana.example.com
- SSL certificates (via cert-manager or manual)
- SMTP credentials for email alerts
- Slack webhook URL (optional)
- PagerDuty service key (optional)
- Sentry DSN keys (optional)

## Step 1: Create Monitoring Namespace

```bash
kubectl create namespace monitoring
```

## Step 2: Deploy Prometheus

### 2.1 Create Prometheus Rules ConfigMap

```bash
kubectl apply -f k8s/prometheus-rules.yaml
```

### 2.2 Deploy Prometheus

```bash
kubectl apply -f k8s/prometheus-deployment.yaml
```

### 2.3 Verify Prometheus

```bash
kubectl get pods -n monitoring -l app=prometheus
kubectl logs -n monitoring -l app=prometheus
```

Access Prometheus UI:
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

Visit: http://localhost:9090

## Step 3: Deploy Grafana

### 3.1 Update Grafana Admin Password

Edit `k8s/grafana-deployment.yaml` and update the admin password secret.

### 3.2 Create Grafana Dashboards ConfigMap

```bash
kubectl apply -f k8s/grafana-dashboards.yaml
```

### 3.3 Deploy Grafana

```bash
kubectl apply -f k8s/grafana-deployment.yaml
```

### 3.4 Verify Grafana

```bash
kubectl get pods -n monitoring -l app=grafana
kubectl logs -n monitoring -l app=grafana
```

Access Grafana UI:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Visit: http://localhost:3000
Login: admin / [your-password]

## Step 4: Deploy Alertmanager

### 4.1 Configure Alert Receivers

Edit `k8s/alertmanager-deployment.yaml` and update:
- SMTP credentials
- Slack webhook URL
- PagerDuty service key
- Email addresses

### 4.2 Deploy Alertmanager

```bash
kubectl apply -f k8s/alertmanager-deployment.yaml
```

### 4.3 Verify Alertmanager

```bash
kubectl get pods -n monitoring -l app=alertmanager
kubectl logs -n monitoring -l app=alertmanager
```

Access Alertmanager UI:
```bash
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
```

Visit: http://localhost:9093

## Step 5: Deploy ELK Stack

### 5.1 Deploy Elasticsearch

```bash
kubectl apply -f k8s/elasticsearch-stack.yaml
```

Wait for Elasticsearch to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=elasticsearch -n monitoring --timeout=300s
```

### 5.2 Verify Elasticsearch

```bash
kubectl get pods -n monitoring -l app=elasticsearch
kubectl logs -n monitoring elasticsearch-0
```

Test Elasticsearch:
```bash
kubectl port-forward -n monitoring svc/elasticsearch-client 9200:9200
curl http://localhost:9200/_cluster/health
```

### 5.3 Verify Logstash

```bash
kubectl get pods -n monitoring -l app=logstash
kubectl logs -n monitoring -l app=logstash
```

### 5.4 Access Kibana

```bash
kubectl port-forward -n monitoring svc/kibana 5601:5601
```

Visit: http://localhost:5601

Configure index pattern:
1. Go to Management > Stack Management > Index Patterns
2. Create index pattern: `password-manager-*`
3. Select time field: `@timestamp`

## Step 6: Deploy Uptime Monitoring

```bash
kubectl apply -f monitoring/uptime-monitoring.yaml
```

Verify Blackbox Exporter:
```bash
kubectl get pods -n monitoring -l app=blackbox-exporter
kubectl logs -n monitoring -l app=blackbox-exporter
```

## Step 7: Deploy Exporters

### 7.1 Update Database Credentials

Edit `k8s/exporters-deployment.yaml` and update:
- PostgreSQL connection string
- Redis password

### 7.2 Deploy Exporters

```bash
kubectl apply -f k8s/exporters-deployment.yaml
```

### 7.3 Verify Exporters

```bash
kubectl get pods -n monitoring -l app=postgres-exporter
kubectl get pods -n monitoring -l app=redis-exporter
kubectl get pods -n monitoring -l app=node-exporter
```

## Step 8: Configure Sentry

### 8.1 Create Sentry Projects

1. Sign up at https://sentry.io or deploy self-hosted Sentry
2. Create two projects:
   - password-manager-backend (Java/Spring Boot)
   - password-manager-frontend (JavaScript/Next.js)
3. Copy the DSN keys

### 8.2 Update Sentry Configuration

Edit `monitoring/sentry-config.yaml` and update DSN keys:

```bash
kubectl apply -f monitoring/sentry-config.yaml
```

### 8.3 Update Application Deployments

Update backend and frontend deployments to include Sentry environment variables:

```yaml
envFrom:
  - configMapRef:
      name: sentry-config-backend  # or sentry-config-frontend
  - secretRef:
      name: sentry-dsn
```

## Step 9: Configure Ingress

### 9.1 Update Domain Names

Edit all ingress resources and replace `example.com` with your actual domain:
- prometheus.example.com
- grafana.example.com
- alertmanager.example.com
- kibana.example.com

### 9.2 Create Basic Auth Secrets

For Prometheus and Alertmanager:

```bash
# Install htpasswd
sudo apt-get install apache2-utils  # Ubuntu/Debian
# or
brew install httpd  # macOS

# Create password file
htpasswd -c auth admin

# Create Kubernetes secrets
kubectl create secret generic prometheus-basic-auth \
  --from-file=auth \
  -n monitoring

kubectl create secret generic alertmanager-basic-auth \
  --from-file=auth \
  -n monitoring
```

### 9.3 Apply Ingress Resources

Ingress resources are included in the deployment files. Verify:

```bash
kubectl get ingress -n monitoring
```

## Step 10: Test Alerting System

### 10.1 Test Alert Generation

Create a test alert:

```bash
kubectl run test-alert --image=busybox --restart=Never -n password-manager -- sleep 3600
kubectl delete pod test-alert -n password-manager
```

This should trigger a `PodNotReady` alert.

### 10.2 Test Email Alerts

Check Alertmanager logs:
```bash
kubectl logs -n monitoring -l app=alertmanager | grep -i email
```

### 10.3 Test Slack Alerts (if configured)

Check Alertmanager logs:
```bash
kubectl logs -n monitoring -l app=alertmanager | grep -i slack
```

### 10.4 Silence Test Alerts

Access Alertmanager UI and create silences for test alerts.

## Step 11: Configure Grafana Dashboards

### 11.1 Import Dashboards

The dashboards are automatically provisioned from the ConfigMap. Verify in Grafana:

1. Go to Dashboards
2. You should see:
   - Password Manager - Overview
   - Password Manager - Security
   - Password Manager - Database
   - Password Manager - Business Metrics

### 11.2 Customize Dashboards

Edit dashboards as needed and save. Changes will persist in Grafana's database.

## Step 12: Set Up Log Queries in Kibana

### 12.1 Create Saved Searches

1. **Error Logs**:
   - Query: `level:ERROR`
   - Save as: "Error Logs"

2. **Security Events**:
   - Query: `tags:security`
   - Save as: "Security Events"

3. **Authentication Failures**:
   - Query: `logger_name:*auth* AND level:ERROR`
   - Save as: "Authentication Failures"

### 12.2 Create Visualizations

1. **Error Rate Over Time**:
   - Type: Line chart
   - Y-axis: Count
   - X-axis: @timestamp
   - Filter: level:ERROR

2. **Top Error Messages**:
   - Type: Data table
   - Metrics: Count
   - Buckets: Terms on message.keyword

## Monitoring Endpoints

| Service | URL | Authentication |
|---------|-----|----------------|
| Prometheus | https://prometheus.example.com | Basic Auth |
| Grafana | https://grafana.example.com | Grafana Login |
| Alertmanager | https://alertmanager.example.com | Basic Auth |
| Kibana | https://kibana.example.com | None (configure as needed) |

## Key Metrics to Monitor

### Application Metrics

- **Request Rate**: `rate(http_server_requests_seconds_count[5m])`
- **Error Rate**: `rate(http_server_requests_seconds_count{status=~"5.."}[5m])`
- **Response Time (p95)**: `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))`
- **Active Sessions**: `active_sessions_total`

### Infrastructure Metrics

- **CPU Usage**: `rate(process_cpu_usage[5m])`
- **Memory Usage**: `jvm_memory_used_bytes / jvm_memory_max_bytes`
- **Database Connections**: `hikaricp_connections_active / hikaricp_connections_max`
- **Redis Memory**: `redis_memory_used_bytes / redis_memory_max_bytes`

### Business Metrics

- **User Registrations**: `rate(user_registrations_total[1h])`
- **Vault Operations**: `rate(vault_operations_total[5m])`
- **Password Generations**: `rate(password_generations_total[5m])`
- **Sync Operations**: `rate(vault_sync_total[5m])`

### Security Metrics

- **Failed Logins**: `rate(authentication_failures_total[5m])`
- **Rate Limit Exceeded**: `rate(rate_limit_exceeded_total[5m])`
- **Suspicious Activity**: `rate(suspicious_activity_total[5m])`

## Alert Rules

### Critical Alerts

- **BackendDown**: Backend service unavailable for 2+ minutes
- **FrontendDown**: Frontend service unavailable for 2+ minutes
- **DatabaseConnectionPoolExhausted**: Connection pool >90% utilized
- **SSLCertificateExpired**: SSL certificate has expired

### Warning Alerts

- **HighErrorRate**: Error rate >5% for 5 minutes
- **HighResponseTime**: p95 response time >1s for 5 minutes
- **HighCPUUsage**: CPU usage >80% for 10 minutes
- **HighMemoryUsage**: Memory usage >85% for 10 minutes

### Security Alerts

- **HighFailedLoginAttempts**: Failed login rate >0.1/sec for 5 minutes
- **RateLimitExceeded**: Rate limit exceeded >1/sec for 5 minutes
- **SuspiciousActivity**: Suspicious activity detected

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check ServiceMonitor configuration
2. Verify pod annotations: `prometheus.io/scrape: "true"`
3. Check Prometheus logs: `kubectl logs -n monitoring -l app=prometheus`

### Grafana Dashboards Not Loading

1. Verify datasource configuration
2. Check Prometheus connectivity from Grafana
3. Review Grafana logs: `kubectl logs -n monitoring -l app=grafana`

### Alerts Not Firing

1. Check Prometheus rules: `kubectl get prometheusrules -n monitoring`
2. Verify Alertmanager configuration
3. Check Alertmanager logs: `kubectl logs -n monitoring -l app=alertmanager`

### Logs Not Appearing in Kibana

1. Verify Filebeat is running: `kubectl get pods -n monitoring -l app=filebeat`
2. Check Logstash logs: `kubectl logs -n monitoring -l app=logstash`
3. Verify Elasticsearch health: `curl http://elasticsearch-client:9200/_cluster/health`

### Sentry Not Receiving Errors

1. Verify DSN configuration
2. Check application logs for Sentry initialization
3. Test with manual error: `Sentry.captureException(new Error("Test error"))`

## Maintenance

### Backup Prometheus Data

```bash
kubectl exec -n monitoring prometheus-xxx -- tar czf /tmp/prometheus-backup.tar.gz /prometheus
kubectl cp monitoring/prometheus-xxx:/tmp/prometheus-backup.tar.gz ./prometheus-backup.tar.gz
```

### Backup Grafana Dashboards

Export dashboards via Grafana UI or API.

### Rotate Secrets

Update secrets and restart affected pods:

```bash
kubectl delete secret alertmanager-secrets -n monitoring
kubectl create secret generic alertmanager-secrets \
  --from-literal=smtp-password=new-password \
  -n monitoring
kubectl rollout restart deployment/alertmanager -n monitoring
```

### Scale Elasticsearch

```bash
kubectl scale statefulset elasticsearch -n monitoring --replicas=5
```

## Security Considerations

1. **Enable Authentication**: All monitoring endpoints should require authentication
2. **Network Policies**: Restrict access to monitoring namespace
3. **Secrets Management**: Use external secrets manager (e.g., Vault, AWS Secrets Manager)
4. **RBAC**: Configure proper Kubernetes RBAC for monitoring namespace
5. **Data Retention**: Configure appropriate retention policies to manage storage
6. **Audit Logging**: Enable audit logging for monitoring access

## Cost Optimization

1. **Adjust Scrape Intervals**: Increase intervals for less critical metrics
2. **Reduce Retention**: Lower Prometheus retention from 30d to 15d
3. **Sample Rates**: Reduce Sentry trace sample rates in production
4. **Log Filtering**: Filter out verbose logs before sending to Elasticsearch
5. **Resource Limits**: Set appropriate resource limits for all components

## Next Steps

1. Set up automated backups for Prometheus and Grafana
2. Configure additional alert receivers (PagerDuty, OpsGenie)
3. Create custom dashboards for specific use cases
4. Set up log-based alerts in Kibana
5. Integrate with incident management system
6. Configure SLO/SLI monitoring
7. Set up synthetic monitoring for critical user journeys

## Support

For issues or questions:
- Check logs: `kubectl logs -n monitoring <pod-name>`
- Review Prometheus targets: https://prometheus.example.com/targets
- Check Alertmanager status: https://alertmanager.example.com/#/status
- Review Grafana datasources: https://grafana.example.com/datasources
