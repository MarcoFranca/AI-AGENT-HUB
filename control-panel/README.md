# AI Hub Control Panel

Minimal Electron control panel for the local AI Agent Hub.

## Run Manually

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" start
```

## Validate

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" run check
& "C:\Program Files\nodejs\npm.cmd" run validate:ipc
```

## Runtime Notes

- The Discord bot is supervised by PM2 when PM2 is available.
- Local model defaults are stored in `E:\AI\agents\ai-agent-hub\configs\models.json`.
- DeepSeek R1 8B is optional and is only installed after explicit confirmation.

## Future Windows Build

Packaging is intentionally not enabled in this skeleton phase. A later phase can add `electron-builder` and generate a Windows executable from this folder.

Recommended future commands:

```powershell
cd E:\AI\agents\ai-agent-hub\control-panel
& "C:\Program Files\nodejs\npm.cmd" install --save-dev electron-builder
& "C:\Program Files\nodejs\npm.cmd" run build
```

## Security Notes

- The renderer has no direct Node.js access.
- PowerShell is only executed in the main process.
- Only allowlisted hub scripts are callable.
- The UI does not read or display `.env` values.
