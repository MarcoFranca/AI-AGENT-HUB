import { handleCommand } from "./handlers.js";
import { askLocal } from "./ollama.js";
import { resolveProject } from "./safety.js";

const userId = "offline-validation";

console.log("Project allowlist:");
console.log(resolveProject("wlg-capital-site"));

console.log("\n/projects:");
console.log(await handleCommand({ commandName: "projects", userId, options: {} }));

console.log("\n/set-project:");
console.log(await handleCommand({ commandName: "set-project", userId, options: { name: "wlg-capital-site" } }));

console.log("\n/agents:");
console.log(await handleCommand({ commandName: "agents", userId, options: {} }));

console.log("\n/use-agent:");
console.log(await handleCommand({
  commandName: "use-agent",
  userId,
  channelId: "offline-validation-channel",
  options: { name: "coder" }
}));

console.log("\n/agent-status:");
console.log(await handleCommand({
  commandName: "agent-status",
  userId,
  channelId: "offline-validation-channel",
  options: {}
}));

console.log("\n/local via Ollama:");
console.log(await handleCommand({
  commandName: "local",
  userId,
  channelId: "offline-validation-channel",
  options: { prompt: "@Coder Responda apenas OK se o modelo local estiver funcionando." }
}));

console.log("\n/local mention marketing:");
console.log(await handleCommand({
  commandName: "local",
  userId,
  channelId: "offline-validation-channel",
  options: { prompt: "@Marketing crie uma ideia curta de campanha em formato de workflow reutilizavel." }
}));

console.log("\n/memory-save:");
console.log(await handleCommand({
  commandName: "memory-save",
  userId,
  channelId: "offline-validation-channel",
  options: { text: "Preferencia: validar offline antes de registrar comandos." }
}));

console.log("\n/memory-show:");
console.log((await handleCommand({
  commandName: "memory-show",
  userId,
  channelId: "offline-validation-channel",
  options: {}
})).slice(0, 800));

console.log("\n/skills:");
console.log(await handleCommand({ commandName: "skills", userId, options: {} }));

console.log("\n/skill-suggestions:");
console.log(await handleCommand({ commandName: "skill-suggestions", userId, options: {} }));
