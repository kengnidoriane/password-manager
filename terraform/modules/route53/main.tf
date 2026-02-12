# Route53 DNS Module

# Hosted Zone (create if needed)
resource "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 1 : 0

  name = var.domain_name

  tags = merge(
    {
      Name        = var.domain_name
      Environment = var.environment
    },
    var.additional_tags
  )
}

# Data source for existing zone
data "aws_route53_zone" "existing" {
  count = var.create_hosted_zone ? 0 : 1

  zone_id = var.existing_zone_id
}

# Local for zone ID
locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.existing[0].zone_id
}

# A Record for root domain (CloudFront)
resource "aws_route53_record" "root" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# AAAA Record for root domain (CloudFront IPv6)
resource "aws_route53_record" "root_ipv6" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# WWW subdomain (optional)
resource "aws_route53_record" "www" {
  count = var.create_www_record ? 1 : 0

  zone_id = local.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# Health Check for monitoring
resource "aws_route53_health_check" "main" {
  count = var.create_health_check ? 1 : 0

  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/v1/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name        = "password-manager-${var.environment}-health-check"
    Environment = var.environment
  }
}

# CloudWatch Alarm for health check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  count = var.create_health_check ? 1 : 0

  alarm_name          = "password-manager-${var.environment}-health-check"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Health check failed"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.main[0].id
  }

  tags = {
    Name        = "password-manager-${var.environment}-health-check-alarm"
    Environment = var.environment
  }
}
