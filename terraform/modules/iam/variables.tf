# IAM Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
  default     = ""
}

variable "oidc_provider_arn" {
  description = "OIDC provider ARN"
  type        = string
  default     = ""
}

variable "oidc_provider_url" {
  description = "OIDC provider URL"
  type        = string
  default     = ""
}

variable "backup_bucket_arn" {
  description = "Backup S3 bucket ARN"
  type        = string
}

variable "logs_bucket_arn" {
  description = "Logs S3 bucket ARN"
  type        = string
}

variable "enable_irsa" {
  description = "Enable IAM Roles for Service Accounts"
  type        = bool
  default     = true
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
