// Minimal backend placeholder for tf-aks.
// Fill backend configuration by passing -backend-config flags during 'terraform init' or
// by copying backend.tf.example to backend.tf and populating values locally.

terraform {
  backend "azurerm" {}
}
// Commented Terraform backend example for tf-aks (Azure Storage)
// Documentation-only example. Configure storage account and container before use.

/*
terraform {
  backend "azurerm" {
    resource_group_name  = "<state-rg>"
    storage_account_name = "<stateacct>"
    container_name       = "tfstate"
    key                  = "tf-aks.terraform.tfstate"
  }
}

# For locking: using the azurerm backend automatically obtains blob leases. Ensure contributors have appropriate RBAC.
*/
