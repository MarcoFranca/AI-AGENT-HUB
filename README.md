# AI Agent Hub

Local Windows-first control plane for a hybrid AI coding-agent setup.

The Hub connects Discord, Ollama, Open WebUI, Codex CLI, PM2, project allowlists, persistent memory, reusable skills and a small Electron desktop Control Panel.

## Current Capabilities

- Discord slash commands for projects, local model calls, Codex execution, memory, skills and agent selection.
- Ollama local models for low-cost context work.
- Codex CLI execution from the selected project root.
- Project allowlist for safe workspace routing.
- Persistent memory and skills under `E:\AI`.
- PM2-managed Discord bot with automatic restart.
- Electron Control Panel for Start, Stop, Restart, status, logs and model selection.

## Main Paths

- Hub: `E:\AI\agents\ai-agent-hub`
- Control Panel: `E:\AI\agents\ai-agent-hub\control-panel`
- Logs: `E:\AI\agents\ai-agent-hub\logs`
- Memory: `E:\AI\memory`
- Skills: `E:\AI\skills`
- Ollama models: `E:\AI\ollama\models`

## Quick Start

```powershell
cd E:\AI\agents\ai-agent-hub
& .\scripts\start-hub.ps1
& .\scripts\open-control-panel.ps1
```

## Control Panel

Manual development run:

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" start
```

Build portable Windows executable:

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
& "C:\Program Files\nodejs\npm.cmd" run build
```

The generated portable app is written to `control-panel\dist`.

## Validation

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" run check
& "C:\Program Files\nodejs\npm.cmd" run validate:ipc

cd E:\AI\agents\ai-agent-hub
& .\scripts\validate.ps1
```

## Repository Safety

This repository intentionally does not version:

- `.env`
- logs
- node_modules
- private memory
- model files
- Docker/WSL data
- generated Electron builds

Use `.env.example` as the template for local credentials.

## Documentation

- [Windows install](docs/INSTALL_WINDOWS.md)
- [Architecture](docs/ARCHITECTURE.md)
