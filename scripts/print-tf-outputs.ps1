<#
.SYNOPSIS
Print Terraform outputs from a `tf-*` folder in a copy/paste friendly format for GitHub Secrets.

.DESCRIPTION
Run this script in PowerShell after `terraform apply` in the specified folder. It runs
`terraform output -json`, formats outputs, and prints both the raw Terraform key:value
and convenient `KEY=VALUE` lines suitable for pasting into GitHub Secrets.

.PARAMETER TfDir
The relative path to the Terraform folder (default: tf-acr). Example: ./tf-acr or tf-aks

.EXAMPLE
# Print outputs from tf-acr
.
./scripts/print-tf-outputs.ps1 -TfDir .\tf-acr

# Print outputs from tf-aks-storage
./scripts/print-tf-outputs.ps1 -TfDir tf-aks-storage
# Note: do NOT run this script in CI; it's intended for local interactive use only.
# Sensitive outputs are flagged and instructions provided to retrieve them with terraform -raw.
#>

param(
    [string]
    $TfDir = "tf-acr"
)

function ConvertTo-EnvName($k) {
    # Convert terraform output key to uppercase env-like name
    return ($k.ToUpper() -replace '[^A-Z0-9]', '_')
}

# validate folder
if (-not (Test-Path -Path $TfDir)) {
    Write-Error "Folder '$TfDir' not found. Provide the path to a terraform folder (e.g. tf-acr)."
    exit 2
}

Push-Location $TfDir
try {
    # ensure terraform is available
    $tf = Get-Command terraform -ErrorAction SilentlyContinue
    if (-not $tf) {
        Write-Error "terraform not found in PATH. Install Terraform and try again."
        exit 3
    }

    # call terraform output -json
    $jsonOut = terraform output -json 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "terraform output failed. Ensure you've run 'terraform init' and 'terraform apply' in $TfDir."
        Write-Host $jsonOut
        exit 4
    }

    $outputs = $null
    try {
        $outputs = $jsonOut | ConvertFrom-Json
    } catch {
        Write-Error "Failed to parse terraform output JSON. Raw output:`n$jsonOut"
        exit 5
    }

    Write-Host "--- Terraform outputs from: $TfDir ---`n"

    # Print human readable list and then copyable lines
    foreach ($name in $outputs.PSObject.Properties.Name) {
        $entry = $outputs.$name
        $isSensitive = $false
        if ($entry.PSObject.Properties.Name -contains 'sensitive') {
            $isSensitive = [bool]$entry.sensitive
        }

        # get value; if it's complex, convert to compact JSON
        $val = $entry.value
        if ($val -is [System.Collections.IEnumerable] -and -not ($val -is [string])) {
            # arrays or objects
            $valStr = ($val | ConvertTo-Json -Compress)
        } else {
            $valStr = [string]$val
        }

        # Print descriptive line
        if ($isSensitive) {
            Write-Host "$name : <sensitive> (use: terraform output -raw $name to reveal)"
        } else {
            Write-Host "$name : $valStr"
        }
    }

    Write-Host "`n--- Copy-paste lines for GitHub Secrets (key=value) ---"

    foreach ($name in $outputs.PSObject.Properties.Name) {
        $entry = $outputs.$name
        $isSensitive = $false
        if ($entry.PSObject.Properties.Name -contains 'sensitive') {
            $isSensitive = [bool]$entry.sensitive
        }

    $envName = ConvertTo-EnvName $name
        if ($isSensitive) {
            Write-Host "# $envName = <sensitive>  <-- run: (cd $TfDir; terraform output -raw $name) to reveal"
        } else {
            $val = $entry.value
            if ($val -is [System.Collections.IEnumerable] -and -not ($val -is [string])) {
                $valStr = ($val | ConvertTo-Json -Compress)
            } else {
                $valStr = [string]$val
            }
            # Print in KEY=VALUE format
            Write-Host "$envName=$valStr"
        }
    }

    Write-Host "`nNote: For sensitive outputs run the command shown to reveal them and copy them into GitHub Secrets."

} finally {
    Pop-Location
}
