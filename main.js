const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let devServerProcess;
let backendPort = 5004;

// Setup global promise to sync backend port selection from the loaded server module
global.backendPortPromise = new Promise((resolve) => {
  global.resolveBackendPort = resolve;
});

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

function startServers() {
  if (isDev) {
    console.log('Starting PawnBook Pro dev servers (concurrently)...');
    devServerProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      shell: true
    });

    devServerProcess.stdout.on('data', (data) => {
      console.log(`[DevServer]: ${data}`);
    });

    devServerProcess.stderr.on('data', (data) => {
      console.error(`[DevServer Error]: ${data}`);
    });
  } else {
    console.log('Starting production backend server inside main process...');
    try {
      let backendDir = path.join(__dirname, 'backend');
      if (backendDir.includes('app.asar')) {
        backendDir = backendDir.replace('app.asar', 'app.asar.unpacked');
      }
      process.chdir(backendDir);
      
      let serverPath = path.resolve(__dirname, 'backend/src/server.js');
      if (serverPath.includes('app.asar')) {
        serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
      }
      const serverUrl = 'file://' + serverPath.replace(/\\/g, '/');
      
      import(serverUrl).catch(err => {
        const { dialog } = require('electron');
        dialog.showErrorBox('PawnBook Pro Backend Startup Error', err.stack || err.message || String(err));
      });
    } catch (error) {
      const { dialog } = require('electron');
      dialog.showErrorBox('Directory Change Error', error.stack || error.message || String(error));
    }
  }
}

// IPC Handler: Get System Installed Printers
ipcMain.handle('get-printers', async () => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const allPrinters = await mainWindow.webContents.getPrintersAsync();
      return { success: true, printers: allPrinters, allCount: allPrinters.length };
    }
    return { success: false, printers: [], message: 'Window webContents unavailable' };
  } catch (err) {
    console.error('IPC get-printers error:', err);
    return { success: false, printers: [], message: err.message };
  }
});

// IPC Handler: Pick a folder for database backups
ipcMain.handle('select-folder', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Backup Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, path: null, message: 'No folder selected' };
    }
    return { success: true, path: result.filePaths[0] };
  } catch (err) {
    console.error('IPC select-folder error:', err);
    return { success: false, path: null, message: err.message };
  }
});

// IPC Handler: Silent Direct Printing
ipcMain.handle('silent-print', async (event, payload) => {
  const targetPrinterName = typeof payload === 'object' ? payload?.printerName : payload;
  const htmlContent = typeof payload === 'object' ? payload?.htmlContent : '';

  return new Promise((resolve) => {
    let printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    let hasPrinted = false;
    const encodedHtml = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent || '<html><body></body></html>');
    printWin.loadURL(encodedHtml);

    const closePrintWindow = () => {
      if (printWin && !printWin.isDestroyed()) {
        printWin.close();
        printWin = null;
      }
    };

    printWin.webContents.on('did-finish-load', async () => {
      if (hasPrinted) return;
      hasPrinted = true;

      try {
        const availablePrinters = await printWin.webContents.getPrintersAsync();
        let activePrinter = null;

        if (targetPrinterName && targetPrinterName.trim() !== '') {
          activePrinter = availablePrinters.find(p => p.name.toLowerCase() === targetPrinterName.toLowerCase().trim());
        }

        const printOptions = {
          silent: true,
          printBackground: true,
          deviceName: activePrinter ? activePrinter.name : (availablePrinters[0]?.name || '')
        };

        printWin.webContents.print(printOptions, (success, failureReason) => {
          closePrintWindow();
          if (!success) {
            resolve({ success: false, message: failureReason || 'Print failed' });
          } else {
            resolve({ success: true, printer: printOptions.deviceName });
          }
        });
      } catch (err) {
        closePrintWindow();
        resolve({ success: false, message: err.message });
      }
    });

    setTimeout(() => {
      if (!hasPrinted) {
        closePrintWindow();
        resolve({ success: false, message: 'Silent print timed out after 10s' });
      }
    }, 10000);
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'PawnBook Pro — Jewelry Pawn Broking & Gold Loan ERP',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const url = isDev ? 'http://localhost:5177' : `file://${path.join(__dirname, 'frontend/dist/index.html')}`;
  
  // Retry loop for dev server
  const loadURLWithRetry = (targetUrl) => {
    mainWindow.loadURL(targetUrl).catch(() => {
      if (isDev) {
        setTimeout(() => loadURLWithRetry(targetUrl), 1000);
      }
    });
  };

  loadURLWithRetry(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (devServerProcess) {
    devServerProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
