output "uami_id" {
  value       = azurerm_user_assigned_identity.uami.id
  description = "The resource id of the created user-assigned managed identity"
}

output "uami_principal_id" {
  value       = azurerm_user_assigned_identity.uami.principal_id
  description = "The principal id of the user-assigned managed identity (useful for role assignments)"
}

output "uami_client_id" {
  value       = azurerm_user_assigned_identity.uami.client_id
  description = "Client id of the user-assigned managed identity"
}

output "acr_pull_role_assignment_id" {
  value       = length(azurerm_role_assignment.acr_pull) > 0 ? azurerm_role_assignment.acr_pull[0].id : ""
  description = "If created, the role assignment id for AcrPull"
}
