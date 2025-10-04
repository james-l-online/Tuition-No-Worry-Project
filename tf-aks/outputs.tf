// Lookup storage account created by tf-aks-storage by name/resource group provided via -var
// This allows other modules or local backend configuration to reference the canonical storage account
// without creating another storage account in this module.

variable "_dummy" {
  description = "dummy to satisfy HCL parser when this file is used standalone"
  type        = string
  default     = ""
  nullable    = true
}

// Data source lookup (only if storage_account_name is provided)
data "azurerm_storage_account" "tfstate" {
  count                = var.storage_account_name != "" ? 1 : 0
  name                 = var.storage_account_name
  resource_group_name  = var.storage_account_rg
}

output "storage_account_name" {
  value = var.storage_account_name
  description = "The storage account name to use for Terraform backends (set when using external tfstate storage)"
}

output "storage_account_id" {
  value       = length(data.azurerm_storage_account.tfstate) > 0 ? data.azurerm_storage_account.tfstate[0].id : ""
  description = "The storage account id if the storage account lookup succeeded"
}
