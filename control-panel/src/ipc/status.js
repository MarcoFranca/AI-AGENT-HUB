const path = require("node:path");
const { runHubScript } = require("./actions");

function normalizeStatus(status) {
  const services = status.services || {};
  return {
    ...status,
    overall: status.overall || "ERROR",
    services: {
      docker: services.docker || { ok: false },
      ollama: services.ollama || { ok: false, models: [] },
      openWebUi: services.openWebUi || { ok: false },
      discordBot: services.discordBot || { ok: false },
      wsl: services.wsl || { ok: false },
      pm2: services.pm2 || { ok: false, available: false }
    },
    context: status.context || {},
    logs: status.logs || { botOut: [], botErr: [] }
  };
}

function registerStatusIpc(ipcMain, { hubRoot }) {
  ipcMain.handle("hub:status", async () => {
    const result = await runHubScript({
      hubRoot,
      scriptName: "status-hub.ps1",
      timeoutMs: 45000
    });

    if (!result.ok) {
      return {
        ok: false,
        overall: "ERROR",
        error: result.error,
        rawOutput: result.rawOutput,
        generatedAt: new Date().toISOString(),
        services: {},
        context: {},
        logs: {}
      };
    }

    return {
      ok: true,
      ...normalizeStatus(result.data)
    };
  });
}

module.exports = {
  registerStatusIpc,
  normalizeStatus
};
