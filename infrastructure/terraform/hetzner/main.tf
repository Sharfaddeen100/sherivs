# CoreGrid Cloud Fabric — Hetzner root (CF-5): elastic compute fabric.
#
# Workers are disposable, stateless and never hold tenant data. They join the
# management cluster (CF-4) as capacity, scaled by queue depth. Credentials come
# from `TF_VAR_hetzner_token` (environment secret store) — never committed.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }

  backend "s3" {}
}

provider "hcloud" {
  token = var.hetzner_token
}

resource "hcloud_ssh_key" "worker" {
  name       = "${var.name_prefix}-${var.environment}-worker"
  public_key = var.hetzner_ssh_public_key
}

resource "hcloud_network" "fabric" {
  name     = "${var.name_prefix}-${var.environment}-net"
  ip_range = var.worker_network_cidr
}

resource "hcloud_network_subnet" "workers" {
  network_id   = hcloud_network.fabric.id
  type         = "cloud"
  network_zone = var.worker_network_zone
  ip_range     = var.worker_subnet_cidr
}

# Default-deny: no inbound from the internet; egress is HTTPS/API only.
resource "hcloud_firewall" "workers" {
  name = "${var.name_prefix}-${var.environment}-workers"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "6443"
    source_ips = [var.control_plane_cidr]
    description = "worker join / API access from the private fabric"
  }

  rule {
    direction  = "out"
    protocol   = "tcp"
    port       = "443"
    destination_ips = ["0.0.0.0/0", "::/0"]
    description = "outbound APIs only"
  }
}

# Worker fleet. Declared envelope: floor 5, ceiling 500 (blueprint §5).
# Scaling itself is driven by queue depth (cluster autoscaler / KEDA), so this
# resource owns the floor and the placement, not the runtime count.
resource "hcloud_server" "worker" {
  count = var.worker_floor

  name        = "${var.name_prefix}-${var.environment}-worker-${count.index + 1}"
  server_type = var.worker_server_type
  image       = var.worker_image
  location    = var.worker_location
  ssh_keys    = [hcloud_ssh_key.worker.id]
  firewall_ids = [hcloud_firewall.workers.id]

  network {
    network_id = hcloud_network.fabric.id
    ip         = cidrhost(var.worker_subnet_cidr, count.index + 10)
  }

  labels = {
    "coregrid:environment" = var.environment
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
    "coregrid:component"   = "compute-worker"
    "coregrid:pool"        = var.worker_pool_name
  }

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }
}
