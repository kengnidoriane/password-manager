# Password Manager - Monitoring and Alerting

Complete monitoring and alerting infrastructure for the Password Manager application.

## Overview

This directory contains all configuration files and documentation for the monitoring stack:

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and notifications
- **ELK Stack** - Log aggregation (Elasticsearch, Logstash, Kibana)
- **Blackbox Exporter** - Uptime monitoring
- **Sentry** - Error tracking and performance monitoring
- **Exporters** - PostgreSQL, Redis, and Node metrics

## Quick Start

### 1. Deploy Monitoring Stack

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
kubectl apply -f ../k8s/prometheus-rules.yaml
kubectl apply -f ../k8s/prometheus-deployment.yaml

# Deploy Grafana
kubectl apply -f ../k8s/grafana-dashboards.yaml
kubectl apply -f ../k8s/grafana-deployment.yaml

# Deploy Alertmanager
kubectl apply -f ../k8s/alertmanager-deployment.yaml

# Deploy ELK Stack
kubectl apply -f ../k8s/elasticsearch-stack.yaml

# Deploy Uptime Monitoring
kubectl apply -f uptime-monitoring.yaml

# Deploy Exporters
kubectl apply -f ../k8s/exporters-deployment.yaml

# Deploy Sentry Configuration
kubectl apply -f sentry-config.yaml
```

### 2. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n monitoring

# Run test script
./test-alerting.sh  # Linux/macOS
# or
test-alerting.bat   # Windows
```

### 3. Access Services

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

## Files

### Configuration Files

- `uptime-monitoring.yaml` - Blackbox Exporter and uptime probes
- `sentry-config.yaml` - Sentry error tracking configuration
- `MONITORING_SETUP_GUIDE.md` - Detailed setup instructions
- `README.md` - This file

### Test Scripts

- `test-alerting.sh` - Linux/macOS test script
- `test-alerting.bat` - Windows test script

### Kubernetes Manifests (in ../k8s/)

- `prometheus-deployment.yaml` - Prometheus server
- `prometheus-rules.yaml` - Alert rules
- `grafana-deployment.yaml` - Grafana server
- `grafana-dashboards.yaml` - Pre-configured dashboards
- `alertmanager-deployment.yaml` - Alertmanager server
- `elasticsearch-stack.yaml` - ELK stack components
- `exporters-deployment.yaml` - Metrics exporters

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Backend    │              │   Frontend   │            │
│  │  (Metrics)   │              │   (Sentry)   │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │                              │
┌─────────┼──────────────────────────────┼─────────────────────┐
│         │    Monitoring Layer          │                     │
│         │                              │                     │
│  ┌──────▼───────┐              ┌──────▼───────┐            │
│  │  Prometheus  │              │    Sentry    │            │
│  │   (Metrics)  │              │   (Errors)   │            │
│  └──────┬───────┘              └──────────────┘            │
│         │                                                    │
│  ┌──────▼───────┐              ┌──────────────┐            │
│  │ Alertmanager │              │   Grafana    │            │
│  │   (Alerts)   │              │ (Dashboards) │            │
│  └──────┬───────┘              └──────────────┘            │
│         │                                                    │
│  ┌──────▼───────────────────────────────────┐              │
│  │         Notification Channels             │              │
│  │  Email │ Slack │ PagerDuty │ Webhook     │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Logging Layer                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Filebeat   │───▶│   Logstash   │───▶│Elasticsearch │  │
│  │ (Collector)  │    │  (Pipeline)  │    │   (Storage)  │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                                   │           │
│                                            ┌──────▼───────┐  │
│                                            │    Kibana    │  │
│                                            │ (Visualize)  │  │
│                                            └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Metrics

### Application Metrics

The backend exposes metrics at `/actuator/prometheus`:

- **HTTP Metrics**: Request rate, error rate, response time
- **JVM Metrics**: Memory usage, GC, threads
- **Database Metrics**: Connection pool, query performance
- **Redis Metrics**: Cache hit rate, memory usage
- **Business Metrics**: User registrations, vault operations, sync events
- **Security Metrics**: Failed logins, rate limits, suspicious activity

