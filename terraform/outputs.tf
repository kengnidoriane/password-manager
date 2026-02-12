# Infrastructure Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# EKS Cluster Outputs

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks_cluster.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks_cluster.cluster_endpoint
}

output "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = module.eks_cluster.cluster_version
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks_cluster.cluster_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA"
  value       = module.eks_cluster.oidc_provider_arn
}

# Database Outputs

output "postgresql_endpoint" {
  description = "PostgreSQL database endpoint"
  value       = module.postgresql.endpoint
  sensitive   = true
}

output "postgresql_port" {
  description = "PostgreSQL database port"
  value       = module.postgresql.port
}

output "postgresql_database_name" {
  description = "PostgreSQL database name"
  value       = module.postgresql.database_name
}

output "postgresql_master_username" {
  description = "PostgreSQL master username"
  value       = module.postgresql.master_username
  sensitive   = true
}

output "postgresql_master_password" {
  description = "PostgreSQL master password"
  value       = module.postgresql.master_password
  sensitive   = true
}

# Redis Outputs

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = module.redis.port
}

output "redis_configuration_endpoint" {
  description = "Redis configuration endpoint"
  value       = module.redis.configuration_endpoint
  sensitive   = true
}

# Load Balancer Outputs

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = module.alb.zone_id
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.alb.arn
}

# CDN Outputs

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cdn.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = module.cdn.cloudfront_zone_id
}

# DNS Outputs

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53.zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers"
  value       = module.route53.name_servers
}

output "application_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

# SSL Certificate Outputs

output "acm_certificate_arn" {
  description = "ACM certificate ARN for ALB"
  value       = module.acm.certificate_arn
}

output "acm_cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  value       = module.acm_cloudfront.certificate_arn
}

# Monitoring Outputs

output "prometheus_endpoint" {
  description = "Prometheus server endpoint"
  value       = module.monitoring.prometheus_endpoint
}

output "grafana_endpoint" {
  description = "Grafana dashboard endpoint"
  value       = module.monitoring.grafana_endpoint
}

output "grafana_admin_password" {
  description = "Grafana admin password"
  value       = module.monitoring.grafana_admin_password
  sensitive   = true
}

# S3 Outputs

output "backup_bucket_name" {
  description = "S3 backup bucket name"
  value       = module.s3_buckets.backup_bucket_name
}

output "logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = module.s3_buckets.logs_bucket_name
}

# IAM Outputs

output "backend_service_account_role_arn" {
  description = "IAM role ARN for backend service account"
  value       = module.iam.backend_service_account_role_arn
}

output "backup_service_account_role_arn" {
  description = "IAM role ARN for backup service account"
  value       = module.iam.backup_service_account_role_arn
}

# Kubeconfig Command

output "kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks_cluster.cluster_name}"
}
