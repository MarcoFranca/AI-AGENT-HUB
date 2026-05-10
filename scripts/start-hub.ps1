$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $hub "logs"
$bot = Join-Path $hub "bot"
$openWebUiScript = Join-Path $PSScriptRoot "start-open-webui.ps1"
$ecosystem = Join-Path $hub "ecosystem.config.cjs"

New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Get-DockerDesktopPath {
  $paths = @(
    (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"),
    "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  )

  foreach ($path in $paths) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  return $null
}

function Get-DockerPath {
  $perUserDocker = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $perUserDocker) {
    return $perUserDocker
  }
  return "docker"
}

function Wait-CommandOk {
  param(
    [Parameter(Mandatory = $true)][scriptblock]$Script,
    [int]$TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      & $Script | Out-Null
      if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
        return $true
      }
    } catch {
    }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  return $false
}

function Start-OllamaIfNeeded {
  try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null
    return "already-running"
  } catch {
    $ollama = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollama) {
      return "not-found"
    }

    $out = Join-Path $logs "ollama.out.log"
    $err = Join-Path $logs "ollama.err.log"
    Start-Process -FilePath $ollama.Source -ArgumentList "serve" -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
    return "started"
  }
}

function Start-DockerIfNeeded {
  $docker = Get-DockerPath
  try {
    & $docker version | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return "already-running"
    }
  } catch {
  }

  $desktop = Get-DockerDesktopPath
  if (-not $desktop) {
    return "not-found"
  }

  Start-Process -FilePath $desktop -WindowStyle Hidden
  $ready = Wait-CommandOk { & $docker version } -TimeoutSeconds 180
  if ($ready) {
    return "started"
  }

  return "timeout"
}

function Get-BotProcess {
  $escapedHub = [regex]::Escape($hub)
  return @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -match "src\\index\.js|src/index\.js" -and
      ($_.CommandLine -match $escapedHub -or $_.CommandLine -match "ai-agent-hub")
    })
}

function Get-Pm2Command {
  $command = Get-Command pm2 -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }
  return $null
}

function Start-BotIfNeeded {
  $pm2 = Get-Pm2Command
  if ($pm2 -and (Test-Path -LiteralPath $ecosystem)) {
    Get-BotProcess | ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    & $pm2 start $ecosystem --only ai-agent-hub-discord-bot --update-env *>&1 | Out-Null
    & $pm2 save --force *>&1 | Out-Null
    return "pm2-started-or-running"
  }

  $existing = Get-BotProcess
  if ($existing.Count -gt 0) {
    return "already-running"
  }

  $out = Join-Path $logs "discord-bot.out.log"
  $err = Join-Path $logs "discord-bot.err.log"
  $entry = Join-Path $bot "src\index.js"
  Add-Content -LiteralPath $out -Value ("[{0}] Starting Discord bot..." -f (Get-Date).ToString("o"))
  Add-Content -LiteralPath $err -Value ("[{0}] Discord bot stderr is not attached in background mode." -f (Get-Date).ToString("o"))
  Start-Process -FilePath "node" -ArgumentList "`"$entry`"" -WorkingDirectory $bot -WindowStyle Hidden
  return "started"
}

$summary = [ordered]@{
  ollama = Start-OllamaIfNeeded
  docker = Start-DockerIfNeeded
  openWebUi = "not-run"
  discordBot = "not-run"
}

& $openWebUiScript *>&1 | Out-Null
$summary.openWebUi = "started-or-running"
$summary.discordBot = Start-BotIfNeeded

Write-Output ([pscustomobject]$summary | ConvertTo-Json -Depth 4)
