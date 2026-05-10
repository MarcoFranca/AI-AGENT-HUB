# Hermes Agent

Status: installed and validated inside the `Ubuntu` WSL2 distro.

Validated install:

- Version: `Hermes Agent v0.13.0 (2026.5.7)`
- Code path in WSL: `/usr/local/lib/hermes-agent`
- Data path in Windows: `E:\AI\agents\hermes-home`
- Data path in WSL: `/mnt/e/AI/agents/hermes-home`
- Start script: `E:\AI\agents\ai-agent-hub\scripts\start-hermes.ps1`

Start from PowerShell:

```powershell
& 'E:\AI\agents\ai-agent-hub\scripts\start-hermes.ps1'
```

Useful WSL commands:

```bash
export HERMES_HOME=/mnt/e/AI/agents/hermes-home
hermes --version
hermes doctor
hermes model
hermes tools
hermes gateway setup
hermes gateway
```

Integration stance:

- Keep the custom Windows Discord bot as the secure project router for Codex CLI.
- Use Hermes as an optional persistent assistant/gateway in WSL2.
- Share portable skills through Markdown `SKILL.md` files under this hub.
- Do not let Hermes bypass the project allowlist enforced by `E:\AI\agents\ai-agent-hub\configs\projects.json`.

Note:

The one-line installer completed the base install, then entered interactive `hermes setup`. That wizard was stopped intentionally so configuration can be done explicitly without leaking API keys or Discord tokens.
