# Redis Module Variables

variable "environment" {
  description = "Environment name"
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

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 5
}

variable "snapshot_window" {
  description = "Daily time range for snapshots"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Weekly time range for maintenance"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "allowed_security_groups" {
  description = "List of security group IDs allowed to access Redis"
  type        = list(string)
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
