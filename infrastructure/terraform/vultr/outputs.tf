output "edge_instance_ids" {
  description = "Edge instance ids by region."
  value       = { for region, instance in vultr_instance.edge : region => instance.id }
}

output "edge_public_ips" {
  description = "Edge public IPs by region (registered as Cloudflare origins)."
  value       = { for region, instance in vultr_instance.edge : region => instance.main_ip }
}

output "edge_firewall_group_id" {
  description = "Edge firewall group id."
  value       = vultr_firewall_group.edge.id
}
