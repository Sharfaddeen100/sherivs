output "record_id" {
  description = "Application DNS record id."
  value       = module.dns_edge.record_id
}

output "load_balancer_id" {
  description = "Load balancer id."
  value       = module.dns_edge.load_balancer_id
}

output "origin_pool_id" {
  description = "Origin pool id (add Hetzner/Vultr origins here as they come online)."
  value       = module.dns_edge.origin_pool_id
}
