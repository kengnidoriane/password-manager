# ALB Module Outputs

output "arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = aws_lb_target_group.backend.arn
}

output "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  value       = aws_lb_target_group.frontend.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = aws_lb_listener.https.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : ""
}
