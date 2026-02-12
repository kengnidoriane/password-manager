# CloudFront CDN Module

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "password-manager-${var.environment}-oac"
  description                       = "Origin Access Control for Password Manager"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Password Manager ${var.environment} CDN"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = [var.domain_name]

  # ALB Origin
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Custom-Header"
      value = random_password.custom_header.result
    }
  }

  # Default Cache Behavior (Frontend)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Cache Behavior for API (No caching)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Cache Behavior for Static Assets
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 31536000
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom Error Responses
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Logging
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = false
      bucket          = var.logging_bucket
      prefix          = "cloudfront-${var.environment}/"
    }
  }

  tags = merge(
    {
      Name        = "password-manager-${var.environment}"
      Environment = var.environment
    },
    var.additional_tags
  )
}

# CloudFront Function for Security Headers
resource "aws_cloudfront_function" "security_headers" {
  name    = "password-manager-${var.environment}-security-headers"
  runtime = "cloudfront-js-1.0"
  comment = "Add security headers to responses"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var response = event.response;
      var headers = response.headers;
      
      // Security headers
      headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubDomains; preload' };
      headers['x-content-type-options'] = { value: 'nosniff' };
      headers['x-frame-options'] = { value: 'DENY' };
      headers['x-xss-protection'] = { value: '1; mode=block' };
      headers['referrer-policy'] = { value: 'no-referrer' };
      headers['permissions-policy'] = { value: 'geolocation=(), microphone=(), camera=()' };
      headers['content-security-policy'] = { 
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.pwnedpasswords.com; frame-ancestors 'none';" 
      };
      
      return response;
    }
  EOT
}

# Random password for custom header
resource "random_password" "custom_header" {
  length  = 32
  special = false
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "password-manager-${var.environment}-cdn-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "CloudFront 5xx error rate is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = {
    Name        = "password-manager-${var.environment}-cdn-error-rate"
    Environment = var.environment
  }
}
