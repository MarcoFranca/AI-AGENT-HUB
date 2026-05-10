# Native Chat UI

Date: 2026-05-10

## Added

- Added a native `Chat` tab to the AI Hub Control Panel.
- Added `control-panel/src/ipc/chat.js` as the shared bridge between Electron and the existing bot pipeline.
- Added `control-panel/scripts/validate-chat.js`.
- Added local chat history stored at `control-panel/data/chat-history.json`.
- Added project, agent, mode and model selectors in the panel.
- Added real-time status events in the Chat panel.
- Added visible context panes for:
  - memory loaded
  - skills available
  - project files preview
- Added streamed response display by chunking the handler response into the renderer.
- Added basic Markdown rendering and code block highlighting without React.

## Reuse

- The native chat calls the same `handleCommand()` pipeline used by Discord.
- Project selection uses the existing `/set-project` flow.
- Agent selection uses the existing `/use-agent` flow.
- Local/Codex/analyze behavior stays centralized in the bot handlers.

## Boundaries

- Discord remains supported.
- No multi-chat workspace yet.
- No React or frontend framework.
- No arbitrary command execution from the renderer.
- Upload UI is reserved for a later phase.

## Validation

- `npm run check` passed.
- `npm run validate:chat` passed.
- The chat validation loaded context, emitted status events, streamed chunks and saved local history.
