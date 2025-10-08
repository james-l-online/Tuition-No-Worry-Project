# Format all tf-* folders and stage only modified .tf files, then commit & push
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $repoRoot

Write-Output "Running terraform fmt in each tf-* folder..."
$dirs = Get-ChildItem -Directory | Where-Object { $_.Name -like 'tf-*' }
foreach ($d in $dirs) {
    Write-Output "Formatting: $($d.FullName)"
    Push-Location $d.FullName
    terraform fmt -recursive
    Pop-Location
}

Write-Output "Collecting changed files..."
$porcelain = git status --porcelain
$stagedAnything = $false
foreach ($line in $porcelain) {
    $l = $line.Trim()
    if ($l.Length -lt 4) { continue }
    $path = $l.Substring(3).Trim()
    if ($path -like '*.tf') {
        Write-Output "Staging: $path"
        git add -- $path
        $stagedAnything = $true
    }
}

if ($stagedAnything) {
    git commit -m "chore(tf): format terraform files"
    git push origin HEAD
    Write-Output "Formatted files committed and pushed."
} else {
    Write-Output "No .tf changes to commit."
}
