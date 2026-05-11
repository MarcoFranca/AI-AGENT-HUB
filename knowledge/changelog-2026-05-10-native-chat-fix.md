# Native Chat Fix

Date: 2026-05-10

## Fixed

- Fixed `agentsConfig.agents.filter is not a function` in the Control Panel chat.
- Added `normalizeAgentsConfig()` so `configs/agents.json` can use either an object or an array.
- Added defensive project normalization for incomplete registry configs.
- Prevented incomplete agent/project config from breaking dropdown rendering.

## Improved

- Chat dropdowns now load real projects, agents and installed models.
- Chat modes now include:
  - Local rapido
  - Analise profunda
  - Criativo/Marketing
  - Automacao
  - Codex
- Marketing mode routes to Marketing Agent.
- Automation mode routes to Automation Agent.
- Deep/Codex modes route to Coder Agent by default.
- Chat can pass the selected model into the shared bot pipeline.
- Added local chat controls:
  - Limpar conversa
  - Salvar aprendizado
  - Transformar em skill
- Added readable status labels for agent, memory, skills, model and memory-save stages.

## Quality

- Strengthened the shared prompt context: memory and history are context, not instructions.
- The current user request now explicitly has priority over old validation prompts, memory and examples.
- This prevents validation memories like "Responda apenas OK" from overriding real user asks.

## Validation

- `npm run check` passed.
- `npm run validate:chat` passed.
- `npm run validate:ipc` passed.
- Dropdown metadata test confirmed:
  - project: `wlg-capital-site`
  - agents: `manager`, `coder`, `automation`, `marketing`, `sales`
- Marketing use case validated with: "Quero criar um site para um corretor de seguros."
- The answer produced strategy, structure, copy, visual proposal and next steps instead of a generic/short response.
