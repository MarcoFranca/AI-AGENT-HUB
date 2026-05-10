const startedAt = Date.now();
let lifecycleState = "LOADING";
let busy = false;

const els = {
  overallStatus: document.getElementById("overall-status"),
  overallDot: document.getElementById("overall-dot"),
  services: document.getElementById("services"),
  models: document.getElementById("models"),
  localModel: document.getElementById("local-model"),
  analysisModel: document.getElementById("analysis-model"),
  installDeepSeek: document.getElementById("install-deepseek"),
  activeProject: document.getElementById("active-project"),
  activeAgent: document.getElementById("active-agent"),
  appUptime: document.getElementById("app-uptime"),
  lastRead: document.getElementById("last-read"),
  logs: document.getElementById("logs"),
  chatProject: document.getElementById("chat-project"),
  chatAgent: document.getElementById("chat-agent"),
  chatMode: document.getElementById("chat-mode"),
  chatModel: document.getElementById("chat-model"),
  chatHistory: document.getElementById("chat-history"),
  chatForm: document.getElementById("chat-form"),
  chatPrompt: document.getElementById("chat-prompt"),
  chatStatus: document.getElementById("chat-status"),
  chatMemory: document.getElementById("chat-memory"),
  chatSkills: document.getElementById("chat-skills"),
  chatFiles: document.getElementById("chat-files"),
  message: document.getElementById("message")
};

let currentAssistantBubble = null;

function setMessage(text) {
  els.message.textContent = text || "";
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function serviceCard(name, service, detail) {
  const ok = Boolean(service && service.ok);
  return `
    <div class="service ${ok ? "ok" : "fail"}">
      <strong>${name}: ${ok ? "OK" : "OFF"}</strong>
      <span>${detail || (ok ? "Running" : "Unavailable")}</span>
    </div>
  `;
}

function renderStatus(status) {
  const overall = lifecycleState === "LOADING" ? status.overall || "ERROR" : lifecycleState;
  const stateClass = String(overall || "ERROR").toLowerCase();
  const services = status.services || {};
  const ollamaModels = services.ollama?.models || [];
  const context = status.context || {};
  const modelState = status.models || {};
  const modelConfig = modelState.config || {};
  const modelDefaults = modelConfig.defaults || {};
  const logs = status.logs || {};
  const botOut = Array.isArray(logs.botOut) ? logs.botOut.join("\n") : logs.botOut || "";
  const botErr = Array.isArray(logs.botErr) ? logs.botErr.join("\n") : logs.botErr || "";
  const actions = Array.isArray(logs.actions) ? logs.actions.join("\n") : logs.actions || "";

  els.overallStatus.textContent = overall;
  els.overallDot.className = `dot ${stateClass}`;
  els.services.innerHTML = [
    serviceCard("Docker", services.docker, services.docker?.version || services.docker?.error),
    serviceCard("Ollama", services.ollama, `${ollamaModels.length} modelo(s)`),
    serviceCard("Open WebUI", services.openWebUi, services.openWebUi?.ok ? services.openWebUi.url : services.openWebUi?.error),
    serviceCard("Discord Bot", services.discordBot, services.discordBot?.processIds?.length ? `PID ${services.discordBot.processIds.join(", ")}` : "Processo nao encontrado"),
    serviceCard("WSL", services.wsl, services.wsl?.ok ? "Disponivel" : services.wsl?.output),
    serviceCard("PM2", services.pm2, services.pm2?.available ? "Disponivel" : "Nao instalado")
  ].join("");

  els.models.innerHTML = ollamaModels.length
    ? ollamaModels.map((model) => `<li>${model}</li>`).join("")
    : "<li>Nenhum modelo detectado</li>";
  renderModelSelect(els.localModel, ollamaModels, modelDefaults.local);
  renderModelSelect(els.analysisModel, ollamaModels, modelDefaults.analysis);
  els.installDeepSeek.disabled = Boolean(modelState.deepseekInstalled) || busy;
  els.installDeepSeek.textContent = modelState.deepseekInstalled ? "DeepSeek R1 8B instalado" : "Install DeepSeek R1 8B";

  els.activeProject.textContent = context.knownActiveProjects?.[0] || context.defaultProject || "-";
  els.activeAgent.textContent = context.knownActiveAgents?.[0] || "manager";
  els.lastRead.textContent = status.generatedAt ? new Date(status.generatedAt).toLocaleString() : "-";
  els.logs.textContent = [botOut, botErr, actions].filter(Boolean).join("\n\n") || "Sem logs recentes.";
}

function renderModelSelect(select, models, activeModel) {
  const currentValue = select.value || activeModel || "";
  select.innerHTML = models.length
    ? models.map((model) => `<option value="${model}">${model}</option>`).join("")
    : "<option value=\"\">Nenhum modelo</option>";
  select.value = models.includes(activeModel) ? activeModel : currentValue;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightCode(code) {
  return escapeHtml(code)
    .replace(/(".*?"|'.*?')/g, "<span class=\"str\">$1</span>")
    .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|try|catch|class|new|param|function)\b/g, "<span class=\"kw\">$1</span>")
    .replace(/\b(\d+)\b/g, "<span class=\"num\">$1</span>");
}

