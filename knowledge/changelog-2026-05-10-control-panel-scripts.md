# AI Hub Control Panel - Hub Scripts

Date: 2026-05-10

## Added

- Created `scripts/status-hub.ps1` to return JSON status for Docker, WSL, Ollama, Open WebUI, Discord Bot, PM2, active context, models and recent logs.
- Created `scripts/start-hub.ps1` to start Ollama, Docker Desktop when needed, Open WebUI and the Discord bot without deleting data.
- Created `scripts/stop-hub.ps1` to stop Discord Bot, Open WebUI and Ollama while leaving Docker Desktop, WSL, containers, volumes and models intact.
- Created `scripts/restart-hub.ps1` as an async restart trigger suitable for UI polling.

## Validation

- PowerShell parser check passed for all four scripts.
- `status-hub.ps1` returned clean JSON.
- `start-hub.ps1` started the Hub successfully.
- `stop-hub.ps1` stopped runtime services without destructive actions.
- `restart-hub.ps1` triggered restart and the Hub returned to `ON`.
- Existing `scripts/validate.ps1` completed successfully.

## Notes

- `restart-hub.ps1` is intentionally asynchronous. The Control Panel should call it and then poll `status-hub.ps1` until `overall` returns `ON`, `PARCIAL` or an error state.
- PM2 is detected when available, but it is not installed or introduced in this phase.
