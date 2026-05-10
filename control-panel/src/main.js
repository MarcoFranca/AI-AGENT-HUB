const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { registerStatusIpc } = require("./ipc/status");
const { registerActionsIpc } = require("./ipc/actions");
const { registerChatIpc } = require("./ipc/chat");

const HUB_ROOT = process.env.AI_HUB_ROOT || "E:\\AI\\agents\\ai-agent-hub";
const CONTROL_PANEL_ROOT = path.resolve(__dirname, "..");

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 980,
    minHeight: 640,
    title: "AI Hub Control Panel",
    backgroundColor: "#111317",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.removeMenu();
  win.loadFile(path.join(CONTROL_PANEL_ROOT, "src", "renderer", "index.html"));
}

app.whenReady().then(() => {
  registerStatusIpc(ipcMain, { hubRoot: HUB_ROOT });
  registerActionsIpc(ipcMain, shell, { hubRoot: HUB_ROOT });
  registerChatIpc(ipcMain, { hubRoot: HUB_ROOT });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
