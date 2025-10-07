#!/usr/bin/env bash
set -euo pipefail
MODULE=${1:-tf-aks}
pushd "$MODULE" >/dev/null
VNET_ID=$(terraform output -raw vnet_id | tr -d '\r')
AKS_SUBNET_ID=$(terraform output -raw aks_subnet_id | tr -d '\r')
printf "VNET_ID='%s'\n" "$VNET_ID"
printf "AKS_SUBNET_ID='%s'\n" "$AKS_SUBNET_ID"
popd >/dev/null
