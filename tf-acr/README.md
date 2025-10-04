# tf-acr (Container Registry)

This folder contains the Terraform manifest(s) for provisioning an Azure Container Registry (ACR) for the Tuition-No-Worry project. Files are intentionally kept here for review

What is included (review-only):
- `versions.tf` — provider and Terraform version constraints.
- `provider.tf` — azurerm provider configuration and variables.
- `main.tf` — ACR resource definition (registry SKU, admin enabled optional).
- `outputs.tf` — outputs such as `acr_login_server` (suitable to pass to AKS or CI).
- `.env.example` / README (guidance).

Quick review checklist before running:
1. Ensure you have Azure CLI installed and are logged in: `az login`.
2. Choose the target subscription: `az account set --subscription "<subscription-id>"`.
3. Decide on an ACR name and resource group. ACR names must be globally unique.
4. Configure variables via `terraform.tfvars` or environment variables.

Try it (PowerShell snippets) — copy into a safe working directory and uncomment resources before running:
```powershell
# Initialize Terraform in this folder
Set-Location -Path .\tf-acr
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Security notes:
- Avoid enabling admin user on ACR in production; prefer scoped service principals or managed identities.
- Use a remote Terraform backend (Azure Storage) for state if collaborating.
