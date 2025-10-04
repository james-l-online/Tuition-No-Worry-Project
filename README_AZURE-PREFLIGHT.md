# Azure Preflight Checklist

This checklist gathers the commands, checks, and recommended values you should complete before running `terraform init/plan/apply` in the project's `tf-*` folders or deploying the Helm chart. It's a condensed, actionable checklist derived from `README_DEMO2.md` and the repo's Terraform modules.

Use PowerShell (pwsh) or bash. Commands shown in blocks are for Bash; equivalent PowerShell examples are noted where helpful.

---

## 1) Basic tools & account

- Install and verify tools:
  - Terraform >= 1.2
  - Azure CLI (`az`)
  - Docker
  - kubectl
  - Helm

Commands:

```bash
terraform version
az version
docker --version
kubectl version --client
helm version
```

- Login to Azure (interactive) or configure a Service Principal (CI/non-interactive):

```bash
az login
# (optional) set subscription
az account set --subscription "<YOUR_SUBSCRIPTION_ID_OR_NAME>"
```

For CI or automation, create a Service Principal and export ARM_* env vars (example):

```bash
az ad sp create-for-rbac --name "tnw-sp" --role Contributor --sdk-auth
# save output (JSON) to use in GitHub Actions secrets or set ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_SUBSCRIPTION_ID, ARM_TENANT_ID
```

Notes:
- Interactive `az login` is fine for a local demo. For repeatable CI runs use a Service Principal or OIDC.

---

## 2) Resource Group, naming, and locations

- Pick a resource group and location (we use `eastasia` in the demo):
  - resource_group_name: `tnw-rg`
  - location: `eastasia`

Create the RG if you want Terraform to assume it exists (or let Terraform create it in each module):

```bash
az group create --name tnw-rg --location eastasia
```

Choose predictable resource names (must be globally unique for ACR and may have constraints for postgresql server):
- ACR name: `tnwregistry` (must be globally unique within Azure)
- Postgres server name: `tnw-pg-public-<unique>` (use lowercase, alphanumeric and hyphens)
- AKS cluster name: `tnw-aks-<unique>`

---

## 3) Register required providers

Run this once per subscription if not already registered:

```bash
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.RedHat
az provider register --namespace Microsoft.Compute
az provider register --namespace Microsoft.Network
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.ManagedIdentity
az provider register --namespace Microsoft.Authorization
```

You can check registration state:

```bash
az provider show --namespace Microsoft.DBforPostgreSQL --query registrationState -o tsv
```

---

## 4) Quotas & SKU availability (AKS)

Before creating AKS, check vCPU quotas and SKU availability in `eastasia`. If you run into quota errors, request a quota increase in the Azure Portal.

```bash
# List subscription usage per region
az vm list-usage --location eastasia -o table
```

Check if the VM sizes you plan to use are available. For a small demo, a 1-2 node pool of `Standard_D2s_v3` is common, but confirm availability in `eastasia`.

---

## 5) Terraform backend (optional)

If you want shared/remote state, create a storage account and container for the backend before running `terraform init`.

```bash
# create storage account and container (example)
az storage account create --name tnwstate<unique> --resource-group tnw-rg --location eastasia --sku Standard_LRS
az storage container create --name tfstate --account-name tnwstate<unique>
```

Update your `backend` config or run `terraform init` with the proper backend configuration.

---

## 6) Networking notes (for private endpoints later)

If you plan to test private endpoints later (not required for the public demo), note the VNet and delegated subnet IDs created by `tf-aks` and pass them to `tf-postgres`.

Capture VNet and subnet IDs (example after `tf-aks` apply):

```bash
# sample: list vnet and subnets
az network vnet list -g tnw-rg -o table
az network vnet subnet list -g tnw-rg --vnet-name <vnetName> -o table
```

You'll need the delegated subnet id (for PostgreSQL) and a separate subnet for the Private Endpoint.

---

## 7) Firewalls & allowed IP ranges (public Postgres)

For the demo's public PostgreSQL server, restrict access using `allowed_ip_ranges` when running `terraform apply`. Add your local IP (or CI runner IP range) to this list.

Find your public IP:

```bash
curl -s https://ifconfig.co
# or
curl -s https://api.ipify.org
```

Add your IP as a CIDR (for example `203.0.113.4/32`) to `allowed_ip_ranges` when applying `tf-postgres`.

Example terraform apply for public postgres:

```bash
cd tf-postgres
terraform init
terraform apply -auto-approve \
  -var="resource_group_name=tnw-rg" \
  -var="server_name=tnw-pg-public-<unique>" \
  -var="public_access=true" \
  -var='allowed_ip_ranges=["203.0.113.4/32"]'
```

