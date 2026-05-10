$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$controlPanel = Join-Path $hub "control-panel"
$portable = Join-Path $controlPanel "dist\AI-Hub-Control-Panel-0.1.0.exe"

if (Test-Path -LiteralPath $portable) {
  Start-Process -FilePath $portable -WorkingDirectory $controlPanel
  [pscustomobject]@{
    ok = $true
    mode = "portable"
    path = $portable
  } | ConvertTo-Json -Depth 4
  exit 0
}

$npm = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path -LiteralPath $npm)) {
  throw "npm.cmd not found at $npm"
}

Start-Process -FilePath $npm -ArgumentList "start" -WorkingDirectory $controlPanel
[pscustomobject]@{
  ok = $true
  mode = "npm-start"
  path = $controlPanel
} | ConvertTo-Json -Depth 4
