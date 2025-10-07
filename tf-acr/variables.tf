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
  default = "eastus"
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
