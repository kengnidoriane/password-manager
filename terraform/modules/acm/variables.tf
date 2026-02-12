# ACM Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the certificate"
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
}

variable "validation_method" {
  description = "Certificate validation method"
  type        = string
  default     = "DNS"
}

variable "subject_alternative_names" {
  description = "Additional domain names for the certificate"
  type        = list(string)
  default     = []
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
