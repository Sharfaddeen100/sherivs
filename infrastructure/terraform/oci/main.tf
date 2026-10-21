# CoreGrid Cloud Fabric — OCI root (CF-4).
#
# Creates the primary fabric: network, HA management cluster, system + platform
# node pools, storage buckets and the secret-presence gate.
#
#   terraform init -backend-config=../../environments/production/backend.hcl
#   terraform plan  -var-file=../../environments/production/terraform.tfvars
#
# No credential value appears here: the OCI provider reads TF_VAR_* supplied by the
# environment secret store (see infrastructure/CREDENTIALS.md).

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }

  backend "s3" {}
}

provider "oci" {
  tenancy_ocid     = var.oci_tenancy_ocid
  user_ocid        = var.oci_user_ocid
  fingerprint      = var.oci_fingerprint
  private_key      = var.oci_private_key
  region           = var.oci_region
  private_key_path = var.oci_private_key_path
}

module "network" {
  source = "../modules/network"

  name_prefix         = var.name_prefix
  environment         = var.environment
  compartment_ocid    = var.oci_compartment_ocid
  vcn_cidr            = var.vcn_cidr
  public_subnet_cidr  = var.public_subnet_cidr
  private_subnet_cidr = var.private_subnet_cidr
  extra_tags          = var.extra_tags
}

module "kubernetes" {
  source = "../modules/kubernetes"

  name_prefix        = var.name_prefix
  environment        = var.environment
  compartment_ocid   = var.oci_compartment_ocid
  vcn_id             = module.network.vcn_id
  private_subnet_id  = module.network.private_subnet_id
  public_subnet_id   = module.network.public_subnet_id
  kubernetes_version = var.kubernetes_version
  extra_tags         = var.extra_tags
}

module "system_pool" {
  source = "../modules/node_pool"

  name_prefix         = var.name_prefix
  environment         = var.environment
  compartment_ocid    = var.oci_compartment_ocid
  cluster_id          = module.kubernetes.cluster_id
  private_subnet_id   = module.network.private_subnet_id
  pool_name           = "system"
  kubernetes_version  = var.kubernetes_version
  node_shape          = var.system_node_shape
  ocpus               = var.system_ocpus
  memory_in_gbs       = var.system_memory_gbs
  min_size            = 3
  availability_domain = var.oci_availability_domains[0]
  extra_tags          = var.extra_tags
}

module "platform_pool" {
  source = "../modules/node_pool"

  name_prefix         = var.name_prefix
  environment         = var.environment
  compartment_ocid    = var.oci_compartment_ocid
  cluster_id          = module.kubernetes.cluster_id
  private_subnet_id   = module.network.private_subnet_id
  pool_name           = "platform"
  kubernetes_version  = var.kubernetes_version
  node_shape          = var.platform_node_shape
  ocpus               = var.platform_ocpus
  memory_in_gbs       = var.platform_memory_gbs
  min_size            = 3
  availability_domain = var.oci_availability_domains[1 % length(var.oci_availability_domains)]
  extra_tags          = var.extra_tags
}

module "storage" {
  source = "../modules/object_storage"

  name_prefix      = var.name_prefix
  environment      = var.environment
  compartment_ocid = var.oci_compartment_ocid
  namespace        = var.oci_object_storage_namespace
  kms_key_id       = var.oci_kms_key_id
  extra_tags       = var.extra_tags
}

module "secret_gate" {
  source = "../modules/secret_refs"

  environment           = var.environment
  required_secret_names = var.required_secret_names
  secret_presence       = var.secret_presence
}
