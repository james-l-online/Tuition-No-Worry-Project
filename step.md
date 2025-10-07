# Terraform & AKS bootstrap runbook (bash)

This file contain steps to initialize the Terraform modules and deploy the app to AKS. 

follow these commands manually.

## Assumptions

- You have Azure CLI (`az`), Docker, Terraform, Helm, and kubectl installed and available on your PATH.
- You're authenticated with `az login` (or you'll use service principal credentials) and have the subscription you want to use.

---

## High level order

1. Authenticate and set subscription
2. Bootstrap backend state storage (`tf-aks-storage`)
3. Initialize remote backend for modules and apply in order: `tf-acr` -> `tf-iam` -> `tf-postgres` -> `tf-aks`
4. Get kubeconfig and attach ACR to AKS
5. Build/push Docker image to ACR
6. Deploy Helm chart
7. Seed database and verify

---

## Full Runbook

### 1) Authenticate and set subscription

```bash
az login
# if multiple subscriptions:
az account set --subscription "YOUR_SUBSCRIPTION_ID_OR_NAME"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

### 2) Bootstrap backend storage (tf-aks-storage)

```bash
cd tf-aks-storage

# pick names (change as needed)
export TF_STATE_RG="tnw-storage-rg"
export TF_STATE_LOCATION="eastus"
export TF_STATE_SA="tnwstate$RANDOM"  # ensure lowercase, unique
export TF_STATE_CONTAINER="tfstate"

# create RG and storage account
az group create -n "$TF_STATE_RG" -l "$TF_STATE_LOCATION"
az storage account create -n "$TF_STATE_SA" -g "$TF_STATE_RG" -l "$TF_STATE_LOCATION" --sku Standard_LRS

# create container for tfstate
export SA_KEY=$(az storage account keys list -g "$TF_STATE_RG" -n "$TF_STATE_SA" --query "[0].value" -o tsv)
az storage container create --name "$TF_STATE_CONTAINER" --account-name "$TF_STATE_SA" --account-key "$SA_KEY"

# backend variables for later
export TF_BACKEND_RG="$TF_STATE_RG"
export TF_BACKEND_SA="$TF_STATE_SA"
export TF_BACKEND_CONTAINER="$TF_STATE_CONTAINER"
export TF_BACKEND_KEY="tf-aks.tfstate"
```

### 3) Initialize `tf-aks-storage` module (manage storage via Terraform)

```bash
# If you want Terraform to manage the storage account resource itself
terraform init
tf_plan="plan.tfplan"
terraform plan -out $tf_plan
terraform apply $tf_plan

# If you created storage via az cli above and don't want TF to manage it, you may skip apply here.
```

### 4) Initialize other modules with remote backend & apply (example sequence)

Replace `<key>` per module (unique tfstate key per module). Use `-var="location=eastus"` or `-var-file` as needed.

```bash
# ACR
cd ../tf-acr
terraform init \
  -backend-config="resource_group_name=${TF_BACKEND_RG}" \
  -backend-config="storage_account_name=${TF_BACKEND_SA}" \
  -backend-config="container_name=${TF_BACKEND_CONTAINER}" \
  -backend-config="key=tf-acr.tfstate"
terraform plan -out plan.tfplan -var="location=eastus"
terraform apply plan.tfplan

# IAM (UAMI)
cd ../tf-iam
terraform init \
  -backend-config="resource_group_name=${TF_BACKEND_RG}" \
  -backend-config="storage_account_name=${TF_BACKEND_SA}" \
  -backend-config="container_name=${TF_BACKEND_CONTAINER}" \
  -backend-config="key=tf-iam.tfstate"
terraform plan -out plan.tfplan -var="location=eastus"
terraform apply plan.tfplan

# Postgres
cd ../tf-postgres
terraform init \
  -backend-config="resource_group_name=${TF_BACKEND_RG}" \
  -backend-config="storage_account_name=${TF_BACKEND_SA}" \
  -backend-config="container_name=${TF_BACKEND_CONTAINER}" \
  -backend-config="key=tf-postgres.tfstate"
terraform plan -out plan.tfplan -var="location=eastus"
terraform apply plan.tfplan

# AKS
cd ../tf-aks
terraform init \
  -backend-config="resource_group_name=${TF_BACKEND_RG}" \
  -backend-config="storage_account_name=${TF_BACKEND_SA}" \
  -backend-config="container_name=${TF_BACKEND_CONTAINER}" \
  -backend-config="key=tf-aks.tfstate"
terraform plan -out plan.tfplan -var="location=eastus"
terraform apply plan.tfplan
```

> Note: Inspect each `terraform plan` carefully before `apply`.

### 5) Get kubeconfig and attach ACR to AKS

```bash
# Replace these with outputs from your TF runs
AKS_RG="<aks-resource-group>"
AKS_NAME="<aks-cluster-name>"
ACR_NAME="<acr-name>"

az aks get-credentials --resource-group "$AKS_RG" --name "$AKS_NAME"
az aks update -n "$AKS_NAME" -g "$AKS_RG" --attach-acr "$ACR_NAME"
kubectl get nodes
```

### 6) Build, tag, push Docker image to ACR

```bash
ACR_LOGIN_SERVER=$(az acr show -n $ACR_NAME -g $AKS_RG --query loginServer -o tsv)
IMAGE="${ACR_LOGIN_SERVER}/tuition-no-worry:$(git rev-parse --short HEAD)"
docker build -t "$IMAGE" .
az acr login -n $ACR_NAME
docker push "$IMAGE"
```

### 7) Helm deploy (values override)

```bash
cd charts/tuition-no-worry
cat > values-override.yaml <<EOF
image:
  repository: ${ACR_LOGIN_SERVER}/tuition-no-worry
  tag: "$(git rev-parse --short HEAD)"
env:
  DATABASE_URL: "postgresql://<user>:<pass>@<postgres-host>:5432/<db>?schema=public&sslmode=disable"
  SQL_SEED_ON_START: "false"
EOF

helm upgrade --install tuition-no-worry . -n default --create-namespace -f values-override.yaml
kubectl -n default rollout status deployment/tuition-no-worry
```

### 8) Seed DB using image (ephemeral job)

```bash
kubectl -n default run seed-job --rm --restart=OnFailure --image=${ACR_LOGIN_SERVER}/tuition-no-worry:$(git rev-parse --short HEAD) -- /bin/sh -c "node scripts/run-sql-seed.js sql/seed-full.sql"
```

### 9) Quick checks

```bash
kubectl -n default get pods,svc,ingress
kubectl -n default logs deployment/tuition-no-worry -f
```

---

## Notes & tips

- Always run `terraform plan` and inspect before `apply`.
- If backends already exist, `terraform init` may prompt to migrate local state to remote; approve when expected.
- Use `-var-file` to pass non-sensitive settings and env vars for ARM credentials in CI.
- Consider storing secrets in Azure Key Vault and using external-secrets or Helm/K8s secrets rather than plaintext in `values-override.yaml`.

---