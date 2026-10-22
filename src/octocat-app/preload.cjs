const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("github", {
  onEvent: (callback) => {
    ipcRenderer.on("event", (_event, name, data) => {
      callback(name, data);
    });
  },
  onCursor: (callback) => {
    ipcRenderer.on("cursor", (_event, x, y) => {
      callback(x, y);
    });
  },
  onResync: (callback) => {
    ipcRenderer.on("resync", () => {
      callback();
    });
  }
});
