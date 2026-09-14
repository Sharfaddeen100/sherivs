# OCI root variables. Secret-grade values are `sensitive` and supplied as
# TF_VAR_* from the environment secret store; none has a committed default.

variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
  default     = "coregrid"
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

# ── Credentials (never committed; supplied by the platform secret store) ──────
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
  description = "API key fingerprint."
  type        = string
  sensitive   = true
}

variable "oci_private_key" {
  description = "API private key material (PEM). Prefer oci_private_key_path when possible."
  type        = string
  sensitive   = true
  default     = null
}

variable "oci_private_key_path" {
  description = "Path to the API private key file, mounted by the secret store at apply time."
  type        = string
  sensitive   = true
  default     = null
}

variable "oci_region" {
  description = "OCI home region (owner decision)."
  type        = string
}

variable "oci_compartment_ocid" {
  description = "Dedicated CoreGrid compartment OCID."
  type        = string
}

variable "oci_availability_domains" {
  description = "Availability domains used for HA placement."
  type        = list(string)

  validation {
    condition     = length(var.oci_availability_domains) > 0
    error_message = "At least one availability domain is required (HA prefers two or more)."
  }
}

variable "oci_object_storage_namespace" {
  description = "Object storage namespace for the tenancy."
  type        = string
}

variable "oci_kms_key_id" {
  description = "Customer-managed KMS key for storage/backup encryption (null = provider-managed)."
  type        = string
  default     = null
}

# ── Fabric shape ─────────────────────────────────────────────────────────────
variable "vcn_cidr" {
  description = "VCN CIDR."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR."
  type        = string
  default     = "10.20.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Private subnet CIDR."
  type        = string
  default     = "10.20.11.0/24"
}

variable "kubernetes_version" {
  description = "Pinned Kubernetes version."
  type        = string
  default     = "v1.30.1"
}

variable "system_node_shape" {
  description = "Node shape for the system pool."
  type        = string
  default     = "VM.Standard.E5.Flex"
}

variable "system_ocpus" {
  description = "vCPUs per system node."
  type        = number
  default     = 2
}

variable "system_memory_gbs" {
  description = "GiB per system node."
  type        = number
  default     = 16
}

variable "platform_node_shape" {
  description = "Node shape for the platform pool."
  type        = string
  default     = "VM.Standard.E5.Flex"
}

variable "platform_ocpus" {
  description = "vCPUs per platform node."
  type        = number
  default     = 8
}

variable "platform_memory_gbs" {
  description = "GiB per platform node."
  type        = number
  default     = 64
}

variable "required_secret_names" {
  description = "Secret names the gate asserts before anything is created."
  type        = list(string)
  default = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
  ]
}

variable "secret_presence" {
  description = "Map of secret NAME => presence, populated by the caller/environment."
  type        = map(bool)
  default     = {}
}

variable "extra_tags" {
  description = "Additional coregrid:* tags."
  type        = map(string)
  default     = {}
}
