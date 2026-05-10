# Changelog 2026-05-10 - Agents Base

## Added

- `configs/agents.json` with five enabled agents:
  - `manager`
  - `coder`
  - `automation`
  - `marketing`
  - `sales`
- Agent prompt files:
  - `agents/manager.agent.md`
  - `agents/coder.agent.md`
  - `agents/automation.agent.md`
  - `agents/marketing.agent.md`
  - `agents/sales.agent.md`
- Node agent loader in `bot/src/agents.js`.
- Active agent state support in `bot/src/state.js`.
- New Discord commands:
  - `/agents`
  - `/use-agent`
  - `/agent-status`

## Changed

- `/local` now includes the active agent prompt in persistent context.
- If no agent is selected, `manager` is used by default.
- Logs now include `agent=<name>`.
- `/use-agent` records the selected agent in memory.

## Not Changed

- `/codex` behavior is unchanged.
- No automatic multi-agent routing was added.
- No `/ask-agent`, `/coder`, `/automation`, `/marketing`, or `/sales` commands were added yet.

## Validation

- `node --check` passed for new and changed Node files.
- `node bot/src/validate-offline.js` passed.
- `scripts/validate.ps1` passed.
- Discord slash commands were registered after offline validation.
