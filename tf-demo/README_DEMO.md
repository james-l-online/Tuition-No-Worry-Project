# Terraform Demo (snapshot)

This small README explains how to safely run the Terraform demo from the `demo/tf-snapshot` branch.

Important safety notes
- Do NOT run these against your production subscription.
- Use a dedicated subscription or resource group for demo runs.
- Prefer to use an isolated backend (or local run) and never commit secrets to VCS.

Quick steps (PowerShell / pwsh)

1. Checkout the demo branch:

```powershell
# from the repo root
git checkout demo/tf-snapshot
```

2. Optional: run `terraform fmt` across the tf-* folders (if Terraform is installed):

```powershell
# Run in repo root in pwsh
Get-ChildItem -Directory | Where-Object { $_.Name -like 'tf-*' } | ForEach-Object {
  Push-Location $_.FullName
  terraform fmt -recursive
  Pop-Location
}
```

3. Initialize and validate per module (example for tf-acr) — pass backend config or use local backend for demos:

```powershell
# Example for tf-acr folder
Set-Location .\tf-acr
# If you have an Azure backend, provide -backend-config flags. For local demo, omit backend flags.
terraform init
terraform validate
```

4. If you plan to `apply` during the demo, do it intentionally and provide `-auto-approve` only for the demo run where acceptable:

```powershell
# Plan and apply (example)
terraform plan -out=tfplan
terraform apply tfplan
```

5. After the demo: if you want to stop tracking .tf files on `starter`, decide and run the suggested untrack steps (documented elsewhere in the repo or ask me to perform them).

If you want, I can run the formatting and commit the README for you on the demo branch. Otherwise paste the `fmt` snippet above into your terminal to run locally.
