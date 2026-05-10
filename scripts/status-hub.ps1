$ErrorActionPreference = "SilentlyContinue"

$hub = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $hub "logs"
$configs = Join-Path $hub "configs"
$userStatePath = Join-Path $configs "user-state.json"
$projectsPath = Join-Path $configs "projects.json"
$modelsConfigPath = Join-Path $configs "models.json"
$openWebUiUrl = "http://localhost:3000"

function Get-DockerPath {
  $perUserDocker = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $perUserDocker) {
    return $perUserDocker
  }
  return "docker"
}

function Invoke-StatusCommand {
  param(
    [Parameter(Mandatory = $true)][scriptblock]$Script
  )

  try {
    $output = & $Script 2>&1
    return @{
      ok = $LASTEXITCODE -eq 0
      output = Format-CleanText (($output | Out-String).Trim())
    }
  } catch {
    return @{
      ok = $false
      output = Format-CleanText $_.Exception.Message
    }
  }
}

function Format-CleanText {
  param(
    [AllowNull()][string]$Text
  )

  if ($null -eq $Text) {
    return $null
  }

  return ($Text -replace "`0", "").Trim()
}

function Test-Http {
  param(
    [Parameter(Mandatory = $true)][string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return @{
      ok = $true
      statusCode = [int]$response.StatusCode
    }
  } catch {
    return @{
      ok = $false
      statusCode = $null
      error = $_.Exception.Message
    }
  }
}

function Get-JsonFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  try {
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-BotProcess {
  $escapedHub = [regex]::Escape($hub)
  $processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -match "src\\index\.js|src/index\.js" -and
      ($_.CommandLine -match $escapedHub -or $_.CommandLine -match "ai-agent-hub")
    } |
    Select-Object ProcessId, CommandLine

  return @($processes)
}

function Get-LogTail {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [int]$Lines = 80
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return @()
  }

  return @(Get-Content -Tail $Lines -LiteralPath $Path)
}

function Get-TodayJsonLogTail {
  $date = (Get-Date).ToString("yyyy-MM-dd")
  $path = Join-Path $logs "$date.jsonl"
  return Get-LogTail $path 30
}

$dockerPath = Get-DockerPath
$dockerVersion = Invoke-StatusCommand { & $dockerPath version --format "{{.Server.Version}}" }
$dockerPs = Invoke-StatusCommand { & $dockerPath ps --format "{{.Names}}" }
$openWebUi = Test-Http $openWebUiUrl
$ollama = Test-Http "http://localhost:11434/api/tags"
$models = @()

if ($ollama.ok) {
  try {
    $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    $models = @($tags.models | ForEach-Object { $_.name })
  } catch {
    $models = @()
  }
}

$wslList = Invoke-StatusCommand { wsl --list --verbose }
$pm2Status = Invoke-StatusCommand { pm2 jlist }
$botProcesses = Get-BotProcess
$projects = Get-JsonFile $projectsPath
$userState = Get-JsonFile $userStatePath
$modelsConfig = Get-JsonFile $modelsConfigPath

$defaultProject = $null
if ($projects -and $projects.defaultProject) {
  $defaultProject = $projects.defaultProject
}

$knownActiveProjects = @()
$knownActiveAgents = @()
if ($userState) {
  if ($userState.users) {
    $userState.users.PSObject.Properties | ForEach-Object {
      if ($_.Value.project) { $knownActiveProjects += $_.Value.project }
      if ($_.Value.agent) { $knownActiveAgents += $_.Value.agent }
    }
  }
  if ($userState.channels) {
    $userState.channels.PSObject.Properties | ForEach-Object {
      if ($_.Value.project) { $knownActiveProjects += $_.Value.project }
      if ($_.Value.agent) { $knownActiveAgents += $_.Value.agent }
    }
  }
}

$openWebUiContainerRunning = $dockerPs.ok -and (($dockerPs.output -split "`r?`n") -contains "open-webui")
$pm2Apps = @()
$pm2Bot = $null
if ($pm2Status.ok -and $pm2Status.output) {
  try {
    $pm2Apps = @($pm2Status.output | ConvertFrom-Json -AsHashtable)
    $pm2Bot = $pm2Apps | Where-Object { $_["name"] -eq "ai-agent-hub-discord-bot" } | Select-Object -First 1
  } catch {
    $pm2Apps = @()
    $pm2Bot = $null
  }
}

$services = @{
  docker = @{
    ok = [bool]$dockerVersion.ok
    version = if ($dockerVersion.ok) { $dockerVersion.output } else { $null }
    error = if ($dockerVersion.ok) { $null } else { $dockerVersion.output }
  }
  wsl = @{
    ok = [bool]$wslList.ok
    output = $wslList.output
  }
  ollama = @{
    ok = [bool]$ollama.ok
    models = $models
    error = if ($ollama.ok) { $null } else { $ollama.error }
  }
  openWebUi = @{
    ok = [bool]$openWebUi.ok
    url = $openWebUiUrl
    containerRunning = [bool]$openWebUiContainerRunning
    statusCode = $openWebUi.statusCode
    error = if ($openWebUi.ok) { $null } else { $openWebUi.error }
  }
  discordBot = @{
    ok = ($botProcesses.Count -gt 0) -or ($pm2Bot -and $pm2Bot["pm2_env"]["status"] -eq "online")
    processIds = @($botProcesses | ForEach-Object { $_.ProcessId })
    manager = if ($pm2Bot) { "pm2" } else { "process" }
  }
  pm2 = @{
    ok = [bool]$pm2Status.ok
    available = [bool]$pm2Status.ok
    botStatus = if ($pm2Bot) { $pm2Bot["pm2_env"]["status"] } else { $null }
    botRestarts = if ($pm2Bot) { $pm2Bot["pm2_env"]["restart_time"] } else { $null }
    botPid = if ($pm2Bot) { $pm2Bot["pid"] } else { $null }
  }
}

$required = @($services.docker.ok, $services.ollama.ok, $services.openWebUi.ok, $services.discordBot.ok)
$runningCount = @($required | Where-Object { $_ }).Count
$overall = "OFF"
if ($runningCount -eq $required.Count) {
  $overall = "ON"
} elseif ($runningCount -gt 0) {
  $overall = "PARCIAL"
}

$result = @{
  generatedAt = (Get-Date).ToString("o")
  hubPath = $hub
  overall = $overall
  services = $services
  context = @{
    defaultProject = $defaultProject
    knownActiveProjects = @($knownActiveProjects | Select-Object -Unique)
    knownActiveAgents = @($knownActiveAgents | Select-Object -Unique)
  }
  models = @{
    config = $modelsConfig
    installed = $models
    deepseekInstalled = $models -contains "deepseek-r1:8b"
  }
  logs = @{
    folder = $logs
    botOut = Get-LogTail (Join-Path $logs "discord-bot.out.log")
    botErr = Get-LogTail (Join-Path $logs "discord-bot.err.log")
    actions = Get-TodayJsonLogTail
  }
}

$result | ConvertTo-Json -Depth 8
