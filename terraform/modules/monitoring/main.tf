# Monitoring Infrastructure Module

# Namespace for monitoring
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"

    labels = {
      name        = "monitoring"
      environment = var.environment
    }
  }
}

# Prometheus using Helm
resource "helm_release" "prometheus" {
  count = var.enable_prometheus ? 1 : 0

  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = var.prometheus_chart_version

  values = [
    yamlencode({
      prometheus = {
        prometheusSpec = {
          retention = "30d"
          storageSpec = {
            volumeClaimTemplate = {
              spec = {
                accessModes = ["ReadWriteOnce"]
                resources = {
                  requests = {
                    storage = var.prometheus_storage_size
                  }
                }
              }
            }
          }
          resources = {
            requests = {
              cpu    = "500m"
              memory = "2Gi"
            }
            limits = {
              cpu    = "2000m"
              memory = "4Gi"
            }
          }
        }
      }
      grafana = {
        enabled = var.enable_grafana
        adminPassword = random_password.grafana_admin.result
        persistence = {
          enabled = true
          size    = "10Gi"
        }
        ingress = {
          enabled = true
          hosts   = ["grafana-${var.environment}.${var.domain_name}"]
        }
      }
      alertmanager = {
        enabled = var.enable_alertmanager
        config = {
          global = {
            resolve_timeout = "5m"
          }
          route = {
            group_by        = ["alertname", "cluster", "service"]
            group_wait      = "10s"
            group_interval  = "10s"
            repeat_interval = "12h"
            receiver        = "default"
            routes = [
              {
                match = {
                  alertname = "Watchdog"
                }
                receiver = "null"
              }
            ]
          }
          receivers = [
            {
              name = "null"
            },
            {
              name = "default"
              email_configs = var.alert_email != "" ? [
                {
                  to = var.alert_email
                }
              ] : []
              slack_configs = var.slack_webhook_url != "" ? [
                {
                  api_url = var.slack_webhook_url
                  channel = "#alerts"
                }
              ] : []
            }
          ]
        }
      }
    })
  ]

  timeout = 600

  depends_on = [kubernetes_namespace.monitoring]
}

# Grafana admin password
resource "random_password" "grafana_admin" {
  length  = 16
  special = true
}

# Loki for log aggregation
resource "helm_release" "loki" {
  count = var.enable_loki ? 1 : 0

  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = var.loki_chart_version

  values = [
    yamlencode({
      loki = {
        persistence = {
          enabled = true
          size    = var.loki_storage_size
        }
        config = {
          limits_config = {
            retention_period = "744h" # 31 days
          }
        }
      }
      promtail = {
        enabled = true
      }
    })
  ]

  depends_on = [kubernetes_namespace.monitoring]
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.cluster_name}-logs"
    Environment = var.environment
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "password-manager-${var.environment}-alerts"

  tags = {
    Name        = "password-manager-${var.environment}-alerts"
    Environment = var.environment
  }
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "email" {
  count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "password-manager-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_node_count", { stat = "Average" }],
            [".", "cluster_node_count", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EKS Cluster Nodes"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseConnections", { stat = "Average" }],
            [".", "FreeableMemory", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            [".", "NetworkBytesIn", { stat = "Sum" }],
            [".", "NetworkBytesOut", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Redis Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}

# Store Grafana credentials in Secrets Manager
resource "aws_secretsmanager_secret" "grafana_admin" {
  name        = "password-manager/${var.environment}/grafana/admin-password"
  description = "Grafana admin password"

  tags = {
    Name        = "password-manager-${var.environment}-grafana-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "grafana_admin" {
  secret_id = aws_secretsmanager_secret.grafana_admin.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.grafana_admin.result
  })
}
