$ErrorActionPreference = "Continue"

$hub = Split-Path -Parent $PSScriptRoot
$configs = Join-Path $hub "configs"
$compose = Join-Path $configs "open-webui.compose.yml"

function Get-DockerPath {
  $perUserDocker = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $perUserDocker) {
    return $perUserDocker
  }
  return "docker"
}

function Get-BotProcess {
  $escapedHub = [regex]::Escape($hub)
  return @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -match "src\\index\.js|src/index\.js" -and
      ($_.CommandLine -match $escapedHub -or $_.CommandLine -match "ai-agent-hub")
    })
}

function Stop-DiscordBot {
  $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
  if ($pm2) {
    try {
      & $pm2.Source stop ai-agent-hub-discord-bot *>&1 | Out-Null
      return @{
        stopped = "pm2"
      }
    } catch {
    }
  }

  $processes = Get-BotProcess
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  return @{
    stopped = $processes.Count
  }
}

function Stop-OpenWebUi {
  $docker = Get-DockerPath
  if (-not (Test-Path -LiteralPath $compose)) {
    return @{
      ok = $false
      detail = "compose-not-found"
    }
  }

  try {
    & $docker compose -f $compose stop *>&1 | Out-Null
    return @{
      ok = $LASTEXITCODE -eq 0
      detail = "compose-stop"
    }
  } catch {
    return @{
      ok = $false
      detail = $_.Exception.Message
    }
  }
}

function Stop-Ollama {
  $processes = @(Get-CimInstance Win32_Process -Filter "Name = 'ollama.exe'")
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  return @{
    stopped = $processes.Count
  }
}

$summary = [ordered]@{
  discordBot = Stop-DiscordBot
  openWebUi = Stop-OpenWebUi
  ollama = Stop-Ollama
  dockerDesktop = "left-running"
  wsl = "left-running"
}

Write-Output ([pscustomobject]$summary | ConvertTo-Json -Depth 5)
