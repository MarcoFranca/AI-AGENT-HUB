# Discord Setup

Create an application in the Discord Developer Portal:

1. Create a new application.
2. Add a bot.
3. Copy the bot token into `.env` as `DISCORD_TOKEN`.
4. Copy the application/client id into `.env` as `DISCORD_CLIENT_ID`.
5. Copy your test server id into `.env` as `DISCORD_GUILD_ID`.

Use this local `.env` shape:

```text
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
OLLAMA_BASE_URL=http://127.0.0.1:11434
LOCAL_MODEL=qwen2.5-coder:7b
CODEX_COMMAND=codex
```

Register commands:

```powershell
C:\Users\marco\Documents\Codex\ai-agent-hub\scripts\register-discord-commands.ps1
```

Start the bot:

```powershell
C:\Users\marco\Documents\Codex\ai-agent-hub\scripts\start-bot.ps1
```

Commands:

- `/projects`
- `/set-project name:wlg-capital-site`
- `/local prompt:...`
- `/analyze-project`
- `/codex prompt:...`
- `/skill-create prompt:...`
- `/memory-save text:...`

Security:

- The bot only resolves projects in `configs/projects.json`.
- Resolved paths must be under `policy.allowedRoots`.
- Codex receives prompts through stdin with `codex exec -`.
- Codex runs with `cwd` set to the selected project root.
- Final Codex output is captured with `--output-last-message` to avoid Discord log noise.
- `.env`, logs and downloads are gitignored.
