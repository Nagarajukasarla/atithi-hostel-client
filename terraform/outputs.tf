output "cloudfront_domain_name" {
  description = "The public HTTPS domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution (used for cache invalidations)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket hosting frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "origin_verify_secret_name" {
  description = "SSM parameter path for the origin verification secret"
  value       = aws_ssm_parameter.origin_verify.name
}
