# Monitoring Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for Grafana ingress"
  type        = string
  default     = ""
}

variable "enable_prometheus" {
  description = "Enable Prometheus"
  type        = bool
  default     = true
}

variable "enable_grafana" {
  description = "Enable Grafana"
  type        = bool
  default     = true
}

variable "enable_alertmanager" {
  description = "Enable Alertmanager"
  type        = bool
  default     = true
}

variable "enable_loki" {
  description = "Enable Loki for log aggregation"
  type        = bool
  default     = true
}

variable "prometheus_chart_version" {
  description = "Prometheus Helm chart version"
  type        = string
  default     = "51.0.0"
}

variable "loki_chart_version" {
  description = "Loki Helm chart version"
  type        = string
  default     = "2.9.0"
}

variable "prometheus_storage_size" {
  description = "Prometheus storage size"
  type        = string
  default     = "50Gi"
}

variable "loki_storage_size" {
  description = "Loki storage size"
  type        = string
  default     = "30Gi"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
