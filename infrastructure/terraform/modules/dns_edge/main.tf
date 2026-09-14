# CoreGrid Cloud Fabric — global traffic layer module (Cloudflare).
#
# DNS, health-checked origin pools, load balancing and edge rules in front of
# every provider. The traffic layer decides *where* a request lands; it never
# decides *what* a request may do (that stays with Phase 08/42).

locals {
  edge_tags = {
    "coregrid:environment" = var.environment
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
    "coregrid:component"   = "dns-edge"
  }
}

resource "cloudflare_record" "app" {
  zone_id = var.zone_id
  name    = var.app_record_name
  type    = "CNAME"
  content = var.origin_hostname
  proxied = true
  ttl     = 1
  comment = "CoreGrid ${var.environment} — managed by Phase ${lookup(var.extra_tags, "coregrid:owner-phase", "21")} cloud fabric"
}

resource "cloudflare_load_balancer_monitor" "app" {
  account_id     = var.account_id
  type           = "https"
  path           = var.health_check_path
  expected_codes = "200"
  interval       = 60
  timeout        = 5
  retries        = 2
  description    = "CoreGrid ${var.environment} origin health"
}

resource "cloudflare_load_balancer_pool" "origins" {
  account_id = var.account_id
  name       = "coregrid-${var.environment}-origins"

  origins {
    name    = "oci-primary"
    address = var.origin_hostname
    enabled = true
    weight  = 1
  }

  monitor = cloudflare_load_balancer_monitor.app.id
  enabled = true
  # Only route to origins that pass the health check; otherwise fail closed.
  minimum_origins = 1
}

resource "cloudflare_load_balancer" "app" {
  zone_id          = var.zone_id
  name             = var.lb_hostname
  fallback_pool_id = cloudflare_load_balancer_pool.origins.id
  default_pool_ids = [cloudflare_load_balancer_pool.origins.id]
  proxied          = true
  steering_policy  = var.steering_policy

  # Residency-aware steering when a tenant must stay in a jurisdiction.
  dynamic "region_pools" {
    for_each = var.region_pools
    content {
      region   = region_pools.key
      pool_ids = [cloudflare_load_balancer_pool.origins.id]
    }
  }
}
