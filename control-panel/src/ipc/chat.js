const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CHAT_USER_ID = "control-panel";
const CHAT_CHANNEL_ID = "control-panel";

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function getHistoryPath(hubRoot) {
  return path.join(hubRoot, "control-panel", "data", "chat-history.json");
}

function readHistory(hubRoot) {
  return readJson(getHistoryPath(hubRoot), []);
}

function appendHistory(hubRoot, entry) {
  const historyPath = getHistoryPath(hubRoot);
  const history = readHistory(hubRoot);
  history.push(entry);
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, `${JSON.stringify(history.slice(-200), null, 2)}\n`);
}

async function loadHandlers(hubRoot) {
  const handlersPath = pathToFileURL(path.join(hubRoot, "bot", "src", "handlers.js")).href;
  return import(`${handlersPath}?t=${Date.now()}`);
}

function listProjectFiles(projectPath) {
  try {
    return fs.readdirSync(projectPath, { withFileTypes: true })
      .filter((entry) => ![".git", ".next", "node_modules", "dist", "build"].includes(entry.name))
      .slice(0, 40)
      .map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`);
  } catch {
    return [];
  }
}

function getMeta(hubRoot) {
  const projectsConfig = readJson(path.join(hubRoot, "configs", "projects.json"), { projects: {} });
  const agentsConfig = readJson(path.join(hubRoot, "configs", "agents.json"), { agents: [] });
  const modelsConfig = readJson(path.join(hubRoot, "configs", "models.json"), { defaults: {} });
  const userState = readJson(path.join(hubRoot, "configs", "user-state.json"), { users: {}, channels: {} });
  const activeProject = userState.users?.[CHAT_USER_ID]?.project || projectsConfig.defaultProject;
  const activeAgent = userState.users?.[CHAT_USER_ID]?.agent || userState.channels?.[CHAT_CHANNEL_ID]?.agent || "manager";

  return {
    projects: Object.entries(projectsConfig.projects || {})
      .filter(([, project]) => project.enabled)
      .map(([name, project]) => ({ name, path: project.path, description: project.description || "" })),
    agents: (agentsConfig.agents || []).filter((agent) => agent.enabled !== false),
    models: modelsConfig,
    activeProject,
    activeAgent
  };
}

async function getContextPreview(hubRoot, { projectName }) {
  const { handleCommand } = await loadHandlers(hubRoot);
  const projects = readJson(path.join(hubRoot, "configs", "projects.json"), { projects: {} });
  const project = projects.projects?.[projectName] || projects.projects?.[projects.defaultProject];
  const memory = await handleCommand({
    commandName: "memory-show",
    userId: CHAT_USER_ID,
    channelId: CHAT_CHANNEL_ID,
    options: {}
  });
  const skills = await handleCommand({
    commandName: "skills",
    userId: CHAT_USER_ID,
    channelId: CHAT_CHANNEL_ID,
    options: {}
  });

  return {
    memory,
    skills,
    files: project ? listProjectFiles(project.path) : []
  };
}

async function streamText(text, onChunk) {
  const chunkSize = 36;
  for (let index = 0; index < text.length; index += chunkSize) {
    await onChunk(text.slice(index, index + chunkSize));
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function runChatMessage({ hubRoot, payload, onStatus, onContext, onChunk }) {
  const { handleCommand } = await loadHandlers(hubRoot);
  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    throw new Error("Prompt vazio.");
  }

  const projectName = payload.project || getMeta(hubRoot).activeProject;
  const agentName = payload.agent || getMeta(hubRoot).activeAgent || "manager";
  const mode = payload.mode || "local";

  await onStatus({ status: "selecionando_projeto", detail: projectName });
  await handleCommand({
    commandName: "set-project",
    userId: CHAT_USER_ID,
    channelId: CHAT_CHANNEL_ID,
    options: { name: projectName }
  });

  await onStatus({ status: "selecionando_agente", detail: agentName });
  await handleCommand({
    commandName: "use-agent",
    userId: CHAT_USER_ID,
    channelId: CHAT_CHANNEL_ID,
    options: { name: agentName }
  });

  await onStatus({ status: "carregando_contexto", detail: projectName });
  await onContext(await getContextPreview(hubRoot, { projectName }));

  const reporter = {
    report: async (status, detail = "") => {
      await onStatus({ status, detail });
    }
  };

  const commandName = mode === "codex" ? "codex" : mode === "analyze-project" ? "analyze-project" : "local";
  const options = commandName === "analyze-project" ? {} : { prompt };
  const finalPrompt = commandName === "local" ? `@${agentName} ${prompt}` : prompt;

  await onStatus({ status: "executando", detail: commandName });
  const response = await handleCommand({
    commandName,
    userId: CHAT_USER_ID,
    channelId: CHAT_CHANNEL_ID,
    options: commandName === "local" ? { prompt: finalPrompt } : options,
    reporter
  });

  await onStatus({ status: "streaming_resposta", detail: "" });
  await streamText(response, onChunk);

  const entry = {
    ts: new Date().toISOString(),
    project: projectName,
    agent: agentName,
    mode,
    prompt,
    response
  };
  appendHistory(hubRoot, entry);
  await onStatus({ status: "finalizado", detail: "" });
  return entry;
}

function registerChatIpc(ipcMain, { hubRoot }) {
  ipcMain.handle("chat:meta", async () => getMeta(hubRoot));
  ipcMain.handle("chat:history", async () => readHistory(hubRoot));
  ipcMain.handle("chat:send", async (event, payload) => {
    try {
      const entry = await runChatMessage({
        hubRoot,
        payload,
        onStatus: async (data) => event.sender.send("chat:status", data),
        onContext: async (data) => event.sender.send("chat:context", data),
        onChunk: async (chunk) => event.sender.send("chat:chunk", chunk)
      });
      event.sender.send("chat:done", entry);
      return { ok: true, entry };
    } catch (error) {
      event.sender.send("chat:error", { message: error.message });
      return { ok: false, error: error.message };
    }
  });
}

module.exports = {
  getMeta,
  readHistory,
  runChatMessage,
  registerChatIpc
};
