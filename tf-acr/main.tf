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

output "acr_admin_username" {
  value       = azurerm_container_registry.acr.admin_username
  description = "ACR admin username (only present if admin_enabled = true)"
}

output "acr_admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
  description = "ACR admin password (sensitive)"
}
