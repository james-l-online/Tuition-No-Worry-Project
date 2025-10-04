# tf-aks (AKS Demo Scaffold)

This folder holds a commented, non-executable showcase of Terraform configurations for provisioning an Azure Kubernetes Service (AKS) cluster, networking, identity, and storage examples. All files are intentionally commented to avoid accidental execution. Use this README as a quick reference and copy the relevant blocks into a working folder when you're ready to run them.

Contents (review-only):
- `versions.tf` — provider and Terraform version hints.
- `provider.tf` — azurerm provider and common variables.
- `main.tf` — resource group, virtual network, subnet, and `azurerm_kubernetes_cluster` example.
- `storage.tf` — example StorageClass and PVC manifests for Azure Disk and Azure Files (CSI drivers).
- `identity.tf` — example UAMI creation and `AcrPull` role assignment.

Before running (summary checklist):
1. Confirm `tf-acr/` ACR is provisioned and you have the `acr_login_server` string.
2. Prepare remote state backend (recommended) or a secure local workspace.
3. Fill in variables (resource group, location, cluster name).
4. Decide on identity model: SystemAssigned (default) or UserAssigned (for ACR pull scope).

Try it (PowerShell snippets) — copy blocks to a working folder, uncomment, then run:
```powershell
# Login and set subscription
az login
az account set --subscription "<your-subscription-id>"

# Initialize and apply Terraform (example)
Set-Location -Path .\tf-aks
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# After AKS is created, get credentials and check nodes
az aks get-credentials --resource-group <rg> --name <aks-name>
kubectl get nodes
```

Notes and tips:
- For private ACR access, prefer assigning `AcrPull` to a UAMI attached to the AKS cluster or using the cluster's managed identity.
- Use Azure Disk for single-writer DB storage (RWO) and Azure Files for shared RWX access.
- Consider using node pools for separation of workloads (system vs user workloads).

If you'd like, I can now create a commented GitHub Actions workflow showing how to build, tag, push images to ACR, and deploy to AKS (keeps it review-only).