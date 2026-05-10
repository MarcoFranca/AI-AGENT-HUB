const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");

const SCRIPT_ALLOWLIST = Object.freeze({
  status: "status-hub.ps1",
  start: "start-hub.ps1",
  stop: "stop-hub.ps1",
  restart: "restart-hub.ps1",
  refresh: "status-hub.ps1",
  installDeepSeek: "install-deepseek-r1-8b.ps1"
});

function getPowerShellPath() {
  if (process.platform !== "win32") {
    return "pwsh";
  }

  const preferred = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
  return fs.existsSync(preferred) ? preferred : "powershell.exe";
}

function getScriptPath(hubRoot, scriptName) {
  const scriptsRoot = path.join(hubRoot, "scripts");
  const fullPath = path.resolve(scriptsRoot, scriptName);
  if (!Object.values(SCRIPT_ALLOWLIST).includes(scriptName)) {
    throw new Error("Script is not allowlisted.");
  }
  if (!fullPath.startsWith(scriptsRoot + path.sep)) {
    throw new Error("Script path escaped scripts directory.");
  }
  return fullPath;
}

function parseJsonOutput(rawOutput) {
  const text = String(rawOutput || "").trim();
  if (!text) {
    return null;
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("PowerShell script did not return JSON.");
  }

  return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}

function runHubScript({ hubRoot, scriptName, timeoutMs = 120000 }) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const scriptPath = getScriptPath(hubRoot, scriptName);
    const child = spawn(getPowerShellPath(), [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath
    ], {
      cwd: hubRoot,
      windowsHide: true,
      env: {
        ...process.env,
        NO_COLOR: "1"
      }
    });

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      resolve({
        ok: false,
        error: `Script timed out after ${timeoutMs}ms.`,
        rawOutput: `${stdout}\n${stderr}`.trim()
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: false,
        error: error.message,
        rawOutput: `${stdout}\n${stderr}`.trim()
      });
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      const rawOutput = `${stdout}\n${stderr}`.trim();
      if (code !== 0) {
        resolve({
          ok: false,
          error: `Script exited with code ${code}.`,
          rawOutput
        });
        return;
      }

      try {
        resolve({
          ok: true,
          data: parseJsonOutput(rawOutput),
          rawOutput
        });
      } catch (error) {
        resolve({
          ok: false,
          error: error.message,
          rawOutput
        });
      }
    });
  });
}

function getModelsConfigPath(hubRoot) {
  return path.join(hubRoot, "configs", "models.json");
}

function readModelsConfig(hubRoot) {
  return JSON.parse(fs.readFileSync(getModelsConfigPath(hubRoot), "utf8"));
}

function writeModelsConfig(hubRoot, config) {
  fs.writeFileSync(getModelsConfigPath(hubRoot), `${JSON.stringify(config, null, 2)}\n`);
}

function registerActionsIpc(ipcMain, shell, { hubRoot }) {
  ipcMain.handle("hub:action", async (_event, action) => {
    const scriptName = SCRIPT_ALLOWLIST[action];
    if (!scriptName) {
      return {
        ok: false,
        error: "Action is not allowlisted."
      };
    }

    const timeoutMs = action === "installDeepSeek" ? 900000 : action === "start" || action === "stop" ? 180000 : 60000;
    return runHubScript({ hubRoot, scriptName, timeoutMs });
  });

  ipcMain.handle("hub:set-model", async (_event, payload) => {
    const task = payload && payload.task;
    const model = payload && payload.model;
    if (!["local", "analysis"].includes(task)) {
      return { ok: false, error: "Model task is not allowlisted." };
    }
    if (typeof model !== "string" || !/^[a-zA-Z0-9._:-]+$/.test(model)) {
      return { ok: false, error: "Invalid model name." };
    }

    const status = await runHubScript({ hubRoot, scriptName: "status-hub.ps1", timeoutMs: 45000 });
    const installed = status.data?.models?.installed || status.data?.services?.ollama?.models || [];
    if (!installed.includes(model)) {
      return { ok: false, error: "Model is not installed in Ollama." };
    }

    const config = readModelsConfig(hubRoot);
    config.defaults = config.defaults || {};
    config.defaults[task] = model;
    writeModelsConfig(hubRoot, config);
    return { ok: true, task, model };
  });

  ipcMain.handle("hub:open-webui", async () => {
    await shell.openExternal("http://localhost:3000");
    return { ok: true };
  });

  ipcMain.handle("hub:open-logs", async () => {
    const result = await shell.openPath(path.join(hubRoot, "logs"));
    return {
      ok: !result,
      error: result || null
    };
  });
}

module.exports = {
  SCRIPT_ALLOWLIST,
  getPowerShellPath,
  getScriptPath,
  parseJsonOutput,
  runHubScript,
  readModelsConfig,
  registerActionsIpc
};