function renderMarkdown(markdown) {
  const codeBlocks = [];
  let html = escapeHtml(markdown).replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code data-lang="${escapeHtml(lang || "")}">${highlightCode(code)}</code></pre>`);
    return `@@CODE_${index}@@`;
  });

  html = html
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<p>• $1</p>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = `<p>${html}</p>`;
  codeBlocks.forEach((block, index) => {
    html = html.replace(`@@CODE_${index}@@`, block);
  });
  return html;
}

function addChatMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.dataset.raw = text || "";
  bubble.innerHTML = renderMarkdown(text || "");
  row.appendChild(bubble);
  els.chatHistory.appendChild(row);
  els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
  return bubble;
}

function updateBubble(bubble, text) {
  bubble.dataset.raw = text;
  bubble.innerHTML = renderMarkdown(text);
  els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function appendChatStatus(status, detail = "") {
  const last = els.chatStatus.lastElementChild?.dataset.status;
  if (last === status) {
    return;
  }
  const li = document.createElement("li");
  li.dataset.status = status;
  li.textContent = detail ? `${status}: ${detail}` : status;
  els.chatStatus.appendChild(li);
}

function fillSelect(select, options, value, getLabel = (item) => item.name) {
  select.innerHTML = options.map((item) => {
    const itemValue = item.name || item;
    return `<option value="${escapeHtml(itemValue)}">${escapeHtml(getLabel(item))}</option>`;
  }).join("");
  if (value) {
    select.value = value;
  }
}

async function loadChatMeta() {
  const [meta, history, status] = await Promise.all([
    window.aiHub.getChatMeta(),
    window.aiHub.getChatHistory(),
    window.aiHub.getStatus()
  ]);
  const installedModels = status.models?.installed || status.services?.ollama?.models || [];
  fillSelect(els.chatProject, meta.projects, meta.activeProject, (item) => item.description ? `${item.name} - ${item.description}` : item.name);
  fillSelect(els.chatAgent, meta.agents, meta.activeAgent, (item) => item.name);
  fillSelect(els.chatModel, installedModels, meta.models?.defaults?.local || installedModels[0], (item) => item);

  els.chatHistory.innerHTML = "";
  history.slice(-20).forEach((entry) => {
    addChatMessage("user", entry.prompt);
    addChatMessage("assistant", entry.response);
  });
}

async function refreshStatus({ silent = false } = {}) {
  if (!silent) {
    setMessage("Atualizando status...");
  }

  try {
    const status = await window.aiHub.getStatus();
    if (status.overall && lifecycleState !== "STARTING" && lifecycleState !== "STOPPING") {
      lifecycleState = status.overall;
    }
    renderStatus(status);
    if (!silent) {
      setMessage(status.ok === false ? `Erro: ${status.error}` : "Status atualizado.");
    }
  } catch (error) {
    lifecycleState = "ERROR";
    renderStatus({ overall: "ERROR", services: {}, context: {}, logs: {}, generatedAt: new Date().toISOString() });
    setMessage(error.message);
  }
}

async function runAction(action) {
  if (busy) {
    return;
  }
  busy = true;
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  lifecycleState = action === "start" ? "STARTING" : action === "stop" ? "STOPPING" : action === "restart" ? "STARTING" : lifecycleState;
  setMessage(`Executando ${action}...`);

  try {
    const result = await window.aiHub.runAction(action);
    if (!result.ok) {
      lifecycleState = "ERROR";
      setMessage(result.error || "Acao falhou.");
    } else {
      setMessage(`${action} enviado.`);
    }
    await refreshStatus({ silent: true });
  } catch (error) {
    lifecycleState = "ERROR";
    setMessage(error.message);
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "refresh") {
      refreshStatus();
      return;
    }
    runAction(action);
  });
});

document.getElementById("open-webui").addEventListener("click", async () => {
  await window.aiHub.openWebUi();
});

document.getElementById("open-logs").addEventListener("click", async () => {
  const result = await window.aiHub.openLogsFolder();
  if (!result.ok) {
    setMessage(result.error || "Nao foi possivel abrir a pasta de logs.");
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-view`).classList.add("active");
  });
});

