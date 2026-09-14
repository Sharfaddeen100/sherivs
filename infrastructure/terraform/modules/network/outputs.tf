output "vcn_id" {
  description = "VCN identifier for dependent modules."
  value       = oci_core_vcn.this.id
}

output "public_subnet_id" {
  description = "Public subnet (cluster edge)."
  value       = oci_core_subnet.public.id
}

output "private_subnet_id" {
  description = "Private subnet (node pools, workloads)."
  value       = oci_core_subnet.private.id
}

output "private_security_list_id" {
  description = "Security list applied to private workloads."
  value       = oci_core_security_list.private.id
}
