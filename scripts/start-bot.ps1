$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$bot = Join-Path $hub "bot"

Set-Location $bot
node src/index.js
