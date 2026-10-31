variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "ap-south-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for frontend static assets"
  type        = string
  default     = "atithi-frontend-551626543871"
}

variable "backend_alb_name" {
  description = "Name of the existing backend ALB"
  type        = string
  default     = "atithi-dev-alb"
}

variable "backend_target_group_name" {
  description = "Name of the existing backend target group"
  type        = string
  default     = "atithi-dev-app-tg"
}
