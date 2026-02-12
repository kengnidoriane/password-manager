# Route53 Module Outputs

output "zone_id" {
  description = "Route53 hosted zone ID"
  value       = local.zone_id
}

output "name_servers" {
  description = "Name servers for the hosted zone"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : data.aws_route53_zone.existing[0].name_servers
}

output "zone_arn" {
  description = "Route53 hosted zone ARN"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].arn : data.aws_route53_zone.existing[0].arn
}

output "health_check_id" {
  description = "Health check ID"
  value       = var.create_health_check ? aws_route53_health_check.main[0].id : ""
}
