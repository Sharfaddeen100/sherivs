# CoreGrid Cloud Fabric — secret REFERENCES module.
#
# This module deliberately creates NO secret values. It asserts that the expected
# secret *names* are present in the execution environment (GitHub Environment /
# secret manager injected), and records a reference contract for the workloads.
#
# Law (blueprint §17, law 1): values never appear in IaC, manifests, plans or
# state. If a value is missing, this module FAILS the plan — fail closed, never
# "deploy and hope".

locals {
  # Names only — never values. Keep this list in sync with infrastructure/CREDENTIALS.md.
  required_secret_names = var.required_secret_names
  missing               = [for name in local.required_secret_names : name if lookup(var.secret_presence, name, false) == false]
}

resource "terraform_data" "secret_presence_gate" {
  input = {
    environment = var.environment
    checked     = local.required_secret_names
    missing     = local.missing
  }

  lifecycle {
    precondition {
      condition     = length(local.missing) == 0
      error_message = "Missing required secrets for ${var.environment}: ${join(", ", local.missing)}. Supply them via the environment secret store (see infrastructure/CREDENTIALS.md). No values belong in this repository."
    }
  }
}
