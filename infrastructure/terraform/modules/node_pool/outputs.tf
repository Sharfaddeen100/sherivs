output "node_pool_id" {
  description = "Node pool OCID."
  value       = oci_containerengine_node_pool.this.id
}

output "node_pool_name" {
  description = "Node pool name (used in scale drills)."
  value       = oci_containerengine_node_pool.this.name
}
