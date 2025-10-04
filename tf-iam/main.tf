terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm" }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_user_assigned_identity" "uami" {
  name                = var.identity_name
  resource_group_name = var.resource_group_name
  location            = var.location
}

# Optional AcrPull role assignment (created only when acr_resource_id is provided)
resource "azurerm_role_assignment" "acr_pull" {
  count               = var.acr_resource_id != "" ? 1 : 0
  scope               = var.acr_resource_id
  role_definition_name = "AcrPull"
  principal_id        = azurerm_user_assigned_identity.uami.principal_id
}
terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm" }
  }
}

provider "azurerm" {
  features {}
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type    = string
  default = "eastasia"
}

variable "acr_resource_id" {
  type = string
}

resource "azurerm_user_assigned_identity" "aks_uami" {
  name                = "tnw-aks-uami"
  resource_group_name = var.resource_group_name
  location            = var.location
}

# Role assignment for ACR pull to the UAMI
resource "azurerm_role_assignment" "acr_pull_uami" {
  scope                = var.acr_resource_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.aks_uami.principal_id
}

output "uami_client_id" {
  value = azurerm_user_assigned_identity.aks_uami.client_id
}

