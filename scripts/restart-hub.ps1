$ErrorActionPreference = "Stop"

$stop = Join-Path $PSScriptRoot "stop-hub.ps1"
$start = Join-Path $PSScriptRoot "start-hub.ps1"
$pwsh = (Get-Process -Id $PID).Path
if (-not $pwsh) {
  $pwsh = "powershell.exe"
}

$command = "& '$stop' *> `$null; Start-Sleep -Seconds 3; & '$start' *> `$null"
Start-Process -FilePath $pwsh -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command) -WindowStyle Hidden

Write-Output ([pscustomobject]@{
  ok = $true
  mode = "async"
  detail = "restart-started"
} | ConvertTo-Json -Depth 4)
