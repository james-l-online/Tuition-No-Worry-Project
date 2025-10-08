````markdown
# tf-aks-storage (Terraform state storage account)

This module provisions a dedicated Azure Storage Account (and container) intended to host Terraform state and
related artifacts for the demo. The storage account is intentionally created in a separate resource group to
isolate state and reduce blast radius.

The module is minimal: it creates the storage account and exposes outputs such as the account name and
primary connection string (sensitive). Use this storage account as the canonical backend for other Terraform
modules in this repo (tf-aks, tf-acr, tf-postgres, etc.).

Contents (review-only):
- `main.tf` — creates `azurerm_storage_account` and outputs `storage_account_id` and `storage_account_primary_connection_string`.
- `variables.tf` — variables such as `resource_group_name`, `location`, and `storage_account_name`.

Before running (summary checklist):
1. Pick a resource group and storage account name (storage account name must be globally unique):
   - Example: `tnwstate$(Get-Date -UFormat %s)` or `tnwstate<random-suffix>`.
2. Create the resource group or let Terraform create it (recommended for demo: create first via `az group create`).

Try it (PowerShell snippets) — run in this folder:
```powershell
# create resource group (optional)
az group create --name "tnw-storage-rg" --location "eastasia"

Set-Location -Path .\tf-aks-storage
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-storage-rg" -var="location=eastasia" -var="storage_account_name=tnwstate$(Get-Random)"

# Outputs you will typically capture
$STORAGE_ACCOUNT_NAME = terraform output -raw storage_account_name
$STORAGE_CONNSTR = terraform output -raw storage_account_primary_connection_string
```

Backend configuration example (local, do not check into VCS):
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tnw-storage-rg"
    storage_account_name = "<your-storage-account-name>"
    container_name       = "tfstate"
    key                  = "<module-name>.terraform.tfstate"
  }
}
```

Best practices:
- Do NOT commit backend credentials or `backend.tf` files into source control. Use `-backend-config` or local files ignored by git.
- Consider enabling soft-delete and blob versioning on the storage account to protect state blobs.
- Restrict access to the storage account via RBAC and only allow the CI/service principal or users who need state access.

If you'd like, I can add a tiny helper script under `scripts/` that runs `terraform init -backend-config=...` for subsequent modules
by automatically reading outputs from this module.
````
