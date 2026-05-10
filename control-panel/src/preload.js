const { contextBridge, ipcRenderer } = require("electron");

const allowedActions = new Set(["start", "stop", "restart", "refresh", "installDeepSeek"]);

contextBridge.exposeInMainWorld("aiHub", {
  getStatus: () => ipcRenderer.invoke("hub:status"),
  runAction: (action) => {
    if (!allowedActions.has(action)) {
      return Promise.reject(new Error("Action is not allowed."));
    }
    return ipcRenderer.invoke("hub:action", action);
  },
  openWebUi: () => ipcRenderer.invoke("hub:open-webui"),
  openLogsFolder: () => ipcRenderer.invoke("hub:open-logs"),
  setModel: (task, model) => ipcRenderer.invoke("hub:set-model", { task, model })
});
