terraform {
  backend "s3" {
    bucket = "atithi-terraform-state-551626543871"
    key    = "frontend/terraform.tfstate"
    region = "ap-south-1"
  }
}
