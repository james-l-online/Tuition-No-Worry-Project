resource "azurerm_user_assigned_identity" "uami" {
  name                = var.identity_name
  resource_group_name = var.resource_group_name
  location            = var.location
}

# Optional AcrPull role assignment (created only when acr_resource_id is provided)
resource "azurerm_role_assignment" "acr_pull" {
  count                = var.acr_resource_id != "" ? 1 : 0
  scope                = var.acr_resource_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.uami.principal_id
}


