variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "required_secret_names" {
  description = "Secret NAMES that must exist in the execution environment (never values)."
  type        = list(string)
  default = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
  ]

  validation {
    condition     = length(var.required_secret_names) > 0
    error_message = "At least one required secret name must be declared."
  }
}

variable "secret_presence" {
  description = "Map of secret NAME => whether it is present in the environment. Populated by the caller from the runtime environment, never from a file in this repository."
  type        = map(bool)
  default     = {}
  sensitive   = false
}