### Infrastructure Metrics

- **Node Metrics**: CPU, memory, disk, network
- **PostgreSQL Metrics**: Connections, queries, replication
- **Redis Metrics**: Memory, commands, keys
- **Kubernetes Metrics**: Pod status, resource usage

## Dashboards

### Pre-configured Grafana Dashboards

1. **Password Manager - Overview**
   - Request rate and error rate
   - Response time (p50, p95, p99)
   - Active users and sessions
   - CPU and memory usage

2. **Password Manager - Security**
   - Failed login attempts
   - Rate limit violations
   - Suspicious activity
   - 2FA failures
   - Vault access events

3. **Password Manager - Database**
   - Connection pool usage
   - Query duration
   - Slow queries
   - Database errors

4. **Password Manager - Business Metrics**
   - User registrations
   - Active users
   - Vault operations
   - Password generations
   - Sync operations
   - Import/export operations

## Alerts

### Critical Alerts

- **BackendDown**: Backend service unavailable
- **FrontendDown**: Frontend service unavailable
- **DatabaseConnectionPoolExhausted**: Connection pool >90%
- **SSLCertificateExpired**: SSL certificate expired
- **CriticalErrorRate**: Error rate >10%
- **NodeNotReady**: Kubernetes node not ready

### Warning Alerts

- **HighErrorRate**: Error rate >5%
- **HighResponseTime**: p95 response time >1s
- **HighCPUUsage**: CPU usage >80%
- **HighMemoryUsage**: Memory usage >85%
- **SlowDatabaseQueries**: Average query time >0.5s
- **RedisHighMemoryUsage**: Redis memory >90%

### Security Alerts

- **HighFailedLoginAttempts**: Failed login rate >0.1/sec
- **RateLimitExceeded**: Rate limit exceeded frequently
- **SuspiciousActivity**: Suspicious activity detected

### Info Alerts

- **LowUserRegistrations**: Registration rate below threshold
- **HighVaultSyncFailures**: Sync failure rate >5%

## Alert Routing

Alerts are routed based on severity and component:

- **Critical alerts** → Email + Slack + PagerDuty (immediate)
- **Security alerts** → Email + Slack (immediate)
- **Warning alerts** → Email + Slack (grouped, 1h repeat)
- **Info alerts** → Email (daily digest)

## Logging

### Log Collection

- **Filebeat** collects logs from all pods
- **Logstash** processes and enriches logs
- **Elasticsearch** stores logs with 30-day retention
- **Kibana** provides log search and visualization

### Log Format

Logs are structured in JSON format:

```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger_name": "com.passwordmanager.backend.service.VaultService",
  "message": "Credential created successfully",
  "correlationId": "abc123",
  "userId": "user-456",
  "action": "CREATE_CREDENTIAL",
  "tags": ["vault", "audit"]
}
```

### Log Queries

Common Kibana queries:

- Error logs: `level:ERROR`
- Security events: `tags:security`
- Authentication failures: `logger_name:*auth* AND level:ERROR`
- Specific user: `userId:"user-123"`
- Correlation ID: `correlationId:"abc123"`

## Error Tracking

### Sentry Configuration

Sentry is configured for both backend and frontend:

- **Backend**: Java/Spring Boot integration
- **Frontend**: Next.js integration
- **Sample Rate**: 10% for traces, 10% for session replay
- **PII Filtering**: Sensitive data automatically removed

### Sentry Features

- **Error Tracking**: Automatic error capture and grouping
- **Performance Monitoring**: Transaction tracing
- **Session Replay**: User session recording (with PII masking)
- **Release Tracking**: Track errors by release version
- **Source Maps**: Stack traces with original source code

## Uptime Monitoring

### Blackbox Exporter

Monitors external endpoints:

- Frontend: `https://app.passwordmanager.example.com`
- Backend health: `https://api.passwordmanager.example.com/actuator/health`
- API endpoints: `https://api.passwordmanager.example.com/api/v1/auth/login`

