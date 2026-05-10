# Open WebUI

Status: Docker Desktop installed and running; Open WebUI image pull is still pending because `ghcr.io/open-webui/open-webui:main` timed out without progress in this session.

The compose file is `configs/open-webui.compose.yml`.

Run/retry:

```powershell
C:\Users\marco\Documents\Codex\ai-agent-hub\scripts\start-open-webui.ps1
```

Expected result:

- Open WebUI: `http://localhost:3000`
- Ollama API target inside the container: `http://host.docker.internal:11434`
- Local model available: `qwen2.5-coder:7b`

Validation:

```powershell
docker ps
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Current Docker:

- Docker Desktop: 4.72.0
- Docker Engine: 29.4.2
- Context: `desktop-linux`
