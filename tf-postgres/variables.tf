variable "resource_group_name" {
  description = "Resource group name where Postgres and related resources will be created"
  type        = string
}

variable "location" {
  description = "Azure region to create resources in (e.g. eastasia)"
  type        = string
  default     = "eastasia"
}

variable "server_name" {
  description = "The name for the PostgreSQL flexible server (must be globally unique)"
  type        = string
}

variable "administrator_login" {
  description = "Admin username for the Postgres server"
  type        = string
  default     = "tnw_admin"
}

variable "postgres_version" {
  description = "Postgres major version"
  type        = string
  default     = "15"
}

variable "sku_name" {
  description = "SKU name for the flexible server"
  type        = string
  default     = "standard_a2_v2"
}

variable "storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 32768
}

variable "backup_retention_days" {
  description = "Backup retention days"
  type        = number
  default     = 7
}

variable "vnet_id" {
  description = "VNet id to link private DNS zone"
  type        = string
}

variable "pe_subnet_id" {
  description = "Subnet id where the private endpoint will be created"
  type        = string
}

variable "public_access" {
  description = "If true, enable public network access on the Flexible Server and optionally create firewall rules. Set to true for public access demos."
  type        = bool
  default     = false
}

variable "allowed_ip_ranges" {
  description = "List of CIDR ranges to allow through the server firewall when public_access=true"
  type        = list(string)
  default     = []
}

variable "create_k8s_secret" {
  description = "If true, create a Kubernetes secret with DATABASE_URL using the kubernetes provider (requires kubeconfig available to the runner)"
  type        = bool
  default     = false
}

variable "k8s_namespace" {
  description = "Namespace where the kubernetes secret will be created"
  type        = string
  default     = "default"
}

variable "k8s_secret_name" {
  description = "Name of the Kubernetes secret to create"
  type        = string
  default     = "tnw-database-url"
}

variable "storage_account_name" {
  description = "Optional: name of the storage account used for Terraform backends"
  type        = string
  default     = ""
}

variable "storage_account_rg" {
  description = "Optional: resource group of the storage account used for Terraform backends"
  type        = string
  default     = ""
}
