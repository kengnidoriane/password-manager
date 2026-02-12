# ACM Module Outputs

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "certificate_id" {
  description = "ACM certificate ID"
  value       = aws_acm_certificate.main.id
}

output "domain_name" {
  description = "Domain name"
  value       = aws_acm_certificate.main.domain_name
}

output "domain_validation_options" {
  description = "Domain validation options"
  value       = aws_acm_certificate.main.domain_validation_options
}
