<#
Simple helper to run demo tasks safely per-module.
Usage:
  .\scripts\run-tf-demo.ps1 -Module tf-acr
#>
param(
  [string]$Module = 'tf-acr',
  [switch]$Apply,
  [string[]]$TfArgs = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Determine script directory and repo root (scripts/ is one level under the repo root)
$scriptPath = $MyInvocation.MyCommand.Definition
$scriptDir = Split-Path -Parent $scriptPath
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

$modulePath = Join-Path $repoRoot $Module
if (-not (Test-Path $modulePath)) {
  $available = Get-ChildItem -Directory | Where-Object { $_.Name -like 'tf-*' } | ForEach-Object { $_.Name }
  Throw "Module path not found: $modulePath`nAvailable modules: $($available -join ', ')"
}

Push-Location $modulePath
Write-Output "Running terraform fmt -recursive in $Module"
terraform fmt -recursive

Write-Output "Initializing Terraform (using local state for demo: -backend=false)"
# Use local state by default for demos to avoid touching remote backends unless explicitly configured
terraform init -backend=false

Write-Output "Validating Terraform configuration in $Module"
terraform validate

if ($Apply) {
  Write-Output "Applying Terraform in $Module with args: $($TfArgs -join ' ')"
  # Use array splatting so callers can pass multiple args safely, e.g.
  # -TfArgs '-var=resource_group_name=tnw-rg','-var=location=westus'
  terraform apply @TfArgs
}

Pop-Location
Write-Output "Done for $Module"
