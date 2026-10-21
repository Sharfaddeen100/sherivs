# The dns_edge module uses the official Cloudflare provider. Without this block
# Terraform assumes the legacy "hashicorp/cloudflare" address, which does not exist.
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }
}
