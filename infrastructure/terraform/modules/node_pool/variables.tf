variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "compartment_ocid" {
  description = "Compartment that owns the node pool."
  type        = string
}

variable "cluster_id" {
  description = "Managed cluster the pool joins."
  type        = string
}

variable "private_subnet_id" {
  description = "Private subnet for nodes (no public IPs)."
  type        = string
}

variable "pool_name" {
  description = "Logical pool name: system | platform | workers-cpu | workers-ai | sandbox | edge."
  type        = string

  validation {
    condition = contains(
      ["system", "platform", "workers-cpu", "workers-ai", "sandbox", "edge"],
      var.pool_name,
    )
    error_message = "pool_name must be one of the declared fabric pools."
  }
}

variable "kubernetes_version" {
  description = "Pinned Kubernetes version for the pool."
  type        = string
}

variable "node_shape" {
  description = "Provider node shape/instance type."
  type        = string
}

variable "node_image_id" {
  description = "Node image id; null uses the provider default for the version."
  type        = string
  default     = null
}

variable "ocpus" {
  description = "vCPUs per node."
  type        = number
  default     = 4
}

variable "memory_in_gbs" {
  description = "Memory per node in GiB."
  type        = number
  default     = 16
}

variable "min_size" {
  description = "Declared floor (5→500 elasticity is a value, not an architecture change)."
  type        = number
  default     = 1
}

variable "availability_domain" {
  description = "Availability domain for placement (spread pools across ADs)."
  type        = string
}

variable "extra_tags" {
  description = "Additional coregrid:* tags."
  type        = map(string)
  default     = {}
}
