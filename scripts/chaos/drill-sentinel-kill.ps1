# Chaos: kill Sentinel, restart, re-POST same rescueId → journal resume / no new spend.
# Docker substitute per docs/RUNBOOK.md.
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$RescueId = "live2slots"
)

$ErrorActionPreference = "Stop"
function Load-DotEnv([string]$path) {
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $i = $_.IndexOf('=')
    if ($i -lt 1) { return }
    Set-Item -Path ("Env:" + $_.Substring(0, $i).Trim()) -Value $_.Substring($i + 1).Trim()
  }
}
Load-DotEnv (Join-Path $RepoRoot ".env")

$evidenceDir = Join-Path $RepoRoot "docs\evidence"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

$stopOut = & (Join-Path $PSScriptRoot "Stop-EmberProcess.ps1") -Service sentinel
Start-Sleep -Seconds 1
$startOut = & (Join-Path $PSScriptRoot "Start-EmberSentinel.ps1") -RepoRoot $RepoRoot

$env:RESCUE_ID = $RescueId
$env:MAX_REPLAY_SLOTS = "2"
$env:DRY_RUN = "0"
Set-Location $RepoRoot
$raw = node (Join-Path $PSScriptRoot "hmac-rescue.mjs")
$result = $raw | ConvertFrom-Json
$replayCount = @($result.body.replays).Count

$report = [ordered]@{
  drill = "sentinel_kill_resume"
  dockerSubstitute = "Stop-Process on port 8787"
  stop = ($stopOut | ConvertFrom-Json)
  start = ($startOut | ConvertFrom-Json)
  rescueId = $RescueId
  httpStatus = $result.status
  journalStatus = $result.body.status
  journalUpdatedAt = $result.body.updatedAt
  replayCount = $replayCount
  expected = "COMPLETED journal returned; no new replays appended for completed rescueId"
  pass = ($result.status -eq 200 -and $result.body.status -eq "COMPLETED" -and $replayCount -eq 2)
  at = (Get-Date).ToUniversalTime().ToString("o")
}
$reportPath = Join-Path $evidenceDir "chaos-sentinel-kill.json"
($report | ConvertTo-Json -Depth 6) | Set-Content -Path $reportPath -Encoding utf8
Write-Output ($report | ConvertTo-Json -Compress)
if (-not $report.pass) { exit 1 }
