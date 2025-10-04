# Tuition No Worry — Final Demo Guide 
## (ACR + AKS + Public Postgres + tfstate Storage)
This consolidated guide shows how to provision Azure resources (AKS, ACR, PostgreSQL Flexible Server), push a container image, manage secrets, and deploy the app with Helm. It merges the quick-demo flow and the Azure preflight steps we need to achieve our demo.

Key points:
- This demo uses a public PostgreSQL Flexible Server for convenience. Use private endpoints in production.
- `tf-aks-storage` is used as a dedicated storage account (in its own resource group) to host Terraform state containers and store sensitive artifacts (secrets/connection strings). This keeps tfstate and secrets isolated from the main resource group.
- All commands below are Bash.

---

## Goal

Build the Next.js app image, push it to Azure Container Registry (ACR), and deploy to AKS using Helm. Provision a PostgreSQL Flexible Server (public-access for demo) and wire the app to it using a Kubernetes secret. Use `tf-aks-storage` to host Terraform state and put secret artifacts in a separate resource group for safer handling.

---

## Architecture (short)
- App: Next.js (TypeScript) → Docker image
- Registry: Azure Container Registry (ACR) — `tf-acr`
- Cluster: AKS + VNet — `tf-aks`
- Database: PostgreSQL Flexible Server (public-access by default for demo) — `tf-postgres`
- Storage: Dedicated Storage Account & container for tfstate and secrets in its own resource group — `tf-aks-storage`
- Deployment: Helm chart at `charts/tuition-no-worry` (values.yaml controls image and dbMigration)

---

## Files / Terraform layout
- `tf-aks/` — VNet, Subnets, AKS cluster
- `tf-acr/` — ACR, (admin enabled for demo)
- `tf-postgres/` — PostgreSQL Flexible Server (public_access toggle + allowed_ip_ranges)
- `tf-aks-storage/` — Storage account + container for Terraform state and secret artifacts. Deploys into a separate resource group (e.g. `tnw-storage-rg`).
- `tf-iam/` — Optional user-assigned managed identity and role assignment (AcrPull for AKS)

App & deploy artifacts
- `Dockerfile`, `docker/entrypoint.sh`
- `sql/schema.sql`, `sql/seed-full.sql`
- `scripts/run-sql-seed.js`
- `charts/tuition-no-worry/` (Helm chart)

---

## Preflight checklist (quick)

1. Install tools and verify:

```bash
terraform version
az version
docker --version
kubectl version --client
helm version
```

2. Login to Azure and set subscription

```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID_OR_NAME>"
```

3. Optional: Create an automation Service Principal (for CI)

```bash
az ad sp create-for-rbac --name "tnw-sp" --role Contributor --sdk-auth > tnw-sp.json
# Save tnw-sp.json securely and add its values to CI secrets (or use OIDC recommended flow)
```

4. Register resource providers (run once per subscription)

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

5. Pick names and resource groups

```bash
# Example naming
MAIN_RG=tnw-rg
STORAGE_RG=tnw-storage-rg
LOCATION=eastasia
```

Create resource groups (optional — Terraform modules can create them too):

```bash
az group create --name "$MAIN_RG" --location "$LOCATION"
az group create --name "$STORAGE_RG" --location "$LOCATION"
```

6. Quotas: verify vCPU and SKU availability in `eastasia`

```bash
az vm list-usage --location "$LOCATION" -o table
```



## Quick-demo flow (public Postgres path)

Follow this order to provision resources and deploy the app.

### 1) Provision tf-aks (network + AKS)

```bash
cd ./tf-aks
terraform init
terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="location=$LOCATION"
```

Take note of the VNet and subnet IDs for private endpoints later (optional).

### 2) Provision public PostgreSQL Flexible Server (demo)

Choose a server name and a tight `allowed_ip_ranges` CIDR (your IP / CI runner IPs).

```bash
cd ../tf-postgres
terraform init
terraform apply -auto-approve \
  -var="resource_group_name=$MAIN_RG" \
  -var="server_name=tnw-pg-public-<unique>" \
  -var="public_access=true" \
  -var='allowed_ip_ranges=["$(curl -s https://api.ipify.org)/32"]'
```

Capture outputs:

```bash
terraform output -raw postgresql_database_url
terraform output -raw postgres_admin_password
```

Keep these safe (or export them into env vars for seeding).

### 3) Storage for tfstate & secrets: `tf-aks-storage` (separate RG)

