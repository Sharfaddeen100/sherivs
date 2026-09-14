variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
  default     = "coregrid"
}

variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "hetzner_token" {
  description = "Hetzner project-scoped API token (supplied as TF_VAR_hetzner_token)."
  type        = string
  sensitive   = true
}

variable "hetzner_ssh_public_key" {
  description = "Public key used to bootstrap workers (never a private key)."
  type        = string
}

variable "worker_pool_name" {
  description = "Logical pool: workers-cpu | workers-ai | sandbox."
  type        = string
  default     = "workers-cpu"

  validation {
    condition     = contains(["workers-cpu", "workers-ai", "sandbox"], var.worker_pool_name)
    error_message = "worker_pool_name must be workers-cpu, workers-ai or sandbox."
  }
}

variable "worker_floor" {
  description = "Declared floor of the worker fleet (elastic 5→500 by queue depth)."
  type        = number
  default     = 5
}

variable "worker_server_type" {
  description = "Hetzner server type for workers."
  type        = string
  default     = "cpx31"
}

variable "worker_image" {
  description = "Base image for workers (pinned by name+version, never 'latest')."
  type        = string
  default     = "ubuntu-24.04"

  validation {
    condition     = !strcontains(var.worker_image, "latest")
    error_message = "'latest' images are forbidden; pin the image."
  }
}

variable "worker_location" {
  description = "Hetzner location."
  type        = string
  default     = "fsn1"
}

variable "worker_network_cidr" {
  description = "Private network CIDR for the worker fleet."
  type        = string
  default     = "10.30.0.0/16"
}

variable "worker_subnet_cidr" {
  description = "Subnet CIDR inside the worker network."
  type        = string
  default     = "10.30.1.0/24"
}

variable "worker_network_zone" {
  description = "Hetzner network zone for the subnet."
  type        = string
  default     = "eu-central"
}

variable "control_plane_cidr" {
  description = "CIDR allowed to reach the worker join/API endpoint (the OCI fabric)."
  type        = string
  default     = "10.20.0.0/16"
}
