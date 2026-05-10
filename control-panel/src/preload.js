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
  setModel: (task, model) => ipcRenderer.invoke("hub:set-model", { task, model }),
  getChatMeta: () => ipcRenderer.invoke("chat:meta"),
  getChatHistory: () => ipcRenderer.invoke("chat:history"),
  sendChatMessage: (payload) => ipcRenderer.invoke("chat:send", payload),
  onChatStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("chat:status", handler);
    return () => ipcRenderer.removeListener("chat:status", handler);
  },
  onChatContext: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("chat:context", handler);
    return () => ipcRenderer.removeListener("chat:context", handler);
  },
  onChatChunk: (callback) => {
    const handler = (_event, chunk) => callback(chunk);
    ipcRenderer.on("chat:chunk", handler);
    return () => ipcRenderer.removeListener("chat:chunk", handler);
  },
  onChatDone: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("chat:done", handler);
    return () => ipcRenderer.removeListener("chat:done", handler);
  },
  onChatError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("chat:error", handler);
    return () => ipcRenderer.removeListener("chat:error", handler);
  }
});
