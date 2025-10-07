# Complete Terraform + Network + AKS workflow (bash)

Minimal, single-file workflow integrating networking, private Postgres, ACR, AKS, Helm and DB seed.

Follow manually. One command per line. Inspect plans before apply.

---

## Variables (edit as needed)

Short: define reusable names and locations used by the entire workflow. Edit these values to match your subscription and naming conventions. These environment variables are referenced by later commands so update before running.

```bash
export SUBSCRIPTION="YOUR_SUBSCRIPTION_ID_OR_NAME"
export LOCATION="eastus"
export TF_STATE_RG="tnw-storage-rg"           # state-only RG
export MAIN_RG="tnw-main"                    # all other resources
export VNET_NAME="tnw-vnet"
export AKS_SUBNET="aks-subnet"
export DB_SUBNET="db-subnet"
export ACR_SUBNET="acr-subnet"
export NSG_NAME="tnw-nsg"
export NAT_NAME="tnw-nat"
export PIP_NAME="tnw-nat-ip"
export TF_BACKEND_CONTAINER="tfstate"
```

---

## Authenticate and select subscription

Short: authenticate your CLI session and select which Azure subscription Terraform/az will operate in. This ensures commands and resource creation use the correct tenant and subscription.

```bash
az login
az account set --subscription "$SUBSCRIPTION"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

---

## Create resource groups

Short: create two groups: one for Terraform state (already defined in TF steps) and one for all deployed resources. Keep state RG separate for security and lifecycle isolation.

```bash
az group create -n "$TF_STATE_RG" -l "$LOCATION"
az group create -n "$MAIN_RG" -l "$LOCATION"
```

---

## Create networking: VNet, subnets, NSG, NAT

Short: build the virtual network and subnets for AKS, Postgres, and ACR. Add an NSG for basic ingress/egress rules and NAT for stable outbound IPs. These steps prepare the private network where your resources will reside.

```bash
# Create VNet and initial AKS subnet (10.1.1.0/24)
az network vnet create -g "$MAIN_RG" -n "$VNET_NAME" --address-prefixes 10.1.0.0/16 --subnet-name "$AKS_SUBNET" --subnet-prefix 10.1.1.0/24

# Create DB subnet and delegate it for PostgreSQL flexible server
az network vnet subnet create -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$DB_SUBNET" --address-prefix 10.1.2.0/24 --delegations "Microsoft.DBforPostgreSQL/flexibleServers"

# Create subnet for ACR private endpoint and registry access
az network vnet subnet create -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$ACR_SUBNET" --address-prefix 10.1.3.0/24

# Create a Network Security Group for subnet rules
az network nsg create -g "$MAIN_RG" -n "$NSG_NAME"

# Allow inbound HTTP/HTTPS (ingress for app/load balancer)
az network nsg rule create -g "$MAIN_RG" --nsg-name "$NSG_NAME" -n Allow-HTTP-HTTPS --priority 100 --access Allow --direction Inbound --protocol Tcp --source-address-prefixes Internet --destination-port-ranges 80 443

# Allow outbound internet access for updates and external services
az network nsg rule create -g "$MAIN_RG" --nsg-name "$NSG_NAME" -n Allow-Internet-Out --priority 200 --access Allow --direction Outbound --protocol '*' --destination-address-prefixes Internet --destination-port-ranges '*'

# Associate NSG with AKS subnet to enforce the rules
az network vnet subnet update -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$AKS_SUBNET" --network-security-group "$NSG_NAME"
# Associate NSG with DB subnet to protect the database
az network vnet subnet update -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$DB_SUBNET" --network-security-group "$NSG_NAME"
# Associate NSG with ACR subnet to control registry access
az network vnet subnet update -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$ACR_SUBNET" --network-security-group "$NSG_NAME"

# Create a static public IP to use with the NAT gateway (stable egress)
az network public-ip create -g "$MAIN_RG" -n "$PIP_NAME" --sku Standard --allocation-method Static
# Create NAT gateway and attach the public IP for outbound from subnets
az network nat gateway create -g "$MAIN_RG" -n "$NAT_NAME" --public-ip-addresses "$PIP_NAME" --idle-timeout 10
# Attach NAT gateway to AKS subnet so cluster nodes use NAT for outbound
az network vnet subnet update -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$AKS_SUBNET" --nat-gateway "$NAT_NAME"


