variable "resource_group_name" {
  type    = string
  default = "tnw-rg"
}

variable "acr_name" {
  type    = string
  default = "tnwregistry"
}

variable "location" {
  type    = string
  default = "eastasia"
}

variable "storage_account_name" {
  description = "Optional storage account name for backend lookups"
  type        = string
  default     = ""
}

variable "storage_account_rg" {
  description = "Resource group for external storage account used by backends"
  type        = string
  default     = ""
}
// Optional storage account lookup used when backends are provisioned in a separate module
variable "storage_account_name" {
  description = "Optional: name of the storage account used for Terraform backends (provisioned in tf-aks-storage)"
  type        = string
  default     = ""
}

variable "storage_account_rg" {
  description = "Optional: resource group of the storage account used for Terraform backends"
  type        = string
  default     = ""
}
