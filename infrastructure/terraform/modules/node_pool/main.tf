# CoreGrid Cloud Fabric — node pool module (any provider, one pool per call).
#
# A pool is capacity, never semantics: it carries labels/taints so workloads land
# where policy wants them, and an explicit autoscaling envelope so cost has a
# ceiling declared in code (blueprint §5, §19).

locals {
  pool_tags = merge(
    {
      "coregrid:environment" = var.environment
      "coregrid:owner-phase" = "21"
      "coregrid:managed-by"  = "terraform"
      "coregrid:component"   = "node-pool"
      "coregrid:pool"        = var.pool_name
    },
    var.extra_tags,
  )
}

resource "oci_containerengine_node_pool" "this" {
  compartment_id     = var.compartment_ocid
  cluster_id         = var.cluster_id
  name               = "${var.name_prefix}-${var.pool_name}"
  kubernetes_version = var.kubernetes_version
  node_shape         = var.node_shape

  node_config_details {
    size             = var.min_size
    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = var.private_subnet_id
    }
    node_pool_pod_network_option_details {
      cni_type = "OCI_VCN_IP_NATIVE"
    }
    freeform_tags = local.pool_tags
  }

  node_shape_config {
    ocpus         = var.ocpus
    memory_in_gbs = var.memory_in_gbs
  }

  dynamic "node_source_details" {
    for_each = var.node_image_id == null ? [] : [var.node_image_id]
    content {
      image_id    = node_source_details.value
      source_type = "IMAGE"
    }
  }

  initial_node_labels {
    key   = "coregrid.io/pool"
    value = var.pool_name
  }

  node_eviction_node_pool_settings {
    eviction_grace_duration = "PT1H"
    is_force_delete_after_grace_duration = false
  }

  freeform_tags = local.pool_tags
}
