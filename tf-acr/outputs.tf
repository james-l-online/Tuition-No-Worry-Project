# Outputs for ACR     
output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  value = azurerm_container_registry.acr.admin_username
  sensitive = true
}

output "acr_admin_password" {
  value = azurerm_container_registry.acr.admin_password
  sensitive = true
}

output "acr_resource_id" {
  value       = azurerm_container_registry.acr.id
  description = "ACR resource id for role assignments"
}

output "storage_account_id" {
  value       = length(data.azurerm_storage_account.tfstate) > 0 ? data.azurerm_storage_account.tfstate[0].id : ""
  description = "If provided, the id of the external storage account used for backends"
}
