# CoreGrid Cloud Fabric — region & residency inventory (Phase 21 substrates).
#
# Phase 21 names three substrates: "region records", "environment registrations"
# and "placement policy". This file makes the FIRST of them concrete, so that
# residency is declared data rather than implied by whichever region string
# happened to be typed into a variable.
#
# LAWS (machine-checked by verify:infrastructure):
#   1. every region referenced anywhere in the fabric is declared here;
#   2. every declared region states a jurisdiction and a sovereignty flag;
#   3. a region that is not `permitted_for_tenancy_data` can never host tenant
#      data — placement fails closed instead of degrading residency;
#   4. region identifiers are unique per provider.

locals {
  # Region records. `sovereign` means the provider operates the region under the
  # jurisdiction's control requirements; `permitted_for_tenancy_data` is the
  # residency gate placement policy consults (Phase 21 §Q/§R).
  coregrid_region_records = {
    # ── Primary fabric (OCI) ────────────────────────────────────────────────
    "oci:eu-frankfurt-1" = {
      provider                  = "oci"
      geographical_area         = "europe"
      jurisdiction              = "EU"
      sovereign                 = false
      permitted_for_tenancy_data = true
      role                      = "primary-control-plane"
    }
    "oci:uk-london-1" = {
      provider                   = "oci"
      geographical_area          = "europe"
      jurisdiction               = "GB"
      sovereign                  = false
      permitted_for_tenancy_data = true
      role                       = "primary-secondary"
    }
    "oci:af-johannesburg-1" = {
      provider                   = "oci"
      geographical_area          = "africa"
      jurisdiction               = "ZA"
      sovereign                  = false
      permitted_for_tenancy_data = true
      role                       = "regional-primary"
    }

    # ── Elastic compute fabric (Hetzner) ───────────────────────────────────
    "hetzner:fsn1" = {
      provider                   = "hetzner"
      geographical_area          = "europe"
      jurisdiction               = "DE"
      sovereign                  = false
      permitted_for_tenancy_data = false # compute only: workers never hold tenant data
      role                       = "worker-pool"
    }
    "hetzner:nbg1" = {
      provider                   = "hetzner"
      geographical_area          = "europe"
      jurisdiction               = "DE"
      sovereign                  = false
      permitted_for_tenancy_data = false
      role                       = "worker-pool"
    }

    # ── Global edge fabric (Vultr) ─────────────────────────────────────────
    "vultr:jnb" = {
      provider                   = "vultr"
      geographical_area          = "africa"
      jurisdiction               = "ZA"
      sovereign                  = false
      permitted_for_tenancy_data = false # edge is stateless: cache and latency only
      role                       = "edge"
    }
    "vultr:ams" = {
      provider                   = "vultr"
      geographical_area          = "europe"
      jurisdiction               = "NL"
      sovereign                  = false
      permitted_for_tenancy_data = false
      role                       = "edge"
    }
    "vultr:sgp" = {
      provider                   = "vultr"
      geographical_area          = "asia"
      jurisdiction               = "SG"
      sovereign                  = false
      permitted_for_tenancy_data = false
      role                       = "edge"
    }
  }

  # Residency policy names which region records may host tenant data (Phase 21 §Q).
  coregrid_placement_policy = {
    tenant_data_regions = [
      for id, record in local.coregrid_region_records : id
      if record.permitted_for_tenancy_data
    ]
    stateless_regions = [
      for id, record in local.coregrid_region_records : id
      if !record.permitted_for_tenancy_data
    ]
  }
}

output "coregrid_region_records" {
  description = "Region records consumed by placement policy (data, not code)."
  value       = local.coregrid_region_records
}

output "coregrid_tenant_data_regions" {
  description = "Regions permitted to hold tenant data — the residency gate."
  value       = local.coregrid_placement_policy.tenant_data_regions
}
