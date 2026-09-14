variable "account_id" {
  description = "Cloudflare account identifier (not a secret, still not committed as a value)."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone identifier for the CoreGrid domain."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "app_record_name" {
  description = "Record name inside the zone (e.g. @ or app)."
  type        = string
  default     = "@"
}

variable "lb_hostname" {
  description = "Hostname served by the load balancer."
  type        = string
}

variable "origin_hostname" {
  description = "Primary origin hostname (never an IP literal)."
  type        = string

  validation {
    condition     = !can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$", var.origin_hostname))
    error_message = "Use a hostname for origins, not an IP literal."
  }
}

variable "health_check_path" {
  description = "Path the health monitor probes."
  type        = string
  default     = "/api/health"
}

variable "steering_policy" {
  description = "Traffic steering policy: off | geo | random | dynamic_latency | proximity."
  type        = string
  default     = "dynamic_latency"

  validation {
    condition     = contains(["off", "geo", "random", "dynamic_latency", "proximity"], var.steering_policy)
    error_message = "Unsupported steering policy."
  }
}

variable "region_pools" {
  description = "Region => pool mapping for residency-aware routing (empty disables regional steering)."
  type        = map(string)
  default     = {}
}

variable "extra_tags" {
  description = "Additional coregrid:* tags. Cloudflare expresses naming/tags through record comments and pool descriptions, so ownership travels there."
  type        = map(string)
  default = {
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
  }
}