document.getElementById("refresh-models").addEventListener("click", () => {
  refreshStatus();
});

els.localModel.addEventListener("change", async () => {
  const result = await window.aiHub.setModel("local", els.localModel.value);
  setMessage(result.ok ? `Modelo local: ${result.model}` : result.error);
  await refreshStatus({ silent: true });
});

els.analysisModel.addEventListener("change", async () => {
  const result = await window.aiHub.setModel("analysis", els.analysisModel.value);
  setMessage(result.ok ? `Modelo de analise: ${result.model}` : result.error);
  await refreshStatus({ silent: true });
});

els.installDeepSeek.addEventListener("click", async () => {
  const ok = window.confirm("Baixar deepseek-r1:8b pode consumir varios GB em disco. Deseja continuar?");
  if (!ok) {
    return;
  }
  busy = true;
  els.installDeepSeek.disabled = true;
  setMessage("Baixando deepseek-r1:8b...");
  const result = await window.aiHub.runAction("installDeepSeek");
  busy = false;
  setMessage(result.ok ? "DeepSeek R1 8B instalado ou ja presente." : result.error);
  await refreshStatus({ silent: true });
});

els.chatModel.addEventListener("change", async () => {
  const task = els.chatMode.value === "analyze-project" ? "analysis" : "local";
  const result = await window.aiHub.setModel(task, els.chatModel.value);
  setMessage(result.ok ? `Modelo ${task}: ${result.model}` : result.error);
});

els.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = els.chatPrompt.value.trim();
  if (!prompt || busy) {
    return;
  }

  busy = true;
  els.chatPrompt.value = "";
  els.chatStatus.innerHTML = "";
  els.chatMemory.textContent = "-";
  els.chatSkills.textContent = "-";
  els.chatFiles.textContent = "-";
  addChatMessage("user", prompt);
  currentAssistantBubble = addChatMessage("assistant", "");
  setMessage("Executando chat...");

  const result = await window.aiHub.sendChatMessage({
    project: els.chatProject.value,
    agent: els.chatAgent.value,
    mode: els.chatMode.value,
    model: els.chatModel.value,
    prompt
  });

  busy = false;
  setMessage(result.ok ? "Chat finalizado." : result.error);
});

window.aiHub.onChatStatus((data) => {
  appendChatStatus(data.status, data.detail);
});

window.aiHub.onChatContext((data) => {
  els.chatMemory.textContent = data.memory || "-";
  els.chatSkills.textContent = data.skills || "-";
  els.chatFiles.textContent = (data.files || []).join("\n") || "-";
});

window.aiHub.onChatChunk((chunk) => {
  if (!currentAssistantBubble) {
    currentAssistantBubble = addChatMessage("assistant", "");
  }
  updateBubble(currentAssistantBubble, `${currentAssistantBubble.dataset.raw || ""}${chunk}`);
});

window.aiHub.onChatDone(() => {
  currentAssistantBubble = null;
});

window.aiHub.onChatError((data) => {
  if (currentAssistantBubble) {
    updateBubble(currentAssistantBubble, `Erro: ${data.message}`);
  }
  currentAssistantBubble = null;
  busy = false;
  setMessage(data.message);
});

setInterval(() => {
  els.appUptime.textContent = formatDuration(Date.now() - startedAt);
}, 1000);

setInterval(() => {
  if (!busy) {
    refreshStatus({ silent: true });
  }
}, 6000);

refreshStatus();
loadChatMeta();
