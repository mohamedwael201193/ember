# Process-level chaos helper (Docker substitute).
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("payday", "sentinel", "observer")]
  [string]$Service,
  [int]$Port = 0
)

$ports = @{
  payday = 8789
  sentinel = 8787
  observer = 8788
}
$targetPort = if ($Port -gt 0) { $Port } else { $ports[$Service] }
$conns = Get-NetTCPConnection -LocalPort $targetPort -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Output (@{ ok = $true; service = $Service; action = "already_stopped"; port = $targetPort } | ConvertTo-Json -Compress)
  exit 0
}
$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}
Write-Output (@{
  ok = $true
  service = $Service
  action = "stopped"
  port = $targetPort
  pids = @($pids)
  at = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress)
