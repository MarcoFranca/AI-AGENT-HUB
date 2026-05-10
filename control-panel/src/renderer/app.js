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
  message: document.getElementById("message")
};

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

setInterval(() => {
  els.appUptime.textContent = formatDuration(Date.now() - startedAt);
}, 1000);

setInterval(() => {
  if (!busy) {
    refreshStatus({ silent: true });
  }
}, 6000);

refreshStatus();
