$ErrorActionPreference = "Stop"

$model = "deepseek-r1:8b"

try {
  $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
  $installed = @($tags.models | ForEach-Object { $_.name })
  if ($installed -contains $model) {
    [pscustomobject]@{
      ok = $true
      model = $model
      status = "already-installed"
    } | ConvertTo-Json -Depth 4
    exit 0
  }
} catch {
}

& ollama pull $model

[pscustomobject]@{
  ok = $LASTEXITCODE -eq 0
  model = $model
  status = if ($LASTEXITCODE -eq 0) { "installed" } else { "failed" }
} | ConvertTo-Json -Depth 4
