$ErrorActionPreference = "Stop"

$hub = Split-Path -Parent $PSScriptRoot
$compose = Join-Path $hub "configs\open-webui.compose.yml"
$docker = "docker"
$perUserDocker = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"

if (Test-Path -LiteralPath $perUserDocker) {
  $docker = $perUserDocker
  $dockerBin = Split-Path -Parent $perUserDocker
  if (($env:PATH -split ';') -notcontains $dockerBin) {
    $env:PATH = "$dockerBin;$env:PATH"
  }
}

& $docker compose -f $compose up -d
