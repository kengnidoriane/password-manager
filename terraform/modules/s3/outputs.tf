# S3 Module Outputs

output "backup_bucket_name" {
  description = "Backup bucket name"
  value       = aws_s3_bucket.backup.id
}

output "backup_bucket_arn" {
  description = "Backup bucket ARN"
  value       = aws_s3_bucket.backup.arn
}

output "logs_bucket_name" {
  description = "Logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "Logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_domain_name" {
  description = "Logs bucket domain name"
  value       = aws_s3_bucket.logs.bucket_domain_name
}
