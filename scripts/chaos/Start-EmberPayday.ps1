# Restart PAYDAY after a process-kill chaos drill (no Docker).
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$EnableCadence
)

function Load-DotEnv([string]$path) {
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $i = $_.IndexOf('=')
    if ($i -lt 1) { return }
    Set-Item -Path ("Env:" + $_.Substring(0, $i).Trim()) -Value $_.Substring($i + 1).Trim()
  }
}

Load-DotEnv (Join-Path $RepoRoot ".env")
Remove-Item Env:KH_API_KEY_PRIMARY_OBSERVER -ErrorAction SilentlyContinue
Remove-Item Env:KH_API_KEY_STANDBY -ErrorAction SilentlyContinue
Remove-Item Env:DEPLOYER_PRIVATE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:PINATA_JWT -ErrorAction SilentlyContinue
$env:PAYDAY_PORT = "8789"
$env:PAYDAY_ENABLE = if ($EnableCadence) { "1" } else { "0" }
$env:RESCUE_JOURNAL_DIR = (Join-Path $RepoRoot "services\payday\runtime")

$workDir = Join-Path $RepoRoot "services\payday"
$proc = Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory $workDir -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2
$healthy = $false
$ready = $false
try {
  $health = Invoke-WebRequest -Uri "http://127.0.0.1:8789/healthz" -UseBasicParsing -TimeoutSec 5
  $healthy = $health.StatusCode -eq 200
  $readiness = Invoke-WebRequest -Uri "http://127.0.0.1:8789/readyz" -UseBasicParsing -TimeoutSec 5
  $ready = $readiness.StatusCode -eq 200
} catch {}

Write-Output (@{
  ok = ($healthy -and $ready)
  pid = $proc.Id
  service = "payday"
  action = "started"
  cadenceEnabled = [bool]$EnableCadence
  health = $healthy
  ready = $ready
  at = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress)
if (-not ($healthy -and $ready)) { exit 1 }
