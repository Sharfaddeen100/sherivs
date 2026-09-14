# CoreGrid Cloud Fabric — provider version pins.
#
# LAW (blueprint §17): versions are pinned; `latest` and floating majors are
# forbidden. Bump deliberately, in a reviewed change, one provider at a time.
#
# Apply this file by symlinking/including it in every root, or by keeping the
# provider requirements in each root and referencing these versions.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.21"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.33"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.16"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}
