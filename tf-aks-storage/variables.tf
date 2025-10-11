variable "resource_group_name" {
  description = "Name of the resource group where the storage account will be created"
  type        = string
}

variable "location" {
  description = "Azure region for the storage account"
  type        = string
  default     = "eastasia"
}

variable "storage_account_name" {
  description = "Name to use for the storage account"
  type        = string
}