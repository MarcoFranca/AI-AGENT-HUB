# Storage Migration To E:\AI

Status: completed through the safe storage layer.

## Final Layout

- `E:\AI\docker\local`: Docker Desktop data, including WSL VHDX files.
- `E:\AI\docker\desktop`: Docker Desktop per-user binaries.
- `E:\AI\wsl\Ubuntu`: Ubuntu WSL2 imported distro VHDX.
- `E:\AI\wsl\swap.vhdx`: WSL2 swap file location.
- `E:\AI\ollama\app`: Ollama per-user binaries.
- `E:\AI\ollama\models`: Ollama model store.
- `E:\AI\memory`: persistent agent memory.
- `E:\AI\skills`: reusable skills.
- `E:\AI\open-webui\data`: Open WebUI persistent data bind mount.
- `E:\AI\agents\ai-agent-hub`: local AI agent hub.

## Junctions Left In C:

These paths remain as compatibility entry points but point to E:

- `C:\Users\marco\AppData\Local\Docker` -> `E:\AI\docker\local`
- `C:\Users\marco\AppData\Local\Programs\DockerDesktop` -> `E:\AI\docker\desktop`
- `C:\Users\marco\AppData\Local\Programs\Ollama` -> `E:\AI\ollama\app`
- `C:\Users\marco\.ollama\models` -> `E:\AI\ollama\models`

## Environment

- User env `OLLAMA_MODELS=E:\AI\ollama\models`
- `.wslconfig` sets `swapFile=E:\\AI\\wsl\\swap.vhdx`

The Ollama default model path is also a junction to `E:\AI\ollama\models`. This keeps models on E: even if the GUI app starts without inheriting `OLLAMA_MODELS`.

## Validation

Run:

```powershell
E:\AI\agents\ai-agent-hub\scripts\validate.ps1
```

Validated:

- Ollama lists `qwen2.5-coder:7b` from the E: model store.
- Docker Desktop starts while its data path is redirected to E:.
- Ubuntu WSL2 is imported under E:.
- Bot offline workflow works with `/projects`, `/set-project`, and `/local`.
- `/codex` was validated from the selected project root with `AGENTS.md`.
- Open WebUI container is healthy and serves `http://localhost:3000`.

## Docker Desktop Repair

On 2026-05-09, Docker Desktop was stuck at engine startup. The backend repeatedly logged that the LinuxKit init control API was not responding and that `/run/guest-services/socketforwarder-receive-fds.sock` did not exist yet.

Repair performed:

1. Backed up Docker WSL VHDX files to `E:\AI\docker\backup-20260509-214423`.
2. Unregistered only the broken `docker-desktop` WSL distro.
3. Ran `wsl --update`, which updated WSL to `2.7.3`.
4. Restarted Docker Desktop and let it recreate `docker-desktop`.

Result:

- Docker Engine responds as `29.4.2`.
- Open WebUI image was pulled successfully.
- `open-webui` container is healthy.

Do not delete the backup until the new Docker setup has been stable for a while.

## Notes

VHDX paths may still display as `C:\Users\marco\AppData\Local\Docker\...` in tools that resolve through the compatibility path. That path is a junction; physical storage is under `E:\AI\docker\local`.
