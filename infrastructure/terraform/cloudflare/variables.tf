variable "cloudflare_api_token" {
  description = "Scoped Cloudflare API token (supplied as TF_VAR_cloudflare_api_token)."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Zone id for the CoreGrid root domain."
  type        = string
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "app_record_name" {
  description = "DNS record name inside the zone."
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
}

variable "health_check_path" {
  description = "Health probe path."
  type        = string
  default     = "/api/health"
}

variable "steering_policy" {
  description = "Traffic steering policy."
  type        = string
  default     = "dynamic_latency"
}

variable "region_pools" {
  description = "Region => origin mapping for residency-aware routing."
  type        = map(string)
  default     = {}
}

variable "extra_tags" {
  description = "Additional coregrid:* tags recorded on edge resources (Cloudflare comments/descriptions)."
  type        = map(string)
  default = {
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
  }
}
