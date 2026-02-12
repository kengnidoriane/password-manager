# IAM Module Outputs

output "backend_service_account_role_arn" {
  description = "Backend service account IAM role ARN"
  value       = var.enable_irsa ? aws_iam_role.backend_service_account[0].arn : ""
}

output "backup_service_account_role_arn" {
  description = "Backup service account IAM role ARN"
  value       = var.enable_irsa ? aws_iam_role.backup_service_account[0].arn : ""
}

output "cluster_autoscaler_role_arn" {
  description = "Cluster autoscaler IAM role ARN"
  value       = var.enable_irsa ? aws_iam_role.cluster_autoscaler[0].arn : ""
}

output "aws_load_balancer_controller_role_arn" {
  description = "AWS Load Balancer Controller IAM role ARN"
  value       = var.enable_irsa ? aws_iam_role.aws_load_balancer_controller[0].arn : ""
}
