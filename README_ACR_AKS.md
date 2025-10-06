# Tuition No Worry — Final Demo Guide 

This guide outlines our capstone project simulating a real-world DevOps workflow on Azure Kubernetes Service (AKS). Using a simple Next.js app as a proxy workload, it demonstrates end-to-end practices: provisioning resources, building and publishing images, secure secret management, and Helm-based deployment. Emphasis is placed on security through private PostgreSQL endpoints and Azure Managed Identity for credential-free image pulls.

This demo demonstrates a secure, automated app (to represent microservices for demo) deployment on Azure: infrastructure provisioned with Terraform, images built and stored in ACR, secrets managed privately, and applications deployed to AKS with Helm using managed identities. The focus is on cloud-native DevOps practices rather than application logic.

Key points:

- This demo uses a **private PostgreSQL Flexible Server** with a private endpoint and Private DNS, ensuring the database is only accessible from within the AKS cluster's VNet. This simulates a production-grade, secure database setup.
- **Managed identities** are used for AKS to pull images from ACR, eliminating the need for admin credentials and improving security by granting only the necessary permissions (AcrPull).
- The `tf-aks-storage` module provisions a dedicated storage account in a separate resource group for Terraform state and sensitive artifacts, isolating secrets and state from the main application resources.
- All commands below are Bash.

---

## Goal

Build the Next.js image, push to ACR, deploy to AKS with Helm, and use a private PostgreSQL Flexible Server reachable only from the cluster VNet (private endpoint). Use a UAMI attached to AKS for ACR pull permissions. Use tf-aks-storage (separate RG) to host Terraform backend.

---

## Architecture (short)

- App Docker Container image → ACR
- AKS in VNet (tf-aks)
- Private PostgreSQL Flexible Server with private endpoint & Private DNS (tf-postgres)
- User-assigned managed identity for AKS (tf-iam) granted AcrPull on ACR
- Storage account in separate RG for tfstate (tf-aks-storage)
- Provisioning via Terraform: tf-acr, tf-aks, tf-aks-storage, tf-postgres, tf-iam
- Deployment via Helm: charts/tuition-no-worry

---

## Files / Terraform layout

- `tf-aks/` — VNet, Subnets, AKS cluster
- `tf-acr/` — ACR, (admin enabled for demo)
- `tf-postgres/` — PostgreSQL Flexible Server (public_access toggle + allowed_ip_ranges)
- `tf-aks-storage/` — Storage account + container for Terraform state and secret artifacts. Deploys into a separate resource group (e.g. `tnw-storage-rg`).
- `tf-iam/` — user-assigned managed identity and role assignment (AcrPull for AKS)

App & deploy artifacts

- `Dockerfile`, `docker/entrypoint.sh`
- `sql/schema.sql`, `sql/seed-full.sql`
- `scripts/run-sql-seed.js`
- `charts/tuition-no-worry/` (Helm chart)

---

## Preflight checklist (quick)

1. Install tools and verify:

```bash
# tools
terraform version
az version
docker --version
kubectl version --client
helm version
jq --version || true
```

2. Login to Azure and set subscription

```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID_OR_NAME>"
```

3. Optional: Create an automation Service Principal (for CI)

```bash
az ad sp create-for-rbac \
  --name "tnw-sp" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> \
  --json-auth > tnw-sp.json
```

4. Register resource providers (run once per subscription)

```bash
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.ContainerService
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Network
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

6. Quotas: verify vCPU and SKU availability in `eastasia`

```bash
az vm list-usage --location "$LOCATION" -o table
```

## Quick-demo flow

Follow this order to provision resources and deploy the app.

## Steps (detailed)

### 1) tf-aks-storage (tfstate + storage RG)

```bash
MAIN_RG=tnw-rg
STORAGE_RG=tnw-storage-rg
LOCATION=eastasia
az group create --name "$MAIN_RG" --location "$LOCATION"
az group create --name "$STORAGE_RG" --location "$LOCATION"

