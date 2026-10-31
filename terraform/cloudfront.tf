# CloudFront Function for SPA client-side routing (rewrites non-asset paths to /index.html)
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "atithi-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite SPA routes to index.html while preserving API errors"
  publish = true
  code    = <<-EOT
    function handler(event) {
        var request = event.request;
        var uri = request.uri;
        
        // If URI does not contain a file extension, rewrite to /index.html
        if (!uri.includes('.')) {
            request.uri = '/index.html';
        }
        
        return request;
    }
  EOT
}

# Origin Access Control (OAC) for S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "atithi-frontend-oac"
  description                       = "OAC for Atithi Frontend S3 Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  s3_origin_id  = "S3-${aws_s3_bucket.frontend.id}"
  alb_origin_id = "ALB-${data.aws_lb.backend.name}"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Atithi Production Frontend Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"

  # -------------------------------------------------------------
  # Origin 1: S3 Bucket (Private Static SPA Assets)
  # -------------------------------------------------------------
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # -------------------------------------------------------------
  # Origin 2: Backend ALB (Spring Boot API)
  # -------------------------------------------------------------
  origin {
    domain_name = data.aws_lb.backend.dns_name
    origin_id   = local.alb_origin_id

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "http-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 60
      origin_keepalive_timeout = 5
    }

    # Inject secret header to satisfy backend ALB security check
    custom_header {
      name  = "X-Origin-Verify"
      value = random_password.origin_verify.result
    }
  }

  # -------------------------------------------------------------
  # Default Cache Behavior (/*) -> S3
  # -------------------------------------------------------------
  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # AWS Managed CachingOptimized Policy ID
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # CloudFront Function for SPA rewrite
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  # -------------------------------------------------------------
  # API Cache Behavior (/api/*) -> Backend ALB (No Cache + All Viewer Headers)
  # -------------------------------------------------------------
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = local.alb_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    # AWS Managed CachingDisabled Policy ID
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    # AWS Managed AllViewerExceptHostHeader Origin Request Policy ID
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  # -------------------------------------------------------------
  # Actuator Cache Behavior (/actuator/*) -> Backend ALB
  # -------------------------------------------------------------
  ordered_cache_behavior {
    path_pattern           = "/actuator/*"
    target_origin_id       = local.alb_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "atithi-frontend-cdn"
  }
}
