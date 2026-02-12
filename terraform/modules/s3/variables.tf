# S3 Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "backup_bucket" {
  description = "Name of the backup bucket"
  type        = string
}

variable "logs_bucket" {
  description = "Name of the logs bucket"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning for backup bucket"
  type        = bool
  default     = true
}

variable "logs_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "lifecycle_rules" {
  description = "Lifecycle rules for backup bucket"
  type = list(object({
    id                       = string
    enabled                  = bool
    expiration_days          = number
    transition_days          = number
    transition_storage_class = string
  }))
  default = []
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
