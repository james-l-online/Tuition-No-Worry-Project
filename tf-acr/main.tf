resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_container_registry" "acr" {
  name                = lower(format("%s%s", var.acr_name, random_string.suffix.result))
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    project = "tuition-no-worry"
  }
}

// Optional lookup for an external storage account used for Terraform backends
data "azurerm_storage_account" "tfstate" {
  count               = var.storage_account_name != "" ? 1 : 0
  name                = var.storage_account_name
  resource_group_name = var.storage_account_rg
}
