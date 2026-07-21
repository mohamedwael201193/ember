# Restart Sentinel after process-kill chaos (no Docker).
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [bool]$ProofAnchorEnabled = $false
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
Remove-Item Env:KH_API_KEY_PRIMARY_EXECUTOR -ErrorAction SilentlyContinue
Remove-Item Env:KH_API_KEY_PRIMARY_OBSERVER -ErrorAction SilentlyContinue
Remove-Item Env:DEPLOYER_PRIVATE_KEY -ErrorAction SilentlyContinue
$env:SENTINEL_PORT = "8787"
$env:SENTINEL_SELF_POLL = "0"
$env:PROOF_ANCHOR_ENABLE = if ($ProofAnchorEnabled) { "1" } else { "0" }
$env:W1_CANONICAL_PATH = (Join-Path $RepoRoot "workflows\w1-payday-stream.json")
$env:PRIMARY_OBSERVER_URL = "http://127.0.0.1:8788"

$workDir = Join-Path $RepoRoot "services\sentinel"
$proc = Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory $workDir -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2
$healthy = $false
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:8787/healthz" -UseBasicParsing -TimeoutSec 5
  $healthy = $r.StatusCode -eq 200
} catch {}

Write-Output (@{
  ok = $healthy
  pid = $proc.Id
  service = "sentinel"
  action = "started"
  at = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress)
if (-not $healthy) { exit 1 }
