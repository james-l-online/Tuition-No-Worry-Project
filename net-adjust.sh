#!/bin/bash

#!/usr/bin/env bash
set -euo pipefail

# --- required env vars (must already be exported) ---
: "${MAIN_RG:?export MAIN_RG}"
: "${VNET_NAME:?export VNET_NAME}"
: "${LOCATION:?export LOCATION}"
: "${SUBSCRIPTION:?export SUBSCRIPTION}"
# optional: VNET_ID may be used later
VNET_ID=${VNET_ID:-$(az network vnet show -g "$MAIN_RG" -n "$VNET_NAME" --query id -o tsv | tr -d '\r\n')}

echo "Using MAIN_RG=$MAIN_RG VNET_NAME=$VNET_NAME LOCATION=$LOCATION"

# 1) Choose a free /24 prefix inside 10.1.0.0/16 (starting at 10.1.4.0/24)
BASE="10.1"
START=4
END=60
FOUND_PREFIX=""
for i in $(seq $START $END); do
  candidate="${BASE}.${i}.0/24"
  # get list of existing prefixes
  if az network vnet show -g "$MAIN_RG" -n "$VNET_NAME" --query "subnets[].addressPrefix" -o tsv | grep -qx "$candidate"; then
    echo "Prefix $candidate already exists, skipping..."
    continue
  else
    FOUND_PREFIX="$candidate"
    break
  fi
done

if [ -z "$FOUND_PREFIX" ]; then
  echo "No free /24 found in range ${BASE}.${START}.0/24 - ${BASE}.${END}.0/24. Pick another range and aborting."
  exit 1
fi

PE_SUBNET_NAME="db-pe-subnet"
echo "Selected free prefix $FOUND_PREFIX for new private-endpoint subnet '$PE_SUBNET_NAME'."

# 2) Create the new non-delegated subnet for private endpoints
echo "Creating subnet $PE_SUBNET_NAME with prefix $FOUND_PREFIX..."
az network vnet subnet create \
  -g "$MAIN_RG" \
  --vnet-name "$VNET_NAME" \
  -n "$PE_SUBNET_NAME" \
  --address-prefix "$FOUND_PREFIX" \
  --disable-private-link-service-network-policies false >/dev/null

# Note: we do not set any delegation here (private endpoints require non-delegated subnet)

# 3) Fetch canonical id and trim any CRLF
PE_SUBNET_ID=$(az network vnet subnet show -g "$MAIN_RG" --vnet-name "$VNET_NAME" -n "$PE_SUBNET_NAME" --query id -o tsv | tr -d '\r\n')
echo "Created subnet id: $PE_SUBNET_ID"

# 4) Export TF_VAR so Terraform uses the new subnet
export TF_VAR_pe_subnet_id="$PE_SUBNET_ID"
export TF_VAR_vnet_id="${TF_VAR_vnet_id:-$VNET_ID}"
echo "Exported TF_VAR_pe_subnet_id and TF_VAR_vnet_id."

# 5) Run targeted terraform plan + apply to create private endpoint + DNS link
cd tf-postgres || { echo "tf-postgres directory not found"; exit 1; }
terraform init -input=false

# server_name must match your existing server; use the one you provided earlier
SERVER_NAME="${SERVER_NAME:-tnw-pg-private-22002}"
echo "Targeting server: $SERVER_NAME"

terraform plan -out=plan.pe.tfplan \
  -target=azurerm_private_dns_zone_virtual_network_link.pg_dns_link \
  -target=azurerm_private_endpoint.pg_pe \
  -var="server_name=${SERVER_NAME}" \
  -var="vnet_id=${TF_VAR_vnet_id}" \
  -var="pe_subnet_id=${TF_VAR_pe_subnet_id}" \
  -var="location=${LOCATION}" \
  -var="resource_group_name=${MAIN_RG}" \
  -input=false

echo "Applying plan..."
terraform apply plan.pe.tfplan

# 6) Verify
echo "Verifying results..."
az network private-endpoint list -g "$MAIN_RG" -o table
az network private-dns link vnet list -g "$MAIN_RG" -o table

PG_NAME=$(az postgres flexible-server list -g "$MAIN_RG" --query "[?contains(name, 'tnw-pg')].name | [0]" -o tsv || true)
if [ -n "$PG_NAME" ]; then
  echo "Checking private DNS A record for $PG_NAME..."
  az network private-dns record-set a show -g "$MAIN_RG" -z "privatelink.postgres.database.azure.com" -n "$PG_NAME" -o json || true
else
  echo "Could not auto-detect PG_NAME; run: az postgres flexible-server list -g $MAIN_RG -o table"
fi

echo "Done."