# IDs
# Save VNet id to pass into Terraform modules
export VNET_ID=$(az network vnet show -g "$MAIN_RG" -n "$VNET_NAME" --query id -o tsv)

# Save DB subnet id for private endpoint / Postgres
export DB_SUBNET_ID=$(az network vnet subnet show -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$DB_SUBNET" --query id -o tsv)

# Save AKS subnet id for AKS cluster deployment
export AKS_SUBNET_ID=$(az network vnet subnet show -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$AKS_SUBNET" --query id -o tsv)

# Save ACR subnet id for ACR private endpoint
export ACR_SUBNET_ID=$(az network vnet subnet show -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$ACR_SUBNET" --query id -o tsv)
```

---

## Bootstrap backend storage for Terraform state

Short: provision or prepare an Azure Storage account and blob container to store Terraform state remotely. This centralizes state so multiple operators and CI can coordinate safely.

```bash
cd tf-aks-storage
export TF_STATE_SA="tnwstate$RANDOM"

az storage account create -g "$TF_STATE_RG" -n "$TF_STATE_SA" -l "$LOCATION" --sku Standard_LRS
export SA_KEY=$(az storage account keys list -g "$TF_STATE_RG" -n "$TF_STATE_SA" --query '[0].value' -o tsv)
az storage container create --name "$TF_BACKEND_CONTAINER" --account-name "$TF_STATE_SA" --account-key "$SA_KEY"
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
cd ..
```

---

## Apply ACR and create private endpoint in `acr-subnet`

Short: deploy Azure Container Registry and create a private endpoint inside the ACR subnet so registry traffic stays on the VNet. Also create a private DNS zone so cluster nodes resolve the private ACR endpoint.

```bash
cd tf-acr
terraform init -backend-config="resource_group_name=${TF_STATE_RG}" -backend-config="storage_account_name=${TF_STATE_SA}" -backend-config="container_name=${TF_BACKEND_CONTAINER}" -backend-config="key=tf-acr.tfstate"
terraform plan -out plan.tfplan -var="location=$LOCATION" -var="resource_group_name=$MAIN_RG"
terraform apply plan.tfplan

# get ACR details
export ACR_NAME=$(terraform output -raw acr_name 2>/dev/null || az acr list -g "$MAIN_RG" --query "[0].name" -o tsv)
export ACR_ID=$(az acr show -n "$ACR_NAME" -g "$MAIN_RG" --query id -o tsv)

# create private endpoint
az network private-endpoint create -g "$MAIN_RG" -n acr-pe --vnet-name "$VNET_NAME" --subnet "$ACR_SUBNET" --private-connection-resource-id "$ACR_ID" --group-ids registry

# private dns
az network private-dns zone create -g "$MAIN_RG" -n "privatelink.azurecr.io"
az network private-dns link vnet create -g "$MAIN_RG" -n acr-dns-link -z "privatelink.azurecr.io" -v "$VNET_ID" --registration-enabled false

cd ..
```

---

## Apply Postgres (private) using `DB_SUBNET_ID`

Short: deploy a private PostgreSQL flexible server inside the DB subnet and create a private endpoint. This keeps DB traffic internal to the VNet and prevents public exposure.

```bash
cd tf-postgres
terraform init -backend-config="resource_group_name=${TF_STATE_RG}" -backend-config="storage_account_name=${TF_STATE_SA}" -backend-config="container_name=${TF_BACKEND_CONTAINER}" -backend-config="key=tf-postgres.tfstate"
terraform plan -out plan.tfplan -var="location=$LOCATION" -var="resource_group_name=$MAIN_RG" -var="vnet_id=${VNET_ID}" -var="pe_subnet_id=${DB_SUBNET_ID}"
terraform apply plan.tfplan
cd ..
```

---

## Apply IAM (UAMI) and AKS (in AKS subnet)

Short: create the user-assigned managed identity (UAMI) for AKS to access ACR etc., then deploy AKS into the AKS subnet so cluster nodes run inside the VNet. Pass subnet IDs to ensure proper network placement.

```bash
cd tf-iam
terraform init -backend-config="resource_group_name=${TF_STATE_RG}" -backend-config="storage_account_name=${TF_STATE_SA}" -backend-config="container_name=${TF_BACKEND_CONTAINER}" -backend-config="key=tf-iam.tfstate"
terraform plan -out plan.tfplan -var="location=$LOCATION" -var="resource_group_name=$MAIN_RG"
terraform apply plan.tfplan
cd ..

cd tf-aks
terraform init -backend-config="resource_group_name=${TF_STATE_RG}" -backend-config="storage_account_name=${TF_STATE_SA}" -backend-config="container_name=${TF_BACKEND_CONTAINER}" -backend-config="key=tf-aks.tfstate"
terraform plan -out plan.tfplan -var="location=$LOCATION" -var="resource_group_name=$MAIN_RG" -var="vnet_id=${VNET_ID}" -var="aks_subnet_id=${AKS_SUBNET_ID}"
terraform apply plan.tfplan
cd ..
```

---

## Post-apply: kubeconfig, attach ACR, private DNS linking

Short: fetch kubeconfig to operate the cluster, grant AKS permission to pull images from ACR, and ensure private DNS zones for Postgres/ACR are linked to the VNet so resources resolve correctly.

```bash
# get AKS and ACR names (from TF outputs or az)
AKS_NAME=$(terraform -chdir=tf-aks output -raw aks_name 2>/dev/null || echo "<aks-name>")
az aks get-credentials --resource-group "$MAIN_RG" --name "$AKS_NAME"
az aks update -n "$AKS_NAME" -g "$MAIN_RG" --attach-acr "$ACR_NAME"

# ensure Postgres private DNS is linked (TF may handle this)
az network private-dns zone create -g "$MAIN_RG" -n "privatelink.postgres.database.azure.com"
az network private-dns link vnet create -g "$MAIN_RG" -n pg-dns-link -z "privatelink.postgres.database.azure.com" -v "$VNET_ID" --registration-enabled false
```

---

## Build/push image & Helm deploy

Short: build your app image, push to the (private) ACR, then install/upgrade the Helm chart in the cluster. Values should point to the private DB hostname and image in ACR.

```bash
ACR_LOGIN_SERVER=$(az acr show -n "$ACR_NAME" -g "$MAIN_RG" --query loginServer -o tsv)
IMAGE="${ACR_LOGIN_SERVER}/tuition-no-worry:$(git rev-parse --short HEAD)"
docker build -t "$IMAGE" .
az acr login -n "$ACR_NAME"
docker push "$IMAGE"

cd charts/tuition-no-worry
cat > values-override.yaml <<EOF
image:
  repository: ${ACR_LOGIN_SERVER}/tuition-no-worry
  tag: "$(git rev-parse --short HEAD)"
env:
  DATABASE_URL: "postgresql://<user>:<pass>@<postgres-private-hostname>:5432/<db>?schema=public&sslmode=disable"
  SQL_SEED_ON_START: "false"
EOF

helm upgrade --install tuition-no-worry . -n default --create-namespace -f values-override.yaml
kubectl -n default rollout status deployment/tuition-no-worry
```

---

## Seed DB and verify

Short: run the SQL seed using an ephemeral pod/job that has network access to the private Postgres, then check pods and logs to confirm the app is healthy.

```bash
kubectl -n default run seed-job --rm --restart=OnFailure --image=${ACR_LOGIN_SERVER}/tuition-no-worry:$(git rev-parse --short HEAD) -- /bin/sh -c "node scripts/run-sql-seed.js sql/seed-full.sql"
#   
kubectl -n default get pods,svc,ingress
kubectl -n default logs deployment/tuition-no-worry -f
```

---

## Quick checks

Short: quick validations: list private endpoints, run DNS lookups from a pod to confirm private resolution, and ensure the cluster can pull images and reach the DB.

```bash
az network private-endpoint list -g "$MAIN_RG" -o table
kubectl -n default run -i --tty dns-test --image=busybox --restart=Never -- sh
# inside pod: nslookup <acr-private-fqdn> ; nslookup <postgres-private-fqdn>
```

---

## Notes

- If modules don't accept vnet/subnet variables, add variables or use az cli-created network and pass IDs where possible.
- Always inspect `terraform plan` output.
- Tighten NSG rules for production.

---

End of workflow