# CoreGrid Cloud Fabric — managed Kubernetes baseline (OCI).
#
# One HA management cluster hosts the control plane and platform services; all
# workload capacity arrives as node pools from the node_pool module (blueprint §4).
#
# Law: the control plane is private. There is no public API endpoint; operators
# reach it through the operator path (bastion/VPN) recorded in the change record.

locals {
  cluster_tags = merge(
    {
      "coregrid:environment" = var.environment
      "coregrid:owner-phase" = "21"
      "coregrid:managed-by"  = "terraform"
      "coregrid:component"   = "kubernetes-control-plane"
    },
    var.extra_tags,
  )
}

resource "oci_containerengine_cluster" "this" {
  compartment_id     = var.compartment_ocid
  name               = "${var.name_prefix}-${var.environment}-cluster"
  vcn_id             = var.vcn_id
  kubernetes_version = var.kubernetes_version
  type               = "BASIC_CLUSTER"

  cluster_pod_network_options {
    cni_type = "OCI_VCN_IP_NATIVE"
  }

  endpoint_config {
    is_public_ip_enabled = false
    subnet_id            = var.private_subnet_id
  }

  options {
    service_lb_subnet_ids = [var.public_subnet_id]
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }
  }

  freeform_tags = local.cluster_tags
}
