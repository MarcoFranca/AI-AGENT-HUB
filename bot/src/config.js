import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const hubRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function loadEnv() {
  const envPath = path.join(hubRoot, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(hubRoot, relativePath), "utf8"));
}

export const projectsConfig = readJson("configs/projects.json");
export const policy = readJson("configs/policy.json");

export const runtime = {
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordGuildId: process.env.DISCORD_GUILD_ID,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || policy.ollamaBaseUrl,
  localModel: process.env.LOCAL_MODEL || policy.localModel,
  codexCommand: process.env.CODEX_COMMAND || policy.codexCommand
};