This repo includes `tf-aks-storage` to create a dedicated Storage Account and container to safely store Terraform state and sensitive artifacts. We deploy it into its own resource group (`$STORAGE_RG`) so state and storage keys are isolated from the main resources.

Example apply:

```bash
cd tf-aks-storage
terraform init
terraform apply -auto-approve -var="resource_group_name=$STORAGE_RG" -var="location=$LOCATION" -var="storage_account_name=tnwstate<unique>"
```

Outputs you'll use:

```bash
terraform output storage_account_name
terraform output storage_container_name
terraform output storage_account_primary_connection_string  # treat as sensitive
```

Use the storage account/container for Terraform backend in other modules. Example backend config snippet to use in `tf-acr/backend.tf` or when running `terraform init`:

```hcl
backend "azurerm" {
  resource_group_name  = "${STORAGE_RG}"
  storage_account_name = "<storage_account_name>"
  container_name       = "tfstate"
  key                  = "tf-<module>.terraform.tfstate"
}
```

Security note: Do not commit primary connection strings; write them into CI secrets or use managed identity access where possible.


### 4) Provision ACR (demo CI path)

```bash
cd ../tf-acr
terraform init
terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="acr_name=tnwregistry" -var="location=$LOCATION"
```

Capture ACR outputs:

```bash
terraform output -raw acr_login_server
terraform output -raw acr_admin_username
terraform output -raw acr_admin_password
```

Add these three values to GitHub repository secrets only if you plan to use the included admin-based CI workflow. Prefer SP+OIDC in production.

### 5) Create Kubernetes secret for the app (preferred)

Avoid storing DB credentials in GitHub secrets. Create a k8s secret from `postgresql_database_url` locally:

```bash
DB_URL=$(cd ../tf-postgres && terraform output -raw postgresql_database_url)
# Ensure your kubeconfig points to the AKS cluster
kubectl create secret generic tnw-database-url --from-literal=DATABASE_URL="$DB_URL" --namespace default
```

Optional: let `tf-postgres` create the secret if you set `create_k8s_secret=true` (requires kubeconfig where you run Terraform).

### 6) CI build & push (example)

The included GitHub Actions workflow uses ACR admin credentials for a quick demo. It will build, tag and push the image to `${{ secrets.ACR_LOGIN_SERVER }}/tuition-no-worry:${{ github.sha }}`.

If you want a secure production setup, use Service Principal + OIDC or a short-lived SAS token.

### 7) Helm deploy

Create `values-ci.yaml` with the ACR repository and tag. Example:

```yaml
image:
  repository: "<YOUR_ACR_LOGIN_SERVER>/tuition-no-worry"
  tag: "<GITHUB_SHA_OR_TAG>"
secrets:
  databaseSecretName: "tnw-database-url"
dbMigration:
  enableJob: false
```

Install/upgrade:

```bash
helm upgrade --install tnw ./charts/tuition-no-worry -f values-ci.yaml
```

### 8) Seed the DB

Option A — Local seeding (trusted runner):

```bash
export DATABASE_URL="$(cd ./tf-postgres && terraform output -raw postgresql_database_url)"
node ./scripts/run-sql-seed.js ./sql/schema.sql
node ./scripts/run-sql-seed.js ./sql/seed-full.sql
```

Option B — Chart `dbMigration` job:

- Set `dbMigration.enableJob: true` in your values file and run `helm upgrade --install ... -f values.yaml`. This runs a Kubernetes Job inside the cluster to apply schema+seed (cluster must reach the Postgres server).

---

## Verification

- CI: check GitHub Actions run logs for build and push success.
- ACR: `az acr repository list --name <acr>`
- AKS: `kubectl get pods --namespace default` and `kubectl logs <pod>` for troubleshooting.
- DB: use `psql` or a GUI to verify tables and rows.

If you see `password authentication failed for user 'tnw_user'` while seeding, verify the URL contents, and that you're using the admin password vs a custom DB user.

---

## Cleanup

Destroy resources to avoid charges (reverse order):

```bash
cd tf-acr && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-postgres && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-aks && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-aks-storage && terraform destroy -auto-approve -var="resource_group_name=$STORAGE_RG"
```

---

## Security notes

- Do NOT commit `.env` or any files containing secrets. Use `.env.example` for placeholders.
- Prefer storing sensitive artifacts in Azure Key Vault. If you must use storage account keys, keep them in the dedicated storage RG and add them to CI secrets.
- Use SP+OIDC for CI authentication instead of ACR admin credentials.

