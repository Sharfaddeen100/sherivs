output "bucket_names" {
  description = "Created bucket names by storage class."
  value       = { for name, bucket in oci_objectstorage_bucket.this : name => bucket.name }
}

output "bucket_ids" {
  description = "Bucket OCIDs by storage class."
  value       = { for name, bucket in oci_objectstorage_bucket.this : name => bucket.id }
}