cd tf-aks-storage
terraform init

# to ensure no ResourceManagerAccount - no subscriptionID issues
export ARM_SUBSCRIPTION_ID="$SubscriptionId"
terraform apply -auto-approve -var="resource_group_name=$STORAGE_RG" -var="location=$LOCATION" -var="storage_account_name=tnwstate$(date +%s)"

# Capture outputs from tf-aks-storage so other modules can reference the same storage account
STORAGE_ACCOUNT_NAME=$(terraform output -raw storage_account_name)
STORAGE_ACCOUNT_RG=$(terraform output -raw resource_group_name || echo "$STORAGE_RG")
STORAGE_ACCOUNT_CONNSTR=$(terraform output -raw storage_account_primary_connection_string)

Note: The storage account created by `tf-aks-storage` should be used for
Terraform state across the other modules. Apply order recommendation:

1. tf-aks-storage (create storage account and container for tfstate)
2. tf-iam (create UAMI)
3. tf-aks (create VNet, AKS) — pass storage_account_name/storage_account_rg and uami_id as needed
4. tf-acr (create ACR)
5. tf-iam (re-run with acr_resource_id to assign AcrPull to UAMI)
6. tf-postgres (create private PostgreSQL and private endpoint)

This ordering ensures the backend storage exists before other modules try to initialize and that role
assignments can be created after ACR exists.
```

Configure backend (example snippet) and re-run `terraform init` in other modules to use this backend.

### 2) Create the user-assigned managed identity (UAMI)

```bash
# create the UAMI
cd ../tf-iam
terraform init
terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="location=$LOCATION"
$UAMI_ID = terraform output -raw uami_id
$UAMI_PRINCIPAL_ID = terraform output -raw uami_principal_id
```

### 3) Create AKS and attach the UAMI (tf-aks)
## User-Assigned Managed Identity
Pass UAMI_ID into tf-aks so AKS is created with the user-assigned identity.

```bash
cd ../tf-aks

# Create the container (preferred if you have proper RBAC):
az storage container create --name tfstate --account-name <account-storage-name> --auth-mode login

terraform init \
  -backend-config="resource_group_name=tnw-storage-rg" \
  -backend-config="storage_account_name=<your-storage-acc-name>" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=tf-aks.terraform.tfstate"

# supply required root variables via env or -var and import
export TF_VAR_resource_group_name="tnw-rg"
terraform import 'azurerm_resource_group.rg' '/subscriptions/<subscription-id>/resourceGroups/tnw-rg'

terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="location=$LOCATION" -var="uami_id=$UAMI_ID"

# Capture outputs
VNET_ID=$(terraform output -raw vnet_id)
AKS_SUBNET_ID=$(terraform output -raw aks_subnet_id)
```

Notes:

- AKS is created with a user-assigned identity attached; this UAMI will be used to pull from ACR.
- Ensure AKS has system-managed identity enabled if you need it; current setup attaches UAMI for image pull.

### 4) Create ACR (tf-acr)

```bash
ACR_NAME=tnwregistry$RANDOM     # ensure registry name is unique
cd ../tf-acr

terraform init \
  -backend-config="resource_group_name=tnw-storage-rg" \
  -backend-config="storage_account_name=<THE_STATE_ACCOUNT_NAME>" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=tf-acr.terraform.tfstate"

terraform import \
  -var="resource_group_name=$MAIN_RG" \
  azurerm_resource_group.rg /subscriptions/<$SUBSCRIPTION_ID>/resourceGroups/$MAIN_RG

terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="acr_name=$ACR_NAME" -var="location=$LOCATION"
ACR_ID=$(terraform output -raw acr_resource_id)
ACR_LOGIN=$(terraform output -raw acr_login_server)
```

### 5) Grant AcrPull to the UAMI (re-run tf-iam or use dedicated role assignment)

Run tf-iam again (it will create the role assignment if `acr_resource_id` is provided):

```bash
cd ../tf-iam
terraform apply -auto-approve -var="resource_group_name=$MAIN_RG" -var="location=$LOCATION" -var="identity_name=$IDENTITY_NAME" -var="acr_resource_id=$ACR_ID"
```

Verify role assignment:

```bash
# using the output for uami_principal_id
UAMI_PRINCIPAL_ID="<uami-princpal-id from output>"
az role assignment list --assignee "$UAMI_PRINCIPAL_ID" --scope "$ACR_ID" -o table
```

### 6) Provision PostgreSQL Flexible Server with private endpoint (tf-postgres)

Ensure you pass the AKS VNet ID and a subnet for the private endpoint (pe_subnet_id). Use the VNet created by tf-aks or a peered VNet.

```bash
PG_SERVER=tnw-pg-private-$RANDOM
cd ../tf-postgres
terraform init
terraform apply -auto-approve \
  -var="resource_group_name=$MAIN_RG" \
  -var="server_name=$PG_SERVER" \
  -var="public_access=false" \
  -var="vnet_id=$VNET_ID" \
  -var="pe_subnet_id=$PE_SUBNET_ID" \
  -var="create_k8s_secret=false"
```

Capture DB output:

```bash
DB_URL=$(terraform output -raw postgresql_database_url)
```

Notes:

- The module creates a Private Endpoint and a Private DNS zone (privatelink.postgres.database.azure.com) linked to the AKS VNet so pods will resolve the DB FQDN to the private IP.
- If you want Terraform to create the k8s secret automatically, rerun with `-var="create_k8s_secret=true"` and ensure kubeconfig points to the AKS cluster.

### 7) Create Kubernetes secret (manual, recommended)

Run this from a machine that has kubeconfig for the AKS cluster (or use a pod/jumpbox in the VNet):

```bash
kubectl create secret generic tnw-database-url --from-literal=DATABASE_URL="$DB_URL" --namespace default
```

### 8) CI build/push & deploy

- CI should build the Docker image and push to ACR. Prefer SP+OIDC; for quick demo you can use ACR admin creds (less secure).
- Example Helm values (values-ci.yaml):

```yaml
image:
  repository: "<YOUR_ACR_LOGIN_SERVER>/tuition-no-worry"
  tag: "<GITHUB_SHA_OR_TAG>"
secrets:
  databaseSecretName: "tnw-database-url"
dbMigration:
  enableJob: true  # runs seeder as a job inside cluster (recommended for private DB)
```

Deploy:

```bash
helm upgrade --install tnw ./charts/tuition-no-worry -f values-ci.yaml
```

If `dbMigration.enableJob: true`, the Job runs inside the cluster and will reach the private Postgres endpoint.

## Verification

- Confirm UAMI role assignment and ACR access.
- Pod image pulls: check `kubectl describe pod <pod>` and `kubectl logs`.
- DNS inside cluster resolves the Postgres FQDN to a private IP (run a debug pod and `nslookup <pg-fqdn>`).

## Cleanup (reverse order)

```bash
cd tf-acr && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-postgres && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-aks && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
cd tf-aks-storage && terraform destroy -auto-approve -var="resource_group_name=$STORAGE_RG"
cd tf-iam && terraform destroy -auto-approve -var="resource_group_name=$MAIN_RG"
```

## Security notes

- Create UAMI first and attach to AKS for least-privilege pulls.
- Create ACR before role assignment step so the AcrPull role can be granted.
- Private endpoint isolates DB from internet; seed & admin operations must run inside VNet or via trusted jumpbox.
- Use UAMI for least-privilege image pulls. For production CI, use OIDC/SP to obtain tokens (no long-lived secrets).
- Store secrets in Key Vault where possible. Use tf-aks-storage only for tfstate and artifacts, not for long-term secret storage unless keys are protected.
