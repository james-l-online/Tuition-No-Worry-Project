/*
Demo: Service Principal / Managed Identity + role assignment (commented out)

- This demonstrates assigning `AcrPull` to the AKS identity so the cluster can pull images from ACR.
*/

/*
# Create a user-assigned managed identity
resource "azurerm_user_assigned_identity" "aks_uami" {
  name                = "tnw-aks-uami"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

# Assign AcrPull on the ACR to the identity
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.aks_uami.principal_id
}
*/
