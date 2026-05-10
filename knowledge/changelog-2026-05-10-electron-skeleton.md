# AI Hub Control Panel - Electron Skeleton

Date: 2026-05-10

## Added

- Created the initial Electron app in `control-panel`.
- Added a secure preload bridge with `contextIsolation=true` and `nodeIntegration=false`.
- Added IPC modules for status and actions.
- Added `scripts/validate-ipc.js` for offline IPC validation.
- Added `control-panel/README.md` with manual run and future build instructions.
- Added script allowlist for:
  - `status-hub.ps1`
  - `start-hub.ps1`
  - `stop-hub.ps1`
  - `restart-hub.ps1`
- Added a minimal dark dashboard with service cards, active context, Ollama models, uptime and recent bot logs.

## Security

- The renderer cannot execute PowerShell directly.
- Only allowlisted PowerShell scripts can be executed by the main process.
- The UI does not read or display `.env` values or tokens.

## Validation

- `npm install` completed in `control-panel`.
- `npm run check` passed.
- IPC status call returned `overall=ON`.
- IPC Start, Stop and Start validation passed with polling until `ON`.
- IPC Restart validation passed with polling until `ON`.
- Electron was launched with `npm start` and `electron.exe` processes were detected.

## Not Included Yet

- Windows auto-start.
- Build installer or `.exe` packaging.
- React or frontend framework.
- Settings screens.
- Agent logic changes.
