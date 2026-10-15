const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => ipcRenderer.on(channel, (event, ...args) => listener(...args)),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (payload) => ipcRenderer.invoke('silent-print', payload),
  selectFolder: () => ipcRenderer.invoke('select-folder')
});
