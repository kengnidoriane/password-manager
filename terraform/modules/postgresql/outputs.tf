# PostgreSQL Module Outputs

output "endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "Database address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "master_username" {
  description = "Master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "master_password" {
  description = "Master password"
  value       = random_password.master_password.result
  sensitive   = true
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.rds.id
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${aws_db_instance.main.username}:${random_password.master_password.result}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}
