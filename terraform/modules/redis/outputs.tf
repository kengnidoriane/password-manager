# Redis Module Outputs

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "endpoint" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "configuration_endpoint" {
  description = "Configuration endpoint address"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = 6379
}

output "auth_token" {
  description = "Redis auth token"
  value       = random_password.auth_token.result
  sensitive   = true
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.redis.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
}

output "member_clusters" {
  description = "List of member cluster IDs"
  value       = aws_elasticache_replication_group.main.member_clusters
}
