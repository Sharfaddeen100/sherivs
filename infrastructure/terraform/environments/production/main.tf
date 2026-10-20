# CoreGrid Cloud Fabric — production environment composition (CF-4 … CF-7).
#
# This is the only root intended for `terraform apply` in production: it composes
# each provider root's *contract* (variables it needs, outputs it publishes)
# without copying their resources. Provider roots are applied in dependency order
# so a failure cannot half-build the fabric:
#
#   1. cloudflare      (DNS/LB/health exist first; nothing points anywhere yet)
#   2. oci             (network, cluster, pools, storage, secret gate)
#   3. hetzner         (worker capacity joins the cluster)
#   4. vultr           (edge capacity; origins registered with Cloudflare)
#   5. supabase        (data-layer configuration check + proof)
#
# Credentials: every TF_VAR_* below is supplied by the environment secret store;
# see infrastructure/CREDENTIALS.md. No value appears in this file.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.21"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }

  backend "s3" {}
}

locals {
  environment = "production"
  name_prefix = "coregrid"

  # Secret NAMES the fabric requires (values never appear in this repository).
  required_secret_names = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
  ]

  # Presence booleans injected by the environment: this root never sees a value,
  # only whether the name resolved. Absence fails the apply (fail closed).
  resolved_presence = {
    for name in local.required_secret_names : name => lookup(var.secret_presence, name, false)
  }
  unresolved_secrets = [
    for name in local.required_secret_names : name if !local.resolved_presence[name]
  ]

  common_tags = {
    "coregrid:environment" = local.environment
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
  }
}

# The provider roots below are composed as child modules and carry their own
# provider blocks, so Terraform forbids `depends_on` on them. The gate still
# holds: every precondition input is known at plan time, so a failing
# precondition fails the whole plan and nothing is applied.
resource "terraform_data" "environment_preconditions" {
  input = {
    environment           = local.environment
    required_secret_names = local.required_secret_names
    unresolved_count      = length(local.unresolved_secrets)
    operators             = var.operator_cidrs
  }

  lifecycle {
    precondition {
      condition     = length(local.unresolved_secrets) == 0
      error_message = "Production apply refused: ${length(local.unresolved_secrets)} required secret name(s) did not resolve. Supply them via the environment secret store (infrastructure/CREDENTIALS.md) — never in this repository."
    }
    precondition {
      condition     = length(var.operator_cidrs) > 0
      error_message = "At least one operator CIDR must be declared (administrative access is never open to the world)."
    }
  }
}

# ── 1. Global traffic layer ─────────────────────────────────────────────────
module "cloudflare" {
  source = "../../cloudflare"

  cloudflare_api_token  = var.cloudflare_api_token
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
  environment           = local.environment
  app_record_name       = var.app_record_name
  lb_hostname           = var.lb_hostname
  origin_hostname       = var.origin_hostname
  health_check_path     = var.health_check_path
  steering_policy       = var.steering_policy
  region_pools          = var.region_pools
  extra_tags            = local.common_tags
}

# ── 2. Primary infrastructure ───────────────────────────────────────────────
module "oci" {
  source = "../../oci"

  name_prefix                  = local.name_prefix
  environment                  = local.environment
  oci_tenancy_ocid             = var.oci_tenancy_ocid
  oci_user_ocid                = var.oci_user_ocid
  oci_fingerprint              = var.oci_fingerprint
  oci_private_key_path         = var.oci_private_key_path
  oci_region                   = var.oci_region
  oci_compartment_ocid         = var.oci_compartment_ocid
  oci_availability_domains     = var.oci_availability_domains
  oci_object_storage_namespace = var.oci_object_storage_namespace
  oci_kms_key_id               = var.oci_kms_key_id
  kubernetes_version           = var.kubernetes_version
  secret_presence              = var.secret_presence
  extra_tags                   = local.common_tags
}

# ── 3. Elastic compute fabric ───────────────────────────────────────────────
module "hetzner" {
  source = "../../hetzner"

  name_prefix            = local.name_prefix
  environment            = local.environment
  hetzner_token          = var.hetzner_token
  hetzner_ssh_public_key = var.hetzner_ssh_public_key
  worker_pool_name       = "workers-cpu"
  worker_floor           = var.worker_floor
  worker_server_type     = var.worker_server_type
  worker_image           = var.worker_image
  worker_location        = var.worker_location
  control_plane_cidr     = var.vcn_cidr
}

# ── 4. Global edge fabric ───────────────────────────────────────────────────
module "vultr" {
  source = "../../vultr"

  name_prefix   = local.name_prefix
  environment   = local.environment
  vultr_api_key = var.vultr_api_key
  edge_regions  = var.edge_regions
  edge_plan     = var.edge_plan
  edge_os_id    = var.edge_os_id
  operator_cidr = var.operator_cidrs[0]
}

# ── 5. Reality data layer ───────────────────────────────────────────────────
module "supabase" {
  source = "../../supabase"

  environment               = local.environment
  supabase_project_ref      = var.supabase_project_ref
  supabase_access_token     = var.supabase_access_token
  supabase_db_url           = var.supabase_db_url
  require_pitr              = true
  min_backup_retention_days = var.min_backup_retention_days
  proof_output_path         = "../../architecture/proofs/supabase-configuration.proof.json"
}
