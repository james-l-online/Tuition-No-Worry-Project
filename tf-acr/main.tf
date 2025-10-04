terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

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
  default = "eastasia"
}

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

output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "ACR login server (e.g. myregistry.azurecr.io)"
}

output "acr_resource_id" {
  value       = azurerm_container_registry.acr.id
  description = "ACR resource id for role assignments"
}

// Optional lookup for an external storage account used for Terraform backends
data "azurerm_storage_account" "tfstate" {
  count               = var.storage_account_name != "" ? 1 : 0
  name                = var.storage_account_name
  resource_group_name = var.storage_account_rg
}

output "storage_account_id" {
  value       = length(data.azurerm_storage_account.tfstate) > 0 ? data.azurerm_storage_account.tfstate[0].id : ""
  description = "If provided, the id of the external storage account used for backends"
}

output "acr_admin_username" {
  value       = azurerm_container_registry.acr.admin_username
  description = "ACR admin username (only present if admin_enabled = true)"
}

output "acr_admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
  description = "ACR admin password (sensitive)"
}
