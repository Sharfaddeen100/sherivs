variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
  default     = "coregrid"
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "vultr_api_key" {
  description = "Vultr API key (supplied as TF_VAR_vultr_api_key)."
  type        = string
  sensitive   = true
}

variable "edge_regions" {
  description = "Regions that receive an edge node (e.g. jnb, ams, sg)."
  type        = list(string)
  default     = ["jnb", "ams", "sgp"]
}

variable "edge_plan" {
  description = "Vultr plan for edge nodes."
  type        = string
  default     = "vc2-2c-4gb"
}

variable "edge_os_id" {
  description = "Vultr OS id for edge nodes (pinned)."
  type        = number
  default     = 1743
}

variable "operator_cidr" {
  description = "Recorded operator CIDR allowed to reach administrative ports."
  type        = string
}
