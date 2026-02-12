# CDN Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the CDN"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name as origin"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_logging" {
  description = "Enable CloudFront logging"
  type        = bool
  default     = true
}

variable "logging_bucket" {
  description = "S3 bucket for CloudFront logs"
  type        = string
  default     = ""
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
