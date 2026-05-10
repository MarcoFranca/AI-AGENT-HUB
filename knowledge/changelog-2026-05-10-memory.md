# Changelog 2026-05-10 - Persistent Memory Phase 1

## Added

- Persistent memory layout under `E:\AI\memory`:
  - `users`
  - `channels`
  - `projects`
  - `sessions`
- Skill category layout under `E:\AI\skills`:
  - `coding`
  - `automation`
  - `marketing`
  - `sales`
- Automatic context assembly for `/local` and `/analyze-project`.
- Project instruction loading from `AGENTS.md`, `CLAUDE.md`, and `README.md`.
- Interaction memory capture after local model responses.
- New slash commands:
  - `/memory-show`
  - `/memory-clear`
  - `/memory-summarize`
  - `/skills`

## Changed

- `/memory-save` now writes to project and user memory with secret redaction.
- `/skill-create` now writes skills under `E:\AI\skills\coding`.
- `/local` remains compatible but now receives persistent context.

## Safety

- Memory text is redacted with the existing secret redaction policy.
- `/memory-clear` requires `confirm: CONFIRMAR`.
- Existing commands remain compatible.

## Validation

- Offline validation passed.
- Discord slash commands were registered after offline validation.
- Bot restarted and connected as `AI Agent Hub#6186`.
