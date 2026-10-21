#!/usr/bin/env pwsh
# Sherivs verification bundle.
# Runs: typecheck -> unit tests -> production build.
# Usage:  pwsh scripts/verification/check.ps1   (or:  scripts\verification\check.ps1)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root

$failed = $false

function Invoke-Step {
  param([string]$Name, [scriptblock]$Body)
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  & $Body
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] $Name" -ForegroundColor Red
    $script:failed = $true
  } else {
    Write-Host "[PASS] $Name" -ForegroundColor Green
  }
}

Invoke-Step "Typecheck (tsc --noEmit)" {
  npx.cmd tsc --noEmit
}

Invoke-Step "Unit tests (vitest run)" {
  npx.cmd vitest run
}

Invoke-Step "Production build (vite build)" {
  npm.cmd run build
}

Pop-Location

Write-Host ""
if ($failed) {
  Write-Host "[RESULT] Verification failed" -ForegroundColor Red
  exit 1
}
Write-Host "[RESULT] All verification steps passed" -ForegroundColor Green
exit 0

