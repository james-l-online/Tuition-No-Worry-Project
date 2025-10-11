output "storage_account_name" {
  description = "The name of the storage account"
  value       = azurerm_storage_account.sa.name
}

output "resource_group_name" {
  description = "The resource group containing the storage account"
  value       = var.resource_group_name
}
