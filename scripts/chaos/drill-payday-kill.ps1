# Chaos: kill PAYDAY, prove outage, restart, and verify readiness.
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$EnableCadence
)

$before = $null
try {
  $before = Invoke-RestMethod -Uri "http://127.0.0.1:8789/healthz" -TimeoutSec 5
} catch {}

$stop = & (Join-Path $PSScriptRoot "Stop-EmberProcess.ps1") -Service payday | ConvertFrom-Json
Start-Sleep -Seconds 1
$down = $false
try {
  Invoke-WebRequest -Uri "http://127.0.0.1:8789/healthz" -UseBasicParsing -TimeoutSec 2 | Out-Null
} catch {
  $down = $true
}

$startArgs = @{ RepoRoot = $RepoRoot }
if ($EnableCadence) { $startArgs.EnableCadence = $true }
$start = & (Join-Path $PSScriptRoot "Start-EmberPayday.ps1") @startArgs | ConvertFrom-Json
$after = Invoke-RestMethod -Uri "http://127.0.0.1:8789/readyz" -TimeoutSec 5
$pass = $stop.ok -and $down -and $start.ok -and $after.ready
$evidence = @{
  version = 1
  drill = "payday-process-kill"
  pass = $pass
  cadenceEnabled = [bool]$EnableCadence
  beforeHealthy = [bool]$before.ok
  outageObserved = $down
  stoppedPids = @($stop.pids)
  restartedPid = $start.pid
  readinessAfterRestart = $after
  at = (Get-Date).ToUniversalTime().ToString("o")
}
$output = Join-Path $RepoRoot "docs\evidence\chaos-payday-kill.json"
$evidence | ConvertTo-Json -Depth 8 | Set-Content -Path $output -Encoding utf8
$evidence | ConvertTo-Json -Compress -Depth 8
if (-not $pass) { exit 1 }
