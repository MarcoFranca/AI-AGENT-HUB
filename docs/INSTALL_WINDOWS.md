# Install on Windows

## Prerequisites

- Windows 10/11
- PowerShell 7
- Node.js and npm
- Git
- Docker Desktop with WSL2 backend
- Ollama
- Codex CLI authenticated locally

## Local Layout

Recommended persistent layout:

```text
E:\AI
├── agents
├── docker
├── memory
├── models
├── ollama
├── open-webui
├── projects
├── skills
└── wsl
```

## Configure Environment

Copy `.env.example` to `.env` and fill Discord credentials locally. Do not commit `.env`.

```powershell
cd E:\AI\agents\ai-agent-hub
Copy-Item .env.example .env
```

## Install Dependencies

```powershell
cd E:\AI\agents\ai-agent-hub\bot
& "C:\Program Files\nodejs\npm.cmd" install

cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" install
```

## Start Hub

```powershell
cd E:\AI\agents\ai-agent-hub
& .\scripts\start-hub.ps1
```

## Open Control Panel

```powershell
cd E:\AI\agents\ai-agent-hub
& .\scripts\open-control-panel.ps1
```

## Build Portable EXE

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
& "C:\Program Files\nodejs\npm.cmd" run build
```

## Create Desktop Shortcut

```powershell
cd E:\AI\agents\ai-agent-hub
& .\scripts\create-desktop-shortcut.ps1
```
