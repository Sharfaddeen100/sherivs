output "record_id" {
  description = "Application DNS record id."
  value       = cloudflare_record.app.id
}

output "load_balancer_id" {
  description = "Load balancer id."
  value       = cloudflare_load_balancer.app.id
}

output "origin_pool_id" {
  description = "Origin pool id (used when adding regional/edge origins)."
  value       = cloudflare_load_balancer_pool.origins.id
}
