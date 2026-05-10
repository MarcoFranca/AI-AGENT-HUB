# PM2 and Model Routing

Date: 2026-05-10

## What PM2 Is

PM2 is a Node.js process manager. In this Hub it keeps the Discord bot running as a supervised process, restarts it after crashes, and centralizes process status/log metadata without changing the bot code.

## Added

- Installed PM2 globally with npm.
- Added `ecosystem.config.cjs` for `ai-agent-hub-discord-bot`.
- Configured PM2 autorestart, restart delay and existing log files:
  - `logs/discord-bot.out.log`
  - `logs/discord-bot.err.log`
- Updated Hub scripts to prefer PM2 for the Discord bot:
  - `scripts/start-hub.ps1`
  - `scripts/stop-hub.ps1`
  - `scripts/status-hub.ps1`
- Added `configs/models.json` as the model routing config.
- Added `bot/src/models.js` and wired:
  - `/local` -> `defaults.local`
  - `/analyze-project` -> `defaults.analysis`
  - memory summarization -> `defaults.analysis`
- Added clear Codex limit fallback messaging without pretending local fallback changed files.
- Added `scripts/install-deepseek-r1-8b.ps1` for optional DeepSeek install.
- Updated Control Panel with:
  - PM2 status from `status-hub.ps1`
  - installed model list
  - active local/analysis model dropdowns
  - Refresh Models button
  - Install DeepSeek R1 8B button with confirmation

## Model Defaults

- Quick/local: `qwen2.5-coder:7b`
- Analysis/coding local: `qwen2.5-coder:14b`
- Reasoning optional: `deepseek-r1:8b`
- Premium execution: `codex`

## Safety

- DeepSeek is not downloaded automatically.
- Model selection only accepts installed Ollama models.
- Renderer still cannot execute PowerShell directly.
- PowerShell actions remain allowlisted.
- No model removal commands were added.
- No secrets are exposed in the panel.

## Validation

- `npm run check` passed.
- `npm run validate:ipc` passed with PM2 start/stop/start and polling until `ON`.
- `scripts/validate.ps1` completed; a transient Ollama `ECONNRESET` was observed immediately after restart, then `validate-offline.js` passed after services stabilized.
- `status-hub.ps1` returns JSON with PM2 status, model config and installed Ollama models.
- PM2 restart validation passed: bot returned online and reconnect logs appeared.
- `/local` validated through the configured local model.
- `/analyze-project` validated through the configured analysis model.

## Current DeepSeek State

- `deepseek-r1:8b` is not installed.
- Install is available only through explicit confirmation in the Control Panel or by manually running the install script.
