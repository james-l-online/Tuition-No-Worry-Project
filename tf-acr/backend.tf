// Minimal backend placeholder for tf-acr.
// This placeholder keeps the backend block syntactically present so Terraform doesn't warn.
// Fill backend configuration by passing -backend-config flags during 'terraform init' or
// create a separate 'backend.tf' with real values (do NOT commit secrets).

terraform {
  backend "azurerm" {}
}

// See backend.tf.example for a commented example you can copy locally and fill in.
// Commented Terraform backend example for tf-acr (Azure Storage)
// This is a documentation-only example. Do NOT copy secrets into VCS.

/*
terraform {
  backend "azurerm" {
    resource_group_name  = "<state-rg>"
    storage_account_name = "<stateacct>"
    container_name       = "tfstate"
    key                  = "tf-acr.terraform.tfstate"
  }
}

# Notes:
# - Create the storage account and container ahead of time and limit access via RBAC.
# - Consider enabling soft-delete and versioning on the storage account for state safety.
*/

// Non-interactive init example (preferred):
// 1) Apply tf-aks-storage first to create the storage account + container.
// 2) Run terraform init passing backend-config values so Terraform won't prompt:
//
// terraform init \
//   -backend-config="resource_group_name=<state-rg>" \
//   -backend-config="storage_account_name=<stateacct>" \
//   -backend-config="container_name=tfstate" \
//   -backend-config="key=tf-acr.terraform.tfstate"

// Alternatively, create a local file 'backend.tfvars' and pass -backend-config=backend.tfvars
// Do NOT commit backend.tfvars with secrets or subscription-specific values to version control.
