# Generate a cryptographically secure 32-character secret token
resource "random_password" "origin_verify" {
  length  = 32
  special = false
}

# Store origin verification secret in AWS SSM Parameter Store for secure auditing
resource "aws_ssm_parameter" "origin_verify" {
  name        = "/atithi/origin-verify-secret"
  description = "Shared secret header between CloudFront and ALB to protect backend"
  type        = "SecureString"
  value       = random_password.origin_verify.result

  tags = {
    Name = "atithi-origin-verify-secret"
  }
}

# Rule 1 (Priority 10): Forward requests with valid X-Origin-Verify header to backend target group
resource "aws_lb_listener_rule" "allow_cloudfront" {
  listener_arn = data.aws_lb_listener.backend_http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = data.aws_lb_target_group.backend_app.arn
  }

  condition {
    http_header {
      http_header_name = "X-Origin-Verify"
      values           = [random_password.origin_verify.result]
    }
  }
}

# Rule 2 (Priority 20): Allow health check path for ECS/ALB monitoring and backend CD smoke tests
resource "aws_lb_listener_rule" "allow_health" {
  listener_arn = data.aws_lb_listener.backend_http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = data.aws_lb_target_group.backend_app.arn
  }

  condition {
    path_pattern {
      values = ["/actuator/health"]
    }
  }
}

# Rule 3 (Priority 500): Reject all direct unauthorized API requests to the ALB
resource "aws_lb_listener_rule" "block_unauthorized_api" {
  listener_arn = data.aws_lb_listener.backend_http.arn
  priority     = 500

  action {
    type = "fixed-response"

    fixed_response {
      content_type = "application/json"
      message_body = "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Direct access to backend is restricted. Requests must route through Atithi Frontend.\"}"
      status_code  = "403"
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
