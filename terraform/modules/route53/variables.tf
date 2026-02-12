# Route53 Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  type        = string
}

variable "cloudfront_zone_id" {
  description = "CloudFront hosted zone ID"
  type        = string
}

variable "create_hosted_zone" {
  description = "Whether to create a new hosted zone"
  type        = bool
  default     = false
}

variable "existing_zone_id" {
  description = "Existing hosted zone ID (if not creating new)"
  type        = string
  default     = ""
}

variable "create_www_record" {
  description = "Create www subdomain record"
  type        = bool
  default     = true
}

variable "create_health_check" {
  description = "Create Route53 health check"
  type        = bool
  default     = true
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
