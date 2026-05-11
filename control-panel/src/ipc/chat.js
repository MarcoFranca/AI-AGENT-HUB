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

function writeHistory(hubRoot, history) {
  const historyPath = getHistoryPath(hubRoot);
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, `${JSON.stringify(history.slice(-200), null, 2)}\n`);
}

function appendHistory(hubRoot, entry) {
  const history = readHistory(hubRoot);
  history.push(entry);
  writeHistory(hubRoot, history);
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

function normalizeAgentsConfig(agentsConfig = {}) {
  const rawAgents = agentsConfig.agents || [];
  const agents = Array.isArray(rawAgents)
    ? rawAgents
    : Object.entries(rawAgents).map(([name, agent]) => ({
        name,
        ...(agent || {})
      }));

  return agents
    .filter((agent) => agent && agent.enabled !== false)
    .map((agent) => ({
      name: agent.name,
      description: agent.description || "",
      promptFile: agent.promptFile || "",
      enabled: agent.enabled !== false
    }))
    .filter((agent) => agent.name);
}

function normalizeProjectsConfig(projectsConfig = {}) {
  return Object.entries(projectsConfig.projects || {})
    .filter(([, project]) => project && project.enabled !== false)
    .map(([name, project]) => ({
      name,
      path: project.path || "",
      description: project.description || ""
    }));
}

function getMeta(hubRoot) {
  const projectsConfig = readJson(path.join(hubRoot, "configs", "projects.json"), { projects: {} });
  const agentsConfig = readJson(path.join(hubRoot, "configs", "agents.json"), { agents: [] });
  const modelsConfig = readJson(path.join(hubRoot, "configs", "models.json"), { defaults: {} });
  const userState = readJson(path.join(hubRoot, "configs", "user-state.json"), { users: {}, channels: {} });
  const activeProject = userState.users?.[CHAT_USER_ID]?.project || projectsConfig.defaultProject;
  const activeAgent = userState.users?.[CHAT_USER_ID]?.agent || userState.channels?.[CHAT_CHANNEL_ID]?.agent || "manager";

  return {
    projects: normalizeProjectsConfig(projectsConfig),
    agents: normalizeAgentsConfig(agentsConfig),
    models: modelsConfig,
    activeProject,
    activeAgent
  };
}

function modeConfig(mode, selectedAgent) {
  const configs = {
    local: {
      commandName: "local",
      agent: selectedAgent,
      label: "Local rapido",
      instruction: "Responda de forma objetiva, util e completa. Evite resposta generica."
    },
    deep: {
      commandName: "local",
      agent: selectedAgent === "manager" ? "coder" : selectedAgent,
      label: "Analise profunda",
      instruction: "Faca uma analise profunda, estruturada e acionavel. Cite suposicoes, riscos, trade-offs e proximos passos."
    },
    "analyze-project": {
      commandName: "analyze-project",
      agent: "coder",
      label: "Analise do projeto",
      instruction: ""
    },
    codex: {
      commandName: "codex",
      agent: "coder",
      label: "Codex",
      instruction: "Execute apenas quando o usuario escolheu explicitamente modo Codex."
    },
    marketing: {
      commandName: "local",
      agent: "marketing",
      label: "Criativo/Marketing",
      instruction: [
        "Atue como Marketing Agent senior.",
        "Se o pedido for criacao de site, campanha, copy ou posicionamento, entregue estrategia, estrutura, copy, proposta visual e proximos passos.",
        "Evite aparencia generica de IA. Use memoria, preferencias e historico quando houver.",
        "Para pedido como site para corretor de seguros, inferir um posicionamento inicial se faltar contexto e listar perguntas certeiras para refinar."
      ].join(" ")
    },
    automation: {
      commandName: "local",
      agent: "automation",
      label: "Automacao",
      instruction: "Atue como Automation Agent. Entregue fluxo, integracoes, passos tecnicos, riscos e validacao."
    }
  };
  return configs[mode] || configs.local;
}

function buildChatPrompt({ prompt, mode, agent }) {
  const config = modeConfig(mode, agent);
  if (!config.instruction) {
    return prompt;
  }

  return [
    `# Modo do painel: ${config.label}`,
    config.instruction,
    "",
    "# Pedido do usuario",
    prompt
  ].join("\n");
}

async function getContextPreview(hubRoot, { projectName, userId = CHAT_USER_ID, channelId = CHAT_CHANNEL_ID }) {
  const { handleCommand } = await loadHandlers(hubRoot);
  const projects = readJson(path.join(hubRoot, "configs", "projects.json"), { projects: {} });
  const project = projects.projects?.[projectName] || projects.projects?.[projects.defaultProject];
  const memory = await handleCommand({
    commandName: "memory-show",
    userId,
    channelId,
    options: {}
  });
  const skills = await handleCommand({
    commandName: "skills",
    userId,
    channelId,
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

  const userId = payload.userId || CHAT_USER_ID;
  const channelId = payload.channelId || CHAT_CHANNEL_ID;
  const projectName = payload.project || getMeta(hubRoot).activeProject;
  const mode = payload.mode || "local";
  const requestedAgent = payload.agent || getMeta(hubRoot).activeAgent || "manager";
  const selectedMode = modeConfig(mode, requestedAgent);
  const agentName = selectedMode.agent || requestedAgent;

  await onStatus({ status: "selecionando_projeto", detail: projectName });
  await handleCommand({
    commandName: "set-project",
    userId,
    channelId,
    options: { name: projectName }
  });

  await onStatus({ status: "carregando_agente", detail: agentName });
  await handleCommand({
    commandName: "use-agent",
    userId,
    channelId,
    options: { name: agentName }
  });

  await onStatus({ status: "carregando_contexto", detail: projectName });
  await onContext(await getContextPreview(hubRoot, { projectName, userId, channelId }));

  const reporter = {
    report: async (status, detail = "") => {
      await onStatus({ status, detail });
    }
  };

  const commandName = selectedMode.commandName;
  const options = commandName === "analyze-project" ? { model: payload.model } : { prompt, model: payload.model };
  const enhancedPrompt = buildChatPrompt({ prompt, mode, agent: agentName });
  const finalPrompt = commandName === "local" ? `@${agentName} ${enhancedPrompt}` : enhancedPrompt;

  await onStatus({ status: "executando", detail: commandName });
  const response = await handleCommand({
    commandName,
    userId,
    channelId,
    options: commandName === "local" ? { prompt: finalPrompt, model: payload.model } : commandName === "codex" ? { prompt: enhancedPrompt } : options,
    reporter
  });

  await onStatus({ status: "streaming_resposta", detail: "" });
  await streamText(response, onChunk);

  const entry = {
    ts: new Date().toISOString(),
    project: projectName,
    agent: agentName,
    mode,
    modeLabel: selectedMode.label,
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
  ipcMain.handle("chat:clear", async () => {
    writeHistory(hubRoot, []);
    return { ok: true };
  });
  ipcMain.handle("chat:save-learning", async (_event, payload) => {
    const { handleCommand } = await loadHandlers(hubRoot);
    const text = String(payload?.text || "").trim();
    if (!text) return { ok: false, error: "Texto vazio." };
    const result = await handleCommand({
      commandName: "memory-save",
      userId: CHAT_USER_ID,
      channelId: CHAT_CHANNEL_ID,
      options: { text }
    });
    return { ok: true, result };
  });
  ipcMain.handle("chat:create-skill", async (_event, payload) => {
    const { handleCommand } = await loadHandlers(hubRoot);
    const prompt = String(payload?.prompt || "").trim();
    if (!prompt) return { ok: false, error: "Resposta vazia." };
    const result = await handleCommand({
      commandName: "skill-create",
      userId: CHAT_USER_ID,
      channelId: CHAT_CHANNEL_ID,
      options: {
        prompt: [
          "Transforme o conteudo abaixo em uma skill reutilizavel, com objetivo, quando usar, entradas, passos e validacao.",
          "",
          prompt
        ].join("\n")
      }
    });
    return { ok: true, result };
  });
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
  normalizeAgentsConfig,
  readHistory,
  runChatMessage,
  registerChatIpc
};
