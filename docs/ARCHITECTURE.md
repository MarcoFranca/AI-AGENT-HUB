# Architecture

## Runtime Overview

```text
Discord
  -> Discord bot
  -> project registry and memory
  -> Ollama for local tasks
  -> Codex CLI for premium coding execution

Control Panel
  -> Electron main process
  -> allowlisted PowerShell scripts
  -> Docker / Ollama / Open WebUI / PM2 / logs
```

## Main Components

- `bot/`: Discord bot and command handlers.
- `configs/`: allowlists, model routing and agent registry.
- `scripts/`: operational PowerShell scripts used by the Control Panel.
- `control-panel/`: Electron desktop UI.
- `knowledge/`: changelogs and implementation notes.
- `agents/`: agent prompt definitions.

## Safety Model

- Discord commands use project allowlists before invoking Codex.
- Codex runs from the selected project root.
- Destructive prompts require explicit confirmation.
- The Control Panel renderer cannot execute shell commands.
- Electron IPC only calls allowlisted PowerShell scripts.
- Secrets stay in `.env`, which is ignored by Git.

## Model Routing

- `/local`: `configs/models.json -> defaults.local`
- `/analyze-project`: `configs/models.json -> defaults.analysis`
- Reasoning fallback: `deepseek-r1:8b` when installed
- Premium execution: Codex CLI

## PM2

PM2 supervises the Discord bot and restarts it after crashes. The Hub scripts prefer PM2 when available and fall back to direct Node process management only when PM2 is missing.
