# ALB Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "enable_access_logs" {
  description = "Enable access logs"
  type        = bool
  default     = true
}

variable "access_logs_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = false
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
