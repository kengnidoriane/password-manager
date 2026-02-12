# Monitoring Module Outputs

output "prometheus_endpoint" {
  description = "Prometheus server endpoint"
  value       = var.enable_prometheus ? "http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090" : ""
}

output "grafana_endpoint" {
  description = "Grafana dashboard endpoint"
  value       = var.enable_grafana ? "http://prometheus-grafana.monitoring.svc.cluster.local" : ""
}

output "grafana_admin_password" {
  description = "Grafana admin password"
  value       = random_password.grafana_admin.result
  sensitive   = true
}

output "alertmanager_endpoint" {
  description = "Alertmanager endpoint"
  value       = var.enable_alertmanager ? "http://prometheus-kube-prometheus-alertmanager.monitoring.svc.cluster.local:9093" : ""
}

output "loki_endpoint" {
  description = "Loki endpoint"
  value       = var.enable_loki ? "http://loki.monitoring.svc.cluster.local:3100" : ""
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.eks_cluster.name
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "grafana_secret_arn" {
  description = "Secrets Manager secret ARN for Grafana credentials"
  value       = aws_secretsmanager_secret.grafana_admin.arn
}
