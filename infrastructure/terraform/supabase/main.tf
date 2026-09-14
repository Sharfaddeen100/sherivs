# CoreGrid Cloud Fabric — Supabase root (CF-7): data layer settings as code.
#
# WHY THIS ROOT IS NOT A PILE OF MANAGED RESOURCES:
# Supabase is CoreGrid's *reality data layer*, and the project is already live.
# Rather than guess at provider resource shapes, this root (a) asserts the
# connection inputs exist, and (b) runs an idempotent, read-only CONFIGURATION
# CHECK against the project (backups, PITR/retention, network rules, RLS posture)
# using the Management API. When the check cannot run, the plan fails closed.
#
# Once the owner confirms the provider resource surface for project settings, the
# check is promoted to first-class resources WITHOUT changing any variable name —
# the contract here is the interface, not the provider.
#
# Credentials: TF_VAR_supabase_* / SUPABASE_* from the environment secret store.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  backend "s3" {}
}

resource "terraform_data" "connection_gate" {
  input = {
    environment = var.environment
    project_ref = var.supabase_project_ref
    # Ownership travels with the record, using the fabric's tag key.
    "coregrid:owner-phase" = "21"
    "coregrid:managed-by"  = "terraform"
  }

  lifecycle {
    precondition {
      condition = (
        var.supabase_project_ref != "" &&
        var.supabase_access_token != "" &&
        var.supabase_db_url != ""
      )
      error_message = "Supabase connection inputs are required (project ref, access token, database URL). Supply them through the environment secret store — see infrastructure/CREDENTIALS.md."
    }
  }
}

# Read-only configuration check. Fails the apply when the data layer does not meet
# the fabric's resilience posture (no backup window, no PITR, open network rules).
resource "terraform_data" "configuration_check" {
  depends_on = [terraform_data.connection_gate]

  input = {
    environment = var.environment
    project_ref = var.supabase_project_ref
    require_pitr = var.require_pitr
    max_backup_retention_days = var.min_backup_retention_days
  }

  provisioner "local-exec" {
    command = "node ${path.module}/../../scripts/infrastructure/supabase-config-check.mjs"

    environment = {
      SUPABASE_PROJECT_REF       = var.supabase_project_ref
      SUPABASE_ACCESS_TOKEN      = var.supabase_access_token
      SUPABASE_DB_URL            = var.supabase_db_url
      COREGRID_ENVIRONMENT       = var.environment
      COREGRID_REQUIRE_PITR      = var.require_pitr ? "true" : "false"
      COREGRID_MIN_BACKUP_DAYS   = tostring(var.min_backup_retention_days)
      COREGRID_CONFIG_PROOF      = var.proof_output_path
    }
  }
}
