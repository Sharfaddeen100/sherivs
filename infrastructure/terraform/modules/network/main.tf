# CoreGrid Cloud Fabric — reusable network module.
#
# Provider-agnostic *shape*: a private network, a public subnet, a private
# egress subnet, and a default-deny-friendly security boundary. Provider-specific
# resources live in each provider's root (blueprint §17, law 3).
#
# Domain-neutral by law: nothing here may mention a vertical's vocabulary.

locals {
  name_prefix = "${var.name_prefix}-${var.environment}"
  common_tags = merge(
    {
      "coregrid:environment" = var.environment
      "coregrid:owner-phase" = "21"
      "coregrid:managed-by"  = "terraform"
      "coregrid:component"   = "network"
    },
    var.extra_tags,
  )
}

resource "oci_core_vcn" "this" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${local.name_prefix}-vcn"
  dns_label      = substr(replace("${var.name_prefix}vcn", "-", ""), 0, 15)
  freeform_tags  = local.common_tags
}

resource "oci_core_internet_gateway" "this" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-igw"
  enabled        = true
  freeform_tags  = local.common_tags
}

resource "oci_core_nat_gateway" "this" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-nat"
  freeform_tags  = local.common_tags
}

resource "oci_core_service_gateway" "this" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-sgw"
  services {
    service_id = data.oci_core_services.this.services[0]["id"]
  }
  freeform_tags = local.common_tags
}

data "oci_core_services" "this" {
  filter {
    name   = "name"
    values = ["All .* Services In Oracle Services Network"]
    regex  = true
  }
}

# Public subnet: ingress only, for the edge of the cluster.
resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = var.public_subnet_cidr
  display_name               = "${local.name_prefix}-public"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  freeform_tags              = local.common_tags
}

# Private subnet: workloads and node pools; egress via NAT, never inbound from the internet.
resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = var.private_subnet_cidr
  display_name               = "${local.name_prefix}-private"
  dns_label                  = "private"
  route_table_id             = oci_core_route_table.private.id
  security_list_ids          = [oci_core_security_list.private.id]
  prohibit_public_ip_on_vnic = true
  freeform_tags              = local.common_tags
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-public-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.this.id
  }
  freeform_tags = local.common_tags
}

resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-private-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_nat_gateway.this.id
  }
  route_rules {
    destination       = data.oci_core_services.this.services[0]["cidr_block"]
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.this.id
  }
  freeform_tags = local.common_tags
}

# Default-deny: ingress is HTTPS/WireGuard only; node-to-node is internal.
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-public-sl"
  freeform_tags  = local.common_tags

  ingress_security_rules {
    description = "HTTPS from the global traffic layer"
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
  egress_security_rules {
    description = "egress to the private subnet only"
    protocol    = "all"
    destination = var.private_subnet_cidr
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${local.name_prefix}-private-sl"
  freeform_tags  = local.common_tags

  ingress_security_rules {
    description = "intra-VCN node and pod traffic"
    protocol    = "all"
    source      = var.vcn_cidr
  }
  ingress_security_rules {
    description = "control-plane API from the public subnet"
    protocol    = "6"
    source      = var.public_subnet_cidr
    tcp_options {
      min = 6443
      max = 6443
    }
  }
  egress_security_rules {
    description = "internet egress via NAT (no inbound path)"
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}
