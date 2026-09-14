output "project_ref" {
  description = "Supabase project reference bound to this fabric."
  value       = var.supabase_project_ref
}

output "configuration_check_id" {
  description = "Identifier of the configuration check, for the change record."
  value       = terraform_data.configuration_check.id
}

output "proof_output_path" {
  description = "Where the configuration proof artifact is written."
  value       = var.proof_output_path
}
