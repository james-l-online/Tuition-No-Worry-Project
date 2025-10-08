// Minimal backend placeholder for tf-aks.
// To allow non-interactive `terraform init -backend-config=...`, keep the backend type declared
// but supply the concrete values via -backend-config or a local, uncommitted backend.tf.
terraform {
	backend "azurerm" {}
}

// Documentation-only example (do NOT commit secrets):
// terraform {
//   backend "azurerm" {
//     resource_group_name  = "tnw-storage-rg"
//     storage_account_name = "tnwstate12345"
//     container_name       = "tfstate"
//     key                  = "tf-aks.terraform.tfstate"
//   }
// }

// Example init (replace values with tf-aks-storage outputs):
// terraform init -backend-config="resource_group_name=tnw-storage-rg" -backend-config="storage_account_name=tnwstate12345" -backend-config="container_name=tfstate" -backend-config="key=tf-aks.terraform.tfstate"


