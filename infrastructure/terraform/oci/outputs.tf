output "cluster_id" {
  description = "Management cluster OCID."
  value       = module.kubernetes.cluster_id
}

output "cluster_endpoint" {
  description = "Private control-plane endpoint (operator access only)."
  value       = module.kubernetes.cluster_endpoint
  sensitive   = false
}

output "vcn_id" {
  description = "Fabric VCN."
  value       = module.network.vcn_id
}

output "public_subnet_id" {
  description = "Public subnet (service load balancers)."
  value       = module.network.public_subnet_id
}

output "private_subnet_id" {
  description = "Private subnet (node pools, workloads)."
  value       = module.network.private_subnet_id
}

output "bucket_names" {
  description = "Storage buckets created for the fabric."
  value       = module.storage.bucket_names
}

output "secret_gate_id" {
  description = "Secret-presence gate id recorded in the change record."
  value       = module.secret_gate.secret_gate_id
}
