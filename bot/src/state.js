import fs from "node:fs";
import path from "node:path";
import { hubRoot, projectsConfig } from "./config.js";

const statePath = path.join(hubRoot, "configs", "user-state.json");

function readState() {
  if (!fs.existsSync(statePath)) return { users: {} };
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

export function getProjectForUser(userId) {
  const state = readState();
  return state.users[userId]?.project || projectsConfig.defaultProject;
}

export function setProjectForUser(userId, projectName) {
  const state = readState();
  state.users[userId] = { ...(state.users[userId] || {}), project: projectName };
  writeState(state);
}

export function getAgentForUser(userId, channelId, defaultAgent) {
  const state = readState();
  return (
    state.channels?.[channelId]?.agent ||
    state.users[userId]?.agent ||
    defaultAgent
  );
}

export function setAgentForUser(userId, channelId, agentName) {
  const state = readState();
  state.users[userId] = { ...(state.users[userId] || {}), agent: agentName };
  if (channelId) {
    state.channels = state.channels || {};
    state.channels[channelId] = { ...(state.channels[channelId] || {}), agent: agentName };
  }
  writeState(state);
}
