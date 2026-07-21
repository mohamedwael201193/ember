# Twelve-hour single-instance service soak with journal immutability checks.
param(
  [double]$DurationHours = 12,
  [int]$IntervalSeconds = 60,
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
$evidencePath = Join-Path $RepoRoot "docs\evidence\soak-12h.json"
$tempPath = $evidencePath + ".tmp"
$journalDir = Join-Path $RepoRoot "services\sentinel\runtime\rescues"
$startedAt = (Get-Date).ToUniversalTime()
$deadline = (Get-Date).AddHours($DurationHours)

function PortPid([int]$port) {
  $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($connection) { return [int]$connection.OwningProcess }
  return $null
}

function JournalFingerprint {
  $rows = Get-ChildItem $journalDir -Filter "*.json" -ErrorAction SilentlyContinue |
    Sort-Object Name |
    ForEach-Object { "$($_.Name):$($_.Length):$($_.LastWriteTimeUtc.Ticks)" }
  return ($rows -join "|")
}

function EndpointOk([string]$url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Save-Evidence([string]$state, $pass) {
  $evidence = [ordered]@{
    version = 1
    drill = "services-12h-soak"
    state = $state
    pass = $pass
    startedAt = $startedAt.ToString("o")
    updatedAt = (Get-Date).ToUniversalTime().ToString("o")
    requestedDurationHours = $DurationHours
    intervalSeconds = $IntervalSeconds
    checks = $script:checks
    healthFailures = $script:healthFailures
    pidChanges = $script:pidChanges
    journalMutations = $script:journalMutations
    sentinelPid = $script:sentinelPid
    observerPid = $script:observerPid
    maxSentinelWorkingSetBytes = $script:maxSentinelWorkingSet
    maxObserverWorkingSetBytes = $script:maxObserverWorkingSet
  }
  $evidenceJson = $evidence | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText(
    $tempPath,
    $evidenceJson,
    [System.Text.UTF8Encoding]::new($false)
  )
  Move-Item -Path $tempPath -Destination $evidencePath -Force
}

$script:sentinelPid = PortPid 8787
$script:observerPid = PortPid 8788
if (-not $script:sentinelPid -or -not $script:observerPid) {
  throw "Sentinel and Observer must be listening before soak"
}
$initialFingerprint = JournalFingerprint
$script:checks = 0
$script:healthFailures = 0
$script:pidChanges = 0
$script:journalMutations = 0
$script:maxSentinelWorkingSet = 0
$script:maxObserverWorkingSet = 0
Save-Evidence "RUNNING" $null
Write-Output "SOAK_STARTED $($startedAt.ToString('o'))"

while ((Get-Date) -lt $deadline) {
  $script:checks += 1
  $sentinelHealthy =
    (EndpointOk "http://127.0.0.1:8787/healthz") -and
    (EndpointOk "http://127.0.0.1:8787/readyz") -and
    (EndpointOk "http://127.0.0.1:8787/metrics")
  $observerHealthy =
    (EndpointOk "http://127.0.0.1:8788/healthz") -and
    (EndpointOk "http://127.0.0.1:8788/readyz") -and
    (EndpointOk "http://127.0.0.1:8788/metrics")
  if (-not $sentinelHealthy -or -not $observerHealthy) { $script:healthFailures += 1 }

  $currentSentinelPid = PortPid 8787
  $currentObserverPid = PortPid 8788
  if ($currentSentinelPid -ne $script:sentinelPid -or $currentObserverPid -ne $script:observerPid) {
    $script:pidChanges += 1
  }
  if ((JournalFingerprint) -ne $initialFingerprint) { $script:journalMutations += 1 }

  $sentinelProcess = Get-Process -Id $script:sentinelPid -ErrorAction SilentlyContinue
  $observerProcess = Get-Process -Id $script:observerPid -ErrorAction SilentlyContinue
  if ($sentinelProcess) {
    $script:maxSentinelWorkingSet = [Math]::Max(
      $script:maxSentinelWorkingSet,
      [long]$sentinelProcess.WorkingSet64
    )
  }
  if ($observerProcess) {
    $script:maxObserverWorkingSet = [Math]::Max(
      $script:maxObserverWorkingSet,
      [long]$observerProcess.WorkingSet64
    )
  }
  Save-Evidence "RUNNING" $null
  Start-Sleep -Seconds $IntervalSeconds
}

$pass =
  $script:healthFailures -eq 0 -and
  $script:pidChanges -eq 0 -and
  $script:journalMutations -eq 0
Save-Evidence "COMPLETED" $pass
Write-Output "SOAK_COMPLETE pass=$pass checks=$($script:checks)"
if (-not $pass) { exit 1 }
