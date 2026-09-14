# CoreGrid Cloud Fabric — storage fabric module.
#
# Buckets carry the fabric's storage classes: artifacts (AI), media, documents and
# backups. Every bucket is private, versioned, encrypted at rest, and lifecycle
# managed so cold data does not silently inflate cost (blueprint §7, §19).
#
# Tenant scoping is enforced by policy at the application boundary (prefix +
# signed URL); the bucket itself is never public and never shared across tenancies.

locals {
  storage_tags = merge(
    {
      "coregrid:environment" = var.environment
      "coregrid:owner-phase" = "21"
      "coregrid:managed-by"  = "terraform"
      "coregrid:component"   = "storage"
    },
    var.extra_tags,
  )
}

resource "oci_objectstorage_bucket" "this" {
  for_each = var.buckets

  compartment_id        = var.compartment_ocid
  namespace             = var.namespace
  name                  = "${var.name_prefix}-${var.environment}-${each.key}"
  access_type           = "NoPublicAccess"
  storage_tier          = each.value.storage_tier
  versioning            = each.value.versioning ? "Enabled" : "Disabled"
  kms_key_id            = each.value.kms_key_id
  object_events_enabled = true
  freeform_tags         = merge(local.storage_tags, { "coregrid:storage-class" = each.key })
}

# Lifecycle: archive cold objects instead of deleting them; destroy only on request.
resource "oci_objectstorage_object_lifecycle_policy" "this" {
  for_each = { for name, cfg in var.buckets : name => cfg if cfg.archive_after_days > 0 }

  namespace = var.namespace
  bucket    = oci_objectstorage_bucket.this[each.key].name

  rules {
    name        = "archive-cold-objects"
    action      = "ARCHIVE"
    time_amount = each.value.archive_after_days
    time_unit   = "DAYS"
    is_enabled  = true
    target      = "objects"
  }
}
