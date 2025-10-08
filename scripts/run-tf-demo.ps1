<#
Simple helper to run demo tasks safely per-module.
Usage:
  .\scripts\run-tf-demo.ps1 -Module tf-acr
#>
param(
    [string]$Module = 'tf-acr'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

$modulePath = Join-Path $root $Module
if (-not (Test-Path $modulePath)) {
    Throw "Module path not found: $modulePath"
}

Push-Location $modulePath
Write-Output "Running terraform fmt -recursive in $Module"
terraform fmt -recursive

Write-Output "Initializing Terraform (no backend configured by default)"
# For demos, use local state or supply -backend-config flags as needed
terraform init

Write-Output "Validating Terraform configuration in $Module"
terraform validate

Pop-Location
Write-Output "Done for $Module"
