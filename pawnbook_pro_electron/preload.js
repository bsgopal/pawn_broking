/**
 * Electron Preload Script
 *
 * Runs in the renderer process with access to Node APIs before the web
 * page loads.  We keep this minimal — the React app communicates with
 * the backend over localhost HTTP, so no IPC bridge is needed.
 */

const { contextBridge } = require('electron');

// Expose a tiny version string so the React UI can display it if desired
contextBridge.exposeInMainWorld('electronBridge', {
  version: process.versions.electron,
  platform: process.platform,
  appName: 'PawnBook Pro',
});
