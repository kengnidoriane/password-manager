# CDN Module Outputs

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "custom_header_value" {
  description = "Custom header value for origin verification"
  value       = random_password.custom_header.result
  sensitive   = true
}
