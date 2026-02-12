# Global Variables

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "password-manager"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
}

variable "create_hosted_zone" {
  description = "Whether to create a new Route53 hosted zone"
  type        = bool
  default     = false
}

variable "existing_zone_id" {
  description = "Existing Route53 hosted zone ID (if not creating new)"
  type        = string
  default     = ""
}

# VPC Variables

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# EKS Cluster Variables

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    desired_size   = number
    min_size       = number
    max_size       = number
    instance_types = list(string)
    capacity_type  = string
    disk_size      = number
  }))
  default = {
    general = {
      desired_size   = 3
      min_size       = 2
      max_size       = 10
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 50
    }
  }
}

# Database Variables

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "passwordmanager"
}

variable "database_master_username" {
  description = "Master username for PostgreSQL"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "database_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "database_backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

# Redis Variables

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 2
}

# CDN Variables

variable "cdn_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cdn_price_class)
    error_message = "Price class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

# Monitoring Variables

variable "alert_email" {
  description = "Email address for monitoring alerts"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

# S3 Variables

variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules for backup retention"
  type = list(object({
    id                     = string
    enabled                = bool
    expiration_days        = number
    transition_days        = number
    transition_storage_class = string
  }))
  default = [
    {
      id                       = "backup-lifecycle"
      enabled                  = true
      expiration_days          = 90
      transition_days          = 30
      transition_storage_class = "STANDARD_IA"
    }
  ]
}

# Tags

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