### Uptime Alerts

- **EndpointDown**: Endpoint down for >2 minutes
- **EndpointSlowResponse**: Response time >3s
- **SSLCertificateExpiringSoon**: Certificate expires in <30 days

## Configuration

### Update Domain Names

Replace `example.com` with your actual domain in:

- `../k8s/prometheus-deployment.yaml`
- `../k8s/grafana-deployment.yaml`
- `../k8s/alertmanager-deployment.yaml`
- `../k8s/elasticsearch-stack.yaml`
- `uptime-monitoring.yaml`

### Update Secrets

Update the following secrets:

1. **Grafana Admin Password**:
   ```bash
   kubectl create secret generic grafana-admin \
     --from-literal=password=your-secure-password \
     -n monitoring
   ```

2. **Alertmanager Secrets**:
   ```bash
   kubectl create secret generic alertmanager-secrets \
     --from-literal=smtp-password=your-smtp-password \
     --from-literal=slack-webhook-url=your-slack-webhook \
     --from-literal=pagerduty-service-key=your-pagerduty-key \
     -n monitoring
   ```

3. **Sentry DSN**:
   ```bash
   kubectl create secret generic sentry-dsn \
     --from-literal=backend-dsn=your-backend-dsn \
     --from-literal=frontend-dsn=your-frontend-dsn \
     -n password-manager
   ```

4. **Database Credentials**:
   ```bash
   kubectl create secret generic postgres-exporter-secret \
     --from-literal=data-source-name=postgresql://user:pass@host:5432/db \
     -n monitoring
   ```

## Troubleshooting

### Prometheus Not Scraping

1. Check ServiceMonitor/PodMonitor configuration
2. Verify pod annotations: `prometheus.io/scrape: "true"`
3. Check Prometheus logs: `kubectl logs -n monitoring -l app=prometheus`
4. Verify targets in Prometheus UI: http://localhost:9090/targets

### Alerts Not Firing

1. Check alert rules: `kubectl get prometheusrules -n monitoring`
2. Verify Alertmanager configuration
3. Check Alertmanager logs: `kubectl logs -n monitoring -l app=alertmanager`
4. Test alert manually in Prometheus UI

### Logs Not in Kibana

1. Check Filebeat: `kubectl get pods -n monitoring -l app=filebeat`
2. Check Logstash: `kubectl logs -n monitoring -l app=logstash`
3. Verify Elasticsearch: `curl http://localhost:9200/_cluster/health`
4. Check index patterns in Kibana

### Grafana Dashboards Empty

1. Verify Prometheus datasource in Grafana
2. Check Prometheus is collecting metrics
3. Review Grafana logs: `kubectl logs -n monitoring -l app=grafana`

## Maintenance

### Backup

```bash
# Backup Prometheus data
kubectl exec -n monitoring prometheus-xxx -- \
  tar czf /tmp/backup.tar.gz /prometheus
kubectl cp monitoring/prometheus-xxx:/tmp/backup.tar.gz ./backup.tar.gz

# Backup Grafana dashboards
# Export via Grafana UI or API
```

### Scale Components

```bash
# Scale Elasticsearch
kubectl scale statefulset elasticsearch -n monitoring --replicas=5

# Scale Logstash
kubectl scale deployment logstash -n monitoring --replicas=3
```

### Update Configuration

```bash
# Update Prometheus rules
kubectl apply -f ../k8s/prometheus-rules.yaml
kubectl rollout restart deployment/prometheus -n monitoring

# Update Grafana dashboards
kubectl apply -f ../k8s/grafana-dashboards.yaml
# Dashboards auto-reload
```

## Security

1. **Enable Authentication**: All endpoints require authentication
2. **Network Policies**: Restrict access to monitoring namespace
3. **Secrets Management**: Use external secrets manager
4. **RBAC**: Configure proper Kubernetes RBAC
5. **TLS**: Enable TLS for all communications

## Support

For detailed setup instructions, see [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md).

For issues:
- Check component logs
- Review Prometheus targets
- Verify Alertmanager status
- Check Grafana datasources
