output "secret_names_checked" {
  description = "Secret names the gate verified (names only, never values)."
  value       = var.required_secret_names
}

output "secret_gate_id" {
  description = "Identifier of the presence gate, for change records."
  value       = terraform_data.secret_presence_gate.id
}
