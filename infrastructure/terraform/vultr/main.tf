# CoreGrid Cloud Fabric — Vultr root (CF-6): global edge fabric.
#
# Regional, stateless edge capacity for latency-sensitive APIs and cache. DNS is
# owned by the Cloudflare root (single DNS authority); this root never creates
# DNS records. Credentials come from `TF_VAR_vultr_api_key`.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.21"
    }
  }

  backend "s3" {}
}

provider "vultr" {
  api_key = var.vultr_api_key
}

# Edge firewall: public HTTPS only; no administrative ports from the internet.
resource "vultr_firewall_group" "edge" {
  description = "${var.name_prefix}-${var.environment}-edge"
}

resource "vultr_firewall_rule" "https_in" {
  firewall_group_id = vultr_firewall_group.edge.id
  protocol          = "tcp"
  ip_type           = "v4"
  subnet            = "0.0.0.0"
  subnet_size       = 0
  port              = "443"
  notes             = "edge HTTPS from the global traffic layer"
}

resource "vultr_firewall_rule" "no_ssh_from_world" {
  firewall_group_id = vultr_firewall_group.edge.id
  protocol          = "tcp"
  ip_type           = "v4"
  subnet            = var.operator_cidr
  subnet_size       = tonumber(split("/", var.operator_cidr)[1])
  port              = "22"
  notes             = "operator access only, from the recorded operator CIDR"
}

# One edge node per configured region. Stateless: losing one is a capacity event.
resource "vultr_instance" "edge" {
  for_each = toset(var.edge_regions)

  label       = "${var.name_prefix}-${var.environment}-edge-${each.key}"
  region      = each.key
  plan        = var.edge_plan
  os_id       = var.edge_os_id
  hostname    = "${var.name_prefix}-edge-${each.key}"
  firewall_group_id = vultr_firewall_group.edge.id
  enable_ipv6 = true

  tags = [
    "coregrid:environment=${var.environment}",
    "coregrid:owner-phase=21",
    "coregrid:managed-by=terraform",
    "coregrid:component=edge",
    "coregrid:region=${each.key}",
  ]
}
