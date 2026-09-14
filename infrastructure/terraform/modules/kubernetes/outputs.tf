output "cluster_id" {
  description = "Managed cluster OCID."
  value       = oci_containerengine_cluster.this.id
}

output "cluster_endpoint" {
  description = "Private Kubernetes API endpoint (never public)."
  value       = oci_containerengine_cluster.this.endpoints[0].private_endpoint
}

output "cluster_name" {
  description = "Cluster name used by kubectl contexts."
  value       = oci_containerengine_cluster.this.name
}
