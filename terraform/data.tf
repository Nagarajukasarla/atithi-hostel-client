# Read backend ALB details
data "aws_lb" "backend" {
  name = var.backend_alb_name
}

# Read backend ALB HTTP listener (port 80)
data "aws_lb_listener" "backend_http" {
  load_balancer_arn = data.aws_lb.backend.arn
  port              = 80
}

# Read backend target group
data "aws_lb_target_group" "backend_app" {
  name = var.backend_target_group_name
}
