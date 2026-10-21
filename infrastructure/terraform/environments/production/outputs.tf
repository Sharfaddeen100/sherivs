output "environment" {
  description = "Composed environment name."
  value       = local.environment
}

output "missing_secrets" {
  description = "Required secrets still absent at plan time (must be empty to apply)."
  value       = local.unresolved_secrets
}

output "cluster_id" {
  description = "Management cluster id from the primary provider."
  value       = module.oci.cluster_id
}

output "cluster_endpoint" {
  description = "Private control-plane endpoint (operator access only)."
  value       = module.oci.cluster_endpoint
}

output "buckets" {
  description = "Storage buckets created."
  value       = module.oci.bucket_names
}

output "worker_ids" {
  description = "Elastic worker ids."
  value       = module.hetzner.worker_ids
}

output "edge_public_ips" {
  description = "Edge origins to register with the traffic layer."
  value       = module.vultr.edge_public_ips
}

output "traffic_origin_pool_id" {
  description = "Cloudflare origin pool id."
  value       = module.cloudflare.origin_pool_id
}

output "supabase_proof_path" {
  description = "Where the data-layer configuration proof is written."
  value       = module.supabase.proof_output_path
}
