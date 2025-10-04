# Configure the Azure provider
provider "azurerm" {
  features {}
}

variable "location" {
  type    = string
  default = "southeastasia" # default location set to southeastasia
}

variable "resource_group_name" {
  type    = string
  default = "tnw-rg"
}

variable "acr_name" {
  type    = string
  default = "tnwregistry"
}
