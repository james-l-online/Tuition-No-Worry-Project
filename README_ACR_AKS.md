# Tuition No Worry — Demo Deployment (ACR + AKS + Public Postgres)

This guide is designed for my capstone project and provides a step-by-step showcase of provisioning Azure resources (AKS, ACR, PostgreSQL Flexible Server), pushing a container image, managing secrets, and deploying with Helm. It demonstrates a public-access PostgreSQL server setup for learning purposes, with recommendations for securing access.

---

## Goal

Build the Next.js app image, push it to Azure Container Registry (ACR), and deploy to AKS using Helm. Provision a PostgreSQL Flexible Server (public-access) and wire the app to it using a Kubernetes secret. Keep security best-practices in mind (firewall rules, SSL, secret management).

---

## Architecture (short)
- App: Next.js (TypeScript) built into a Docker image via `Dockerfile`.
- Registry: Azure Container Registry (ACR) in `eastasia` (created by `tf-acr`).
- Cluster: AKS created by `tf-aks` (VNet + Subnet + AKS cluster).
- Database: Azure Database for PostgreSQL — Flexible Server (public-access by default for this demo) created by `tf-postgres`.
- Deployment: Helm chart at `charts/tuition-no-worry` with `values.yaml` to configure image and db seeding.

---

## Files / Terraform layout (what to show)
- `tf-acr/` — create ACR (admin enabled for demo) and outputs:
  - `acr_login_server` (login server)
  - `acr_resource_id` (resource id)
  - `acr_admin_username` and `acr_admin_password` (sensitive)

- `tf-aks/` — provisions VNet/subnet and AKS cluster (eastasia)

- `tf-postgres/` — provisions PostgreSQL Flexible Server. Set `public_access=true` and pass `allowed_ip_ranges` to limit public access. The module outputs `postgresql_database_url` and an admin password (sensitive).

- `tf-iam/` — user-assigned managed identity and `AcrPull` role assignment (optional; useful for production image pulls)

- `tf-aks-storage/` — storage account and outputs (optional)

- App & Deploy artifacts:
  - `Dockerfile` — multi-stage image for Next.js
  - `docker/entrypoint.sh` — waits for Postgres, constructs DATABASE_URL, optionally runs SQL seed
  - `sql/schema.sql`, `sql/seed-full.sql` — consolidated SQL schema and seed
  - `scripts/run-sql-seed.js` — Node script to run SQL files against DATABASE_URL
  - `charts/tuition-no-worry/values.yaml` — Helm values (image repository, tag, dbMigration job, secrets)

---

## Prerequisites
- Terraform >= 1.2
- Azure CLI (`az`) and a subscription with appropriate permissions
- Docker
- kubectl and Helm
- Bash or PowerShell for the commands below
- (Optional) kubeconfig access to AKS if you want Terraform to create the K8s secret directly
** Before starting please ensure you have done the necessary steps in README_AZURE-PREFLIGHT.md
---

## Quick-demo flow (public Postgres path)

This flow is designed to be quick to run while maintaining reasonable security via firewall restrictions.

### 1) Provision network & AKS

Open a shell and run:

```bash
cd ./tf-aks
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="location=eastasia"
```

Take note of the VNet and subnet IDs if you plan to use private endpoints later. For this public demo you can skip private endpoint details.

### 2) Provision public PostgreSQL Flexible Server

We recommend you restrict access using `allowed_ip_ranges`. For an open demo you can keep the list broader, but it's not recommended for production.

```bash
cd ./tf-postgres
terraform init
terraform apply -auto-approve \
  -var="resource_group_name=tnw-rg" \
  -var="server_name=tnw-pg-public-<unique>" \
  -var="public_access=true" \
  -var='allowed_ip_ranges=["203.0.113.0/24"]'
```

After the apply run:

```bash
terraform output -raw postgresql_database_url
terraform output -raw postgres_admin_password  # sensitive
```

Save these values securely (or export them locally into env vars if seeding locally).

### 3) Provision ACR (demo CI path)

```bash
cd ../tf-acr
terraform init
terraform apply -auto-approve -var="resource_group_name=tnw-rg" -var="acr_name=tnwregistry" -var="location=eastasia"
```

Capture outputs (for CI):

```bash
terraform output acr_login_server
terraform output acr_admin_username
terraform output -raw acr_admin_password
```

Add these three values to GitHub repository secrets if you plan to use the included CI workflow.

### 4) Create Kubernetes secret for the app

Recommended: do not put the DB URL directly into GitHub Secrets. Create a k8s secret from the Terraform output:

```bash
DB_URL=$(cd ../tf-postgres && terraform output -raw postgresql_database_url)
kubectl create secret generic tnw-database-url --from-literal=DATABASE_URL="$DB_URL" --namespace default
```

Optional: let Terraform create the secret by setting `create_k8s_secret=true` in `tf-postgres` (requires kubeconfig access where you run Terraform).

### 5) CI build & push (example)

Push to `starter` branch to trigger `.github/workflows/acr-admin-build-push.yml`. The workflow will:
- Build Docker image
- Login to ACR using admin credentials
- Tag and push image to `${{ secrets.ACR_LOGIN_SERVER }}/tuition-no-worry:${{ github.sha }}`

If you prefer not to use admin credentials for CI, switch to a Service Principal + OIDC (I can help scaffold that).

### 6) Helm deploy

Create a `values-ci.yaml` that points to the ACR image and references `tnw-database-url` as the database secret:

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

### 7) Seed the DB

Option A: run the chart's dbMigration job by setting `dbMigration.enableJob: true`.

Option B: run seeder from a trusted runner using Terraform output:

```bash
export DATABASE_URL="$(cd ../tf-postgres && terraform output -raw postgresql_database_url)"
node ./scripts/run-sql-seed.js ./sql/schema.sql
node ./scripts/run-sql-seed.js ./sql/seed-full.sql
```

---

## Verification

- CI run: ensure the GitHub Actions run shows build and push succeed.
- ACR: confirm image exists via `az acr repository list --name <acr>`.
- AKS: `kubectl get pods` — pods should come up; `kubectl logs` for troubleshooting.
- DB: query tables to confirm seed applied.

---

## Cleanup

Destroy resources in each `tf-*` folder when finished:

```bash
cd tf-acr && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
cd tf-postgres && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
cd tf-aks && terraform destroy -auto-approve -var="resource_group_name=tnw-rg"
```

---
