import fs from "node:fs";
import path from "node:path";
import { hubRoot, readJson } from "./config.js";

const agentsConfig = readJson("configs/agents.json");

export function getDefaultAgentName() {
  return agentsConfig.defaultAgent || "manager";
}

export function resolveAgent(name) {
  const agentName = normalizeAgentName(name || getDefaultAgentName());
  const agent = agentsConfig.agents[agentName];
  if (!agent || agent.enabled !== true) {
    throw new Error(`Agente nao permitido: ${agentName}`);
  }
  return agent;
}

export function normalizeAgentName(name) {
  return String(name || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function extractAgentMention(text) {
  const match = String(text || "").match(/^\s*@([a-zA-Z][a-zA-Z0-9_-]*)\b\s*/);
  if (!match) return { agentName: null, prompt: text };
  const agentName = normalizeAgentName(match[1]);
  if (!agentsConfig.agents[agentName]) return { agentName: null, prompt: text };
  return {
    agentName,
    prompt: String(text || "").slice(match[0].length).trim()
  };
}

export function listAgents() {
  return Object.values(agentsConfig.agents)
    .filter((agent) => agent.enabled)
    .map((agent) => `${agent.name} -> ${agent.description}`)
    .join("\n");
}

export function loadAgentPrompt(name) {
  const agent = resolveAgent(name);
  const promptPath = path.join(hubRoot, agent.promptFile);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt do agente nao encontrado: ${agent.promptFile}`);
  }
  return {
    ...agent,
    prompt: fs.readFileSync(promptPath, "utf8")
  };
}
