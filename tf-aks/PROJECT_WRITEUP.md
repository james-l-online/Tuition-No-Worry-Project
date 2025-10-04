# AKS Terraform Project Write-up (Demo)

This document is a write-up for the `tf-aks/` scaffold included in the Tuition-No-Worry repository. The files in the folder are intentionally commented and meant for review and project documentation. Use this write-up to produce a formal project section in your handover or report.

Objectives:
- Provision an AKS cluster in a new or existing resource group.
- Configure networking (VNet + subnet) to host AKS nodes.
- Provide an identity model to allow AKS to pull images from ACR (UAMI or system assigned).
- Demonstrate storage patterns: Azure Disk (RWO) and Azure Files (RWX).

Files and purpose:
- `versions.tf` — documents required Terraform and provider versions.
- `provider.tf` — demonstrates how to configure `azurerm` and variable defaults.
- `main.tf` — example resources: resource group, vnet, subnet, and `azurerm_kubernetes_cluster`.
- `identity.tf` — shows how to create a user-assigned managed identity and how to assign `AcrPull` role.
- `storage.tf` — sample Kubernetes StorageClass and PersistentVolumeClaim definitions for Azure Disk and Azure Files using the CSI drivers.

Execution steps (detailed) — intended for an operator or documentation in the project write-up:
1) Preparation:
   - Ensure Azure CLI and Terraform are installed on the operator machine.
   - Login and set the desired subscription: `az login` + `az account set --subscription "<sub-id>"`.
   - If using remote state, ensure the backend storage account and container exist and are configured.

2) Provision ACR (if not already done):
   - Use the `tf-acr/` workspace to create an Azure Container Registry and capture `acr_login_server`.

3) Configure `tf-aks` variables:
   - Create a `terraform.tfvars` file or export environment variables for `resource_group_name`, `location`, and `aks_cluster_name`.

4) Initialize and apply networking + AKS:
   - `terraform init`
   - `terraform plan -out=tfplan`
   - `terraform apply tfplan`

5) Configure identity for ACR pulls:
   - Option A (recommended): Create a user-assigned managed identity and assign `AcrPull` on the ACR resource. Attach the identity to the AKS cluster nodepool or use it with Kubernetes workloads that need to pull private images.
   - Option B: Use the AKS managed identity (system assigned) and assign `AcrPull` to its principal id.

6) Configure storage and deploy workloads:
   - Create StorageClass resources (Azure Disk for RWO, Azure Files for RWX) if you plan to use dynamic provisioning.
   - Create PVCs and ensure workloads mount them as required.

Example operator commands (PowerShell):
```powershell
# Login and set subscription
az login
az account set --subscription "<your-subscription-id>"

# Init and apply terraform in a working copy
Set-Location -Path .\tf-aks
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get credentials for kubectl
az aks get-credentials --resource-group <rg> --name <aks-name>
kubectl get nodes
```

Validation and smoke tests:
- Verify cluster nodes are Ready: `kubectl get nodes`.
- Verify the AKS cluster has networking connectivity and that pods can pull images from the specified ACR.
- Create a simple nginx deployment referencing the ACR image and confirm it pulls and runs.

Security and operational recommendations for the write-up:
- Use remote state with locking (Azure Storage + blob leases) for collaboration.
- Use Azure AD roles and service principals with least privilege for CI pipelines.
- Rotate credentials and avoid storing secrets in plaintext `terraform.tfvars` in Git.

Appendix: Common Terraform variables (example `terraform.tfvars`):
````hcl
resource_group_name = "tnw-aks-rg"
location            = "southeastasia"
aks_cluster_name    = "tnw-aks-cluster"
acr_resource_id     = "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ContainerRegistry/registries/<acr-name>"
````

If you'd like I can now generate the commented GitHub Actions workflow (build → push to ACR → deploy to AKS) as a review-only example, or I can add commented remote backend examples for both `tf-acr` and `tf-aks`.