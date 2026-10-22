import { app, BrowserWindow, screen } from "electron";
import { MCPClient } from "@mastra/mcp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const repo = "PaulieScanlon/mastra-mcp-events";
const events = ["repo.starred", "repo.unstarred", "pull_request.opened", "pull_request.closed", "issue.opened", "issue.closed"];

const mcp = new MCPClient({
  servers: {
    github: { url: new URL("http://localhost:4111/api/mcp/github/mcp") }
  }
});

const listen = async (window, name) => {
  try {
    const subscription = await mcp.events.subscribe("github", name, { repo });
    subscription.onError(() => {
      window.webContents.send("resync");
    });
    window.webContents.send("resync");
    for await (const event of subscription) {
      window.webContents.send("event", name, event.data);
      if (subscription.truncated) {
        window.webContents.send("resync");
      }
    }
  } catch (error) {
    console.error(`${name}: ${error.message}`);
  }
  setTimeout(() => {
    listen(window, name);
  }, 5000);
};

const createWindow = () => {
  const window = new BrowserWindow({
    width: 620,
    height: 640,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: { contextIsolation: true, preload: path.join(dirname, "preload.cjs") }
  });
  window.setAlwaysOnTop(true, "screen-saver");
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.loadFile(path.join(dirname, "index.html"));
  setInterval(() => {
    if (window.isDestroyed()) {
      return;
    }
    const cursor = screen.getCursorScreenPoint();
    const bounds = window.getBounds();
    window.webContents.send("cursor", cursor.x - bounds.x, cursor.y - bounds.y);
  }, 33);
  window.webContents.once("did-finish-load", () => {
    events.forEach((name) => {
      listen(window, name);
    });
  });
};

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
  await mcp.disconnect();
  app.quit();
});
