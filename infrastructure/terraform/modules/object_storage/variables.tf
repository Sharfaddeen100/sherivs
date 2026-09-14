variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "compartment_ocid" {
  description = "Compartment that owns the buckets."
  type        = string
}

variable "namespace" {
  description = "Object storage namespace for the tenancy."
  type        = string
}

variable "kms_key_id" {
  description = "Customer-managed key for encryption at rest; null uses provider-managed keys."
  type        = string
  default     = null
}

variable "buckets" {
  description = "Buckets to create, keyed by storage class."
  type = map(object({
    storage_tier       = string
    versioning         = bool
    archive_after_days = number
    kms_key_id         = string
  }))
  default = {
    artifacts = {
      storage_tier       = "Standard"
      versioning         = true
      archive_after_days = 90
      kms_key_id         = null
    }
    documents = {
      storage_tier       = "Standard"
      versioning         = true
      archive_after_days = 365
      kms_key_id         = null
    }
    media = {
      storage_tier       = "Standard"
      versioning         = false
      archive_after_days = 180
      kms_key_id         = null
    }
    backups = {
      storage_tier       = "Standard"
      versioning         = true
      archive_after_days = 0
      kms_key_id         = null
    }
  }
}

variable "extra_tags" {
  description = "Additional coregrid:* tags."
  type        = map(string)
  default     = {}
}
