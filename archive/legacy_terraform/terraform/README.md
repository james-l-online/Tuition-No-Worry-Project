# Terraform: Azure Resource Group + ACR

Quick notes for users

- Prerequisites:
  - Install Azure CLI and authenticate: `az login`.
  - Install Terraform (>= 1.2.0 recommended).

- What this creates:
  - A Resource Group and an Azure Container Registry (ACR).
  - ACR name = `var.acr_name` + short random suffix (to avoid global name collisions).
  - ACR admin user is enabled so Terraform will output admin credentials for an initial push.

- Safety & secrets (important):
  - Never commit secrets to Git. Use environment variables (`TF_VAR_*`) or your CI secret store.
  - Prefer a Service Principal or Managed Identity for CI pipelines instead of ACR admin credentials.
  - Use a remote Terraform state backend (Azure Storage) for production; local state can leak secrets.

- Quick push example (after `terraform apply`):

  1. Build and tag:
     ```bash
     docker build -t <acr_login_server>/tuitionapp:latest .
     ```
  2. Login:
     ```bash
     docker login <acr_login_server> -u <acr_admin_username> -p <acr_admin_password>
     ```
  3. Push:
     ```bash
     docker push <acr_login_server>/tuitionapp:latest
     ```

- .env.example (local dev):
  - I added a `terraform/.env.example` you can copy to `.env` locally.
  - It demonstrates TF_VAR_* variables and optional ARM_* service principal vars.
  - Never commit your `.env`. Add the following to your repo `.gitignore`:

    ```text
    # terraform local secrets
    terraform/.env
    *.tfvars
    ```

- Next steps I can help with:
  - Add a GitHub Actions workflow to build and push to this ACR using secrets.
  - Replace admin credentials with a Service Principal and show how to set CI secrets.
  - Add Terraform remote state configuration (Azure Storage backend) and instructions.