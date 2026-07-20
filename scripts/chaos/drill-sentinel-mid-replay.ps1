# Kill Sentinel after a replay intent is durable, then prove idempotent recovery.
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [int]$TimeoutSeconds = 180
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
$journalDir = Join-Path $RepoRoot "services\sentinel\runtime\rescues"
$before = @(Get-ChildItem $journalDir -Filter "*.json" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
$requestOutput = Join-Path $env:TEMP ("ember-mid-replay-" + [guid]::NewGuid().ToString("n") + ".log")

$env:MAX_REPLAY_SLOTS = "2"
$env:DRY_RUN = "0"
Remove-Item Env:RESCUE_ID -ErrorAction SilentlyContinue
$request = Start-Process -FilePath "node" `
  -ArgumentList "--env-file=.env", "scripts/chaos/hmac-rescue.mjs" `
  -WorkingDirectory $RepoRoot `
  -RedirectStandardOutput $requestOutput `
  -RedirectStandardError ($requestOutput + ".err") `
  -PassThru `
  -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$journalPath = $null
$observedIntentState = $null
while ((Get-Date) -lt $deadline -and -not $journalPath) {
  $candidate = Get-ChildItem $journalDir -Filter "*.json" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notin $before } |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
  if ($candidate) {
    try {
      $journal = Get-Content $candidate.FullName -Raw | ConvertFrom-Json
      $intent = @($journal.replayIntents) |
        Where-Object { $_.state -eq "EXECUTING" -or $_.state -eq "CONFIRMED" } |
        Select-Object -First 1
      if ($journal.status -eq "IN_PROGRESS" -and $intent) {
        $journalPath = $candidate.FullName
        $observedIntentState = $intent.state
      }
    } catch {}
  }
  if (-not $journalPath) { Start-Sleep -Milliseconds 100 }
}
if (-not $journalPath) {
  if (-not $request.HasExited) { Stop-Process -Id $request.Id -Force -ErrorAction SilentlyContinue }
  throw "Did not observe a durable in-flight replay intent"
}

$stop = & (Join-Path $PSScriptRoot "Stop-EmberProcess.ps1") -Service sentinel | ConvertFrom-Json
$null = $request.WaitForExit(30000)
$interrupted = Get-Content $journalPath -Raw | ConvertFrom-Json
$rescueId = $interrupted.rescueId

$started = & (Join-Path $PSScriptRoot "Start-EmberSentinel.ps1") -RepoRoot $RepoRoot -ProofAnchorEnabled $true |
  ConvertFrom-Json
if (-not $started.ok) { throw "Sentinel restart failed" }

$env:RESCUE_ID = $rescueId
$recoveryLine = & node --env-file=.env scripts/chaos/hmac-rescue.mjs | Select-Object -Last 1
$recovery = $recoveryLine | ConvertFrom-Json
if ($recovery.status -ne 200 -or $recovery.body.status -ne "COMPLETED") {
  throw "Rescue recovery did not complete"
}
if (@($recovery.body.replays).Count -ne 2) { throw "Recovered replay count is not two" }
if (@($recovery.body.replays.txHash | Sort-Object -Unique).Count -ne 2) {
  throw "Recovered replay transactions are not unique"
}
if (-not ($recovery.body.stepsCompleted -contains "proof_anchored")) {
  throw "Recovered rescue proof was not anchored"
}

$rerunLine = & node --env-file=.env scripts/chaos/hmac-rescue.mjs | Select-Object -Last 1
$rerun = $rerunLine | ConvertFrom-Json
if ($rerun.body.updatedAt -ne $recovery.body.updatedAt) {
  throw "Explicit rerun mutated the completed rescue"
}

$evidence = [ordered]@{
  version = 1
  drill = "sentinel-mid-replay-process-kill"
  network = "base-sepolia"
  at = (Get-Date).ToUniversalTime().ToString("o")
  pass = $true
  rescueId = $rescueId
  observedIntentState = $observedIntentState
  stoppedPids = @($stop.pids)
  restartedPid = $started.pid
  slots = @($recovery.body.unpaidSlots)
  replayExecutionIds = @($recovery.body.replays.executionId)
  replayTxHashes = @($recovery.body.replays.txHash)
  proofCid = $recovery.body.proofCid
  proofHash = $recovery.body.proofHash
  anchorExecutionId = $recovery.body.anchorExecutionId
  anchorTxHash = $recovery.body.anchorTxHash
  completedUpdatedAt = $recovery.body.updatedAt
  rerunUpdatedAt = $rerun.body.updatedAt
}
$evidencePath = Join-Path $RepoRoot "docs\evidence\chaos-sentinel-mid-replay.json"
$evidenceJson = $evidence | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText(
  $evidencePath,
  $evidenceJson,
  [System.Text.UTF8Encoding]::new($false)
)
Remove-Item Env:RESCUE_ID -ErrorAction SilentlyContinue
Remove-Item $requestOutput, ($requestOutput + ".err") -Force -ErrorAction SilentlyContinue
Write-Output ($evidence | ConvertTo-Json -Depth 8 -Compress)
