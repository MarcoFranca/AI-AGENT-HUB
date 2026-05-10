# AI Agent Hub Architecture

Local control directory:

- `configs/`: project registry, policy and service config.
- `memory/`: durable project and user rules in Markdown or JSON.
- `skills/`: reusable skill documents for recurring workflows.
- `knowledge/`: longer notes, runbooks and project summaries.
- `logs/`: append-only bot/action logs.
- `bot/`: Discord command router.
- `scripts/`: setup and validation helpers.

Runtime flow:

1. Discord receives a slash command.
2. The bot resolves the active project for that Discord user.
3. The bot verifies the project exists in `configs/projects.json` and is inside `policy.allowedRoots`.
4. Simple context, summaries and memory tasks go to Ollama.
5. Complex coding tasks call Codex CLI with the selected project path as the working directory.
6. Codex runs from the project root, so existing `AGENTS.md` instructions are naturally in scope.
7. All actions are logged, with secrets redacted before sending anything back to Discord.

Security rules:

- No command runs outside an allowlisted project path.
- Destructive-looking commands require explicit confirmation.
- Tokens and secrets must live in `.env`, never in Discord messages or committed files.
- Logs are local and should avoid raw secret values.
