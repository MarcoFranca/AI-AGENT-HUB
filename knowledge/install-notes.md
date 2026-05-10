# Install Notes

## Environment Audit

- PowerShell: 7.4.14
- Windows: Microsoft Windows 10.0.26200
- Node: v22.20.0
- npm: `npm.ps1` is broken in this shell, but `C:\Program Files\nodejs\npm.cmd` works and reports 10.9.3
- Python: not installed or not visible through `py`
- Docker: not installed or not in PATH
- Git: 2.45.1.windows.1
- Codex CLI: installed from WindowsApps, but this sandboxed shell receives access denied when launching it directly
- Ollama: installed and serving API at `http://127.0.0.1:11434`
- Local model: `qwen2.5-coder:7b`, size about 4.68 GB
- Project `wlg-capital-site`: exists at `E:\Autentika\Projetos\Programas\wlg-capital-site` and contains `AGENTS.md`

## Notes

- Use the Ollama HTTP API from automation when direct `ollama.exe` launch is denied.
- Use `npm.cmd` instead of `npm.ps1` in scripts when installing packages from PowerShell.
- Open WebUI requires Docker Desktop before `scripts/start-open-webui.ps1` can work.
- Discord requires a real `.env` with bot token, client id and guild id.
