````markdown
# tf-iam (User-assigned Managed Identity + role assignments)

This folder contains a small Terraform module that demonstrates creating a User-Assigned Managed Identity (UAMI)
and optionally assigning the `AcrPull` role to that identity for a given ACR resource. The module is written to be
safe for demos: variables are explicit and role assignment creation is optional and driven by input.

This README is a quick reference — copy the relevant blocks into a working folder and provide the variables
before running Terraform in your environment.

Contents (review-only):
- `main.tf` — creates azurerm_user_assigned_identity and optionally an azurerm_role_assignment when `acr_resource_id` is provided.
- `variables.tf` — lists variables such as `resource_group_name`, `identity_name`, `location`, and optional `acr_resource_id`.
- `outputs.tf` — exports `uami_id` and `uami_principal_id` for use by other modules (e.g., tf-aks).

Before running (summary checklist):
1. Decide on a resource group and name for the identity (e.g. `tnw-rg` and `tnw-uami`).
2. If you plan to grant AcrPull, create ACR first so you can pass the ACR resource id to this module.
3. Prefer running this module before creating AKS so you can attach the UAMI to the cluster during creation.

Try it (PowerShell snippets) — copy to a working folder and run:
```powershell
# Login and set subscription
az login
az account set --subscription "<your-subscription-id>"

Set-Location -Path .\tf-iam
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="location=eastasia" -var="identity_name=tnw-uami"

# Capture outputs
$UAMI_ID = terraform output -raw uami_id
$UAMI_PRINCIPAL_ID = terraform output -raw uami_principal_id
```

Granting AcrPull (optional):
If you already have ACR provisioned, re-run the module passing `acr_resource_id` to create the role assignment:
```powershell
Set-Location -Path .\tf-iam
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="location=eastasia" -var="identity_name=tnw-uami" -var="acr_resource_id=$ACR_ID"
```

Notes and tips:
- Attach the UAMI to AKS during cluster creation (pass `uami_id` into the `tf-aks` module). This lets AKS use the
  user-assigned identity for image pulls and other operations that require an identity.
- Role assignments can be created later by re-running this module or using `az role assignment create` directly.
- For production, restrict the scope and use least-privilege: assign only `AcrPull` to the UAMI, not Contributor.
- Use `az role assignment list --assignee "$UAMI_PRINCIPAL_ID" --scope "$ACR_ID" -o table` to verify the assignment.

Security notes:
- Do not hard-code credentials or admin passwords in Terraform files checked into source control.
- Prefer short-lived credentials and managed identities for resource access.

If you'd like, I can add a small example showing how to attach the `uami_id` to the AKS cluster in `tf-aks/main.tf`.
````
