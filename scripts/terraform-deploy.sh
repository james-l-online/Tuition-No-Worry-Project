#!/usr/bin/env bash
set -euo pipefail

# Interactive Terraform deploy helper
# - Prompts for workspace (tf-acr, tf-iam, tf-aks, tf-aks-storage)
# - Prompts for backend settings (resource group, storage account, container)
# - Runs terraform init with -backend-config flags, terraform plan and optionally terraform apply
# IMPORTANT: This script will NOT commit any files. Do NOT store secrets in repo files.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

function die() { echo "ERROR: $*" >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || die "terraform CLI is required in PATH"

echo "Repo root: ${ROOT_DIR}"

echo "Select workspace to deploy:" 
PS3="Choose 1-4: "
options=("tf-acr" "tf-iam" "tf-aks" "tf-aks-storage" "quit")
select opt in "${options[@]}"; do
  case $opt in
    "tf-acr"|"tf-iam"|"tf-aks"|"tf-aks-storage") WORKSPACE="$opt"; break;;
    "quit") echo "Aborting."; exit 0;;
    *) echo "Invalid selection";;
  esac
done

cd "${ROOT_DIR}/${WORKSPACE}"
echo "Working in: $(pwd)"

# Backend inputs
read -rp "Backend resource group name (e.g. state-rg): " BACKEND_RG
read -rp "Backend storage account name (e.g. statesa): " BACKEND_SA
read -rp "Backend container name [tfstate]: " BACKEND_CONTAINER
BACKEND_CONTAINER=${BACKEND_CONTAINER:-tfstate}

# Default key per workspace
DEFAULT_KEY="tf-${WORKSPACE}.terraform.tfstate"
read -rp "State key file name [${DEFAULT_KEY}]: " BACKEND_KEY
BACKEND_KEY=${BACKEND_KEY:-${DEFAULT_KEY}}

echo
echo "Optional common terraform variables (format: -var='name=value' -var='name2=value2')"
echo "If you want to pass none, just press Enter."
read -rp "Extra -var options: " EXTRA_VARS

echo
echo "You provided:" 
echo "  workspace: ${WORKSPACE}"
echo "  backend: rg=${BACKEND_RG}, sa=${BACKEND_SA}, container=${BACKEND_CONTAINER}, key=${BACKEND_KEY}"
echo "  extra vars: ${EXTRA_VARS}"

read -rp "Proceed to run terraform init -> plan? (type 'yes' to continue): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted by user."; exit 0
fi

echo "Running terraform init..."
terraform init \
  -backend-config="resource_group_name=${BACKEND_RG}" \
  -backend-config="storage_account_name=${BACKEND_SA}" \
  -backend-config="container_name=${BACKEND_CONTAINER}" \
  -backend-config="key=${BACKEND_KEY}" -reconfigure

PLAN_FILE="tfplan-${WORKSPACE}.bin"
echo "Running terraform plan (output -> ${PLAN_FILE})..."
# Build plan command with optional extra vars
PLAN_CMD=(terraform plan -out="${PLAN_FILE}")
if [[ -n "$EXTRA_VARS" ]]; then
  # shellcheck disable=SC2206
  PLAN_CMD+=($EXTRA_VARS)
fi
"${PLAN_CMD[@]}"

echo "Plan saved to ${PLAN_FILE}. Inspect with 'terraform show ${PLAN_FILE}'"
read -rp "Apply this plan now? (type APPLY to run terraform apply): " APPLY_CONFIRM
if [[ "$APPLY_CONFIRM" == "APPLY" ]]; then
  echo "Applying plan..."
  terraform apply "${PLAN_FILE}"
  echo "Apply complete. Remember to destroy or remove state files if this was a one-time run."
else
  echo "Not applying. You can run: terraform apply ${PLAN_FILE}"
fi

echo "Done."
