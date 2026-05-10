# Changelog 2026-05-10 - Discord UX And Agent Mentions

## Added

- `bot/src/progress-reporter.js`
  - Throttled status updates for Discord interactions.
  - Supports status events:
    - `analisando_projeto`
    - `carregando_memoria`
    - `carregando_skills`
    - `chamando_ollama`
    - `chamando_codex`
    - `salvando_memoria`
    - `sugerindo_skill`
    - `finalizado`
    - `erro`
- `bot/src/discord-response.js`
  - Splits medium responses into Discord-safe chunks.
  - Sends large Markdown responses as `.md` attachments.
  - Avoids silent truncation.
- Agent mention parsing:
  - `@Coder`
  - `@Automation`
  - `@Marketing`
  - `@Sales`
  - `@Manager`
- Skill suggestion storage:
  - `E:\AI\memory\suggestions\skills`
- New slash commands:
  - `/skill-suggestions`
  - `/skill-approve`
  - `/skill-reject`

## Changed

- `/local` can override the active agent from a leading `@Agent` mention.
- `/local` now reports progress while loading memory, loading skills, calling Ollama and saving memory.
- Local responses can create pending reusable skill suggestions, but do not auto-approve final skills.
- Context size was reduced to keep local model calls stable as memory grows.

## Safety

- Suggested skills are redacted with the existing secret redaction policy.
- Approval is explicit through `/skill-approve`.
- `/codex` behavior is unchanged.
- Destructive command policy remains unchanged.

## Validation

- `node --check` passed for changed/new modules.
- `node bot/src/validate-offline.js` passed.
- `scripts/validate.ps1` passed.
- Long response test generated a Markdown attachment path through `discord-response.js`.
- Discord slash commands were registered after offline validation.
