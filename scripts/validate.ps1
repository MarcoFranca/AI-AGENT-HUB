$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$ollama = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"

Write-Host "AI Agent Hub validation"
Write-Host "Hub: $hub"

Write-Host "`nNode:"
node --version

Write-Host "`nNPM:"
& "C:\Program Files\nodejs\npm.cmd" --version

Write-Host "`nGit:"
git --version

Write-Host "`nCodex command:"
Get-Command codex -ErrorAction SilentlyContinue | Select-Object Name,Source | Format-Table -AutoSize

Write-Host "`nStorage env:"
[pscustomobject]@{
  OLLAMA_MODELS = [Environment]::GetEnvironmentVariable("OLLAMA_MODELS", "User")
  Hub = $hub
} | Format-List

Write-Host "`nDocker storage:"
$dockerLocal = Join-Path $env:LOCALAPPDATA "Docker"
Get-Item -LiteralPath $dockerLocal -ErrorAction SilentlyContinue | Select-Object FullName,LinkType,Target | Format-Table -AutoSize

Write-Host "`nWSL:"
wsl --list --verbose
Get-ChildItem -Path "E:\AI\wsl" -Recurse -Filter "*.vhdx" -ErrorAction SilentlyContinue | Select-Object FullName,Length | Format-Table -AutoSize

Write-Host "`nOllama API models:"
Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get | ConvertTo-Json -Depth 5

Write-Host "`nProject allowlist:"
node -e "import('./bot/src/safety.js').then(m => console.log(JSON.stringify(m.resolveProject('wlg-capital-site'), null, 2)))"

Write-Host "`nBot offline workflow:"
node .\bot\src\validate-offline.js

Write-Host "`nDone."
