variable "storage_account_name" {
  description = "Name of the storage account used for Terraform backends (provisioned in tf-aks-storage)"
  type        = string
  default     = ""
}

variable "storage_account_rg" {
  description = "Resource group where the storage account for Terraform state lives"
  type        = string
  default     = ""
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "aks_cluster_name" {
  type    = string
  default = "tnw-aks"
}

variable "uami_id" {
  description = "Optional: user-assigned managed identity resource id to attach to AKS (pass from tf-iam output uami_id)."
  type        = string
  default     = ""
}
