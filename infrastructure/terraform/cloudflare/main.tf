# CoreGrid Cloud Fabric — Cloudflare root (global traffic layer).
#
# Single DNS authority for the fabric: DNS, health checks, load balancing, CDN,
# WAF/rulesets and DDoS protection in front of OCI (primary), Hetzner (compute)
# and Vultr (edge). Credentials come from `TF_VAR_cloudflare_api_token` (scoped
# token — never a Global API Key).

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }

  backend "s3" {}
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "dns_edge" {
  source = "../modules/dns_edge"

  account_id        = var.cloudflare_account_id
  zone_id           = var.cloudflare_zone_id
  environment       = var.environment
  app_record_name   = var.app_record_name
  lb_hostname       = var.lb_hostname
  origin_hostname   = var.origin_hostname
  health_check_path = var.health_check_path
  steering_policy   = var.steering_policy
  region_pools      = var.region_pools
  extra_tags        = var.extra_tags
}
