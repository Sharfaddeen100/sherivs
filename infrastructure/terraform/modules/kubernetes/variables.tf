variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "compartment_ocid" {
  description = "Compartment that owns the cluster."
  type        = string
}

variable "vcn_id" {
  description = "VCN the cluster is created in."
  type        = string
}

variable "private_subnet_id" {
  description = "Private subnet for the control-plane endpoint and nodes."
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet used for service load balancers."
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version (pinned; never 'latest')."
  type        = string
  default     = "v1.30.1"

  validation {
    condition     = can(regex("^v[0-9]+\\.[0-9]+\\.[0-9]+$", var.kubernetes_version))
    error_message = "kubernetes_version must be pinned, e.g. v1.30.1 (never 'latest')."
  }
}

variable "extra_tags" {
  description = "Additional coregrid:* tags."
  type        = map(string)
  default     = {}
}
