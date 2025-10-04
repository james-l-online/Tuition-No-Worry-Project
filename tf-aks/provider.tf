provider "azurerm" {
  features {}
}

variable "location" {
  type    = string
  default = "southeastasia"
}

variable "resource_group_name" {
  type    = string
  default = "tnw-aks-rg"
}

variable "aks_cluster_name" {
  type    = string
  default = "tnw-aks-cluster"
}
