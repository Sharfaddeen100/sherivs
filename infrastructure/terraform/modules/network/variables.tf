variable "name_prefix" {
  description = "Resource name prefix (e.g. coregrid)."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be one of: dev, staging, production."
  }
}

variable "compartment_ocid" {
  description = "OCI compartment that owns the fabric network."
  type        = string
}

variable "vcn_cidr" {
  description = "VCN CIDR block."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet (cluster edge only)."
  type        = string
  default     = "10.20.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR for the private subnet (node pools and workloads)."
  type        = string
  default     = "10.20.11.0/24"
}

variable "extra_tags" {
  description = "Additional coregrid:* tags applied to every resource."
  type        = map(string)
  default     = {}
}
