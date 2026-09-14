variable "environment" {
  description = "Environment name: dev | staging | production."
  type        = string
}

variable "supabase_project_ref" {
  description = "Supabase project reference (identifier, not a secret)."
  type        = string
}

variable "supabase_access_token" {
  description = "Supabase management access token (supplied as TF_VAR_supabase_access_token)."
  type        = string
  sensitive   = true
}

variable "supabase_db_url" {
  description = "PostgreSQL connection string used for migrations and restore drills."
  type        = string
  sensitive   = true
}

variable "require_pitr" {
  description = "Require point-in-time recovery in production."
  type        = bool
  default     = true
}

variable "min_backup_retention_days" {
  description = "Minimum accepted backup retention window."
  type        = number
  default     = 7
}

variable "proof_output_path" {
  description = "Where the configuration-check proof artifact is written."
  type        = string
  default     = "../../architecture/proofs/supabase-configuration.proof.json"
}
