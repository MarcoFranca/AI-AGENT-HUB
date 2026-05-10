$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$controlPanel = Join-Path $hub "control-panel"
$portable = Join-Path $controlPanel "dist\AI-Hub-Control-Panel-0.1.0.exe"
$openScript = Join-Path $PSScriptRoot "open-control-panel.ps1"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "AI Hub Control Panel.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

if (Test-Path -LiteralPath $portable) {
  $shortcut.TargetPath = $portable
  $shortcut.WorkingDirectory = $controlPanel
} else {
  $pwsh = "C:\Program Files\PowerShell\7\pwsh.exe"
  if (-not (Test-Path -LiteralPath $pwsh)) {
    $pwsh = "powershell.exe"
  }
  $shortcut.TargetPath = $pwsh
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$openScript`""
  $shortcut.WorkingDirectory = $hub
}

$shortcut.Description = "AI Hub Control Panel"
$shortcut.Save()

[pscustomobject]@{
  ok = $true
  shortcut = $shortcutPath
  target = $shortcut.TargetPath
} | ConvertTo-Json -Depth 4