After apply, read sensitive outputs:

```bash
terraform output -raw postgresql_database_url
terraform output -raw postgres_admin_password
```

Store these values securely or export them into your environment for seeding.

---

## 8) Provision AKS, ACR, and other tf-* modules (order of operations)

Suggested quick-demo order:

1. `tf-aks` (create VNet/subnet and AKS)
2. `tf-postgres` (create public Postgres with `allowed_ip_ranges`)
3. `tf-acr` (create ACR and capture admin creds for the demo CI)
4. Optionally `tf-iam` and `tf-aks-storage` if you plan to wire managed identities or storage

Example AKS apply:

```bash
cd tf-aks
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="location=eastasia"
```

Example ACR apply:

```bash
cd ../tf-acr
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="acr_name=tnwregistry" -var="location=eastasia"
```

Capture the ACR outputs for CI:

```bash
terraform output acr_login_server
terraform output acr_admin_username
terraform output -raw acr_admin_password
```

---

## 9) Create Kubernetes secret for the app

Preferred: create the K8s secret from the `postgresql_database_url` output locally using `kubectl` and avoid storing DB credentials in GitHub secrets.

```bash
DB_URL=$(cd ./tf-postgres && terraform output -raw postgresql_database_url)
kubectl create secret generic tnw-database-url --from-literal=DATABASE_URL="$DB_URL" --namespace default
```

PowerShell equivalent (pwsh):

```powershell
$DB_URL = (cd .\tf-postgres; terraform output -raw postgresql_database_url)
kubectl create secret generic tnw-database-url --from-literal=DATABASE_URL="$DB_URL" --namespace default
```

Optional: set `create_k8s_secret=true` in `tf-postgres` so Terraform attempts to create the secret (requires kubeconfig access and the `kubernetes` provider configured where you run Terraform).

---

## 10) CI quick-demo (ACR admin path)

The repo includes a simple GitHub Actions workflow that uses ACR admin credentials for demo pushes. For a quick demo:

- Add these repository secrets: `ACR_LOGIN_SERVER`, `ACR_ADMIN_USERNAME`, `ACR_ADMIN_PASSWORD`.
- Push to the `starter` branch (or whatever the workflow triggers on) to start build/push.

Notes:
- ACR admin creds are convenient but less secure; consider Service Principal + OIDC for production CI. I can scaffold OIDC/SP approach if you want.

---

## 11) Seeding the DB (local or via Helm job)

Option A — Local seeding (trusted runner):

```bash
export DATABASE_URL="$(cd ./tf-postgres && terraform output -raw postgresql_database_url)"
node ./scripts/run-sql-seed.js ./sql/schema.sql
node ./scripts/run-sql-seed.js ./sql/seed-full.sql
```

PowerShell (pwsh):

```powershell
$env:DATABASE_URL = (cd .\tf-postgres; terraform output -raw postgresql_database_url)
node .\scripts\run-sql-seed.js .\sql\schema.sql
node .\scripts\run-sql-seed.js .\sql\seed-full.sql
```

Option B — Chart `dbMigration` job:
- Set `dbMigration.enableJob: true` in your values file and `helm upgrade --install ... -f values.yaml`. This runs a Kubernetes Job inside the cluster to apply schema+seed (ensure the cluster can reach the Postgres server).

---

## 12) Verification & troubleshooting

- CI: check GitHub Actions run logs for build and push steps.
- ACR: list repositories `az acr repository list --name <acr>` and verify the tag.
- AKS: `kubectl get pods --namespace default` then `kubectl logs <pod>` for app logs.
- DB: connect with `psql` or a GUI to verify tables and rows.

If you see `password authentication failed for user 'tnw_user'` when running the seeder, verify:
- The `postgresql_database_url` contains the user and password you expect.
- You used the `postgres_admin_password` or the correct DB user credentials. The seeder expects the admin user from Terraform output unless you created a custom user.

---

## 13) Cleanup

When finished, destroy resources to avoid charges. Run `terraform destroy` in the reverse order of creation.

```bash
cd tf-acr && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
cd tf-postgres && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
cd tf-aks && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
```

---

## Tips & security notes

- Avoid storing DB credentials in GitHub repository secrets when possible — prefer creating K8s secrets from Terraform outputs locally or using Azure Key Vault.
- Restrict `allowed_ip_ranges` to the smallest set of IPs required (CI runners, your office/home IP, etc.).
- Prefer Service Principal + OIDC for CI authentication to Azure (more secure than admin passwords).

If you want, I can also:
- Add a small PowerShell or Bash helper to automate creating the K8s secret from Terraform outputs.
- Scaffold GitHub Actions to use OIDC + Service Principal for secure pushes to ACR.

---
