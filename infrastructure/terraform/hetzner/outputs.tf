output "worker_ids" {
  description = "Worker server ids."
  value       = hcloud_server.worker[*].id
}

output "worker_private_ips" {
  description = "Worker private IPs (no public networking)."
  value       = [for server in hcloud_server.worker : tolist(server.network)[0].ip]
}

output "worker_network_id" {
  description = "Private network id."
  value       = hcloud_network.fabric.id
}

output "worker_firewall_id" {
  description = "Firewall applied to workers."
  value       = hcloud_firewall.workers.id
}
