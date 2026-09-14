# Production composition variables.
#
# Every credential variable is `sensitive` and has NO default: a plan cannot run
# without the environment secret store supplying it. Identifier variables (zone
# ids, region lists, CIDRs) are owner decisions, not secrets.

# ── Owner decisions (identifiers) ───────────────────────────────────────────
variable "app_record_name" {
  description = "DNS record name inside the zone."
  type        = string
  default     = "@"
}

variable "lb_hostname" {
  description = "Hostname served by the global load balancer."
  type        = string
}

variable "origin_hostname" {
  description = "Primary origin hostname (never an IP literal)."
  type        = string
}

variable "health_check_path" {
  description = "Health probe path."
  type        = string
  default     = "/api/health"
}

variable "steering_policy" {
  description = "Traffic steering policy."
  type        = string
  default     = "dynamic_latency"
}

variable "region_pools" {
  description = "Region => origin mapping for residency-aware routing."
  type        = map(string)
  default     = {}
}

variable "operator_cidrs" {
  description = "CIDRs allowed to reach administrative ports (never open to the world)."
  type        = list(string)
  default     = []
}

variable "edge_regions" {
  description = "Regions receiving an edge node."
  type        = list(string)
  default     = ["jnb", "ams", "sgp"]
}

variable "edge_plan" {
  description = "Vultr plan for edge nodes."
  type        = string
  default     = "vc2-2c-4gb"
}

variable "edge_os_id" {
  description = "Vultr OS id for edge nodes."
  type        = number
  default     = 1743
}

variable "worker_floor" {
  description = "Declared floor of the worker fleet (elastic by queue depth)."
  type        = number
  default     = 5
}

variable "worker_server_type" {
  description = "Hetzner server type for workers."
  type        = string
  default     = "cpx31"
}

variable "worker_image" {
  description = "Pinned worker image."
  type        = string
  default     = "ubuntu-24.04"
}

variable "worker_location" {
  description = "Hetzner location for workers."
  type        = string
  default     = "fsn1"
}

variable "kubernetes_version" {
  description = "Pinned Kubernetes version."
  type        = string
  default     = "v1.30.1"
}

variable "vcn_cidr" {
  description = "Fabric VCN CIDR."
  type        = string
  default     = "10.20.0.0/16"
}

variable "oci_availability_domains" {
  description = "Availability domains used for HA placement."
  type        = list(string)
}

variable "oci_region" {
  description = "OCI home region."
  type        = string
}

variable "oci_compartment_ocid" {
  description = "Dedicated CoreGrid compartment."
  type        = string
}

variable "oci_object_storage_namespace" {
  description = "Object storage namespace for the tenancy."
  type        = string
}

variable "oci_kms_key_id" {
  description = "Customer-managed KMS key id (null = provider-managed)."
  type        = string
  default     = null
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone id."
  type        = string
}

variable "supabase_project_ref" {
  description = "Supabase project reference."
  type        = string
}

variable "min_backup_retention_days" {
  description = "Minimum accepted backup retention for production."
  type        = number
  default     = 7
}

# ── Credentials (sensitive, no defaults, supplied by the secret store) ───────
variable "oci_tenancy_ocid" {
  description = "OCI tenancy OCID."
  type        = string
  sensitive   = true
}

variable "oci_user_ocid" {
  description = "OCI automation user OCID."
  type        = string
  sensitive   = true
}

variable "oci_fingerprint" {
  description = "OCI API key fingerprint."
  type        = string
  sensitive   = true
}

variable "oci_private_key_path" {
  description = "Path to the OCI API private key mounted by the secret store."
  type        = string
  sensitive   = true
}

variable "hetzner_token" {
  description = "Hetzner project token."
  type        = string
  sensitive   = true
}

variable "hetzner_ssh_public_key" {
  description = "Public key for worker bootstrap."
  type        = string
}

variable "vultr_api_key" {
  description = "Vultr API key."
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Scoped Cloudflare API token."
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase management access token."
  type        = string
  sensitive   = true
}

variable "supabase_db_url" {
  description = "Supabase/PostgreSQL connection string for migrations and drills."
  type        = string
  sensitive   = true
}

# ── Secret PRESENCE flags (booleans only — never values) ────────────────────
variable "supabase_url_present" {
  description = "Whether SUPABASE_URL is present in the environment."
  type        = bool
  default     = false
}

variable "supabase_publishable_key_present" {
  description = "Whether SUPABASE_PUBLISHABLE_KEY is present."
  type        = bool
  default     = false
}

variable "supabase_service_role_key_present" {
  description = "Whether SUPABASE_SERVICE_ROLE_KEY is present."
  type        = bool
  default     = false
}

variable "supabase_db_url_present" {
  description = "Whether SUPABASE_DB_URL is present."
  type        = bool
  default     = false
}
