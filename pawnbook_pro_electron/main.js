/**
 * PawnBook Pro — Electron Main Process v2.2
 *
 * Architecture:
 *  - Spawns the Express backend as a child process using Electron's own
 *    bundled Node runtime. This is the only reliable method in a packaged
 *    Electron app because it ensures module resolution works correctly
 *    from the backend's own directory.
 *  - Backend data is stored in %APPDATA%\PawnBookPro\data\ (survives updates).
 *  - If the backend fails to start, the app opens in offline mode (no dialog loop).
 *  - Single instance lock prevents multiple windows opening.
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const fs = require('fs');

// ── Single instance guard ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

// ── Path helpers ──────────────────────────────────────────────────────────────
const isPackaged = app.isPackaged;

function resourcePath(...segments) {
  if (isPackaged) {
    return path.join(process.resourcesPath, ...segments);
  }
  return path.join(__dirname, ...segments);
}

// ── AppData storage directory ─────────────────────────────────────────────────
const DATA_DIR = path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Backend process management ────────────────────────────────────────────────
const BACKEND_PORT = 3000;
let backendProcess = null;
let backendReady = false;

function startBackend() {
  const serverScript = resourcePath('backend', 'server.js');
  const backendDir   = resourcePath('backend');

  if (!fs.existsSync(serverScript)) {
    console.error('[main] Backend server.js not found at:', serverScript);
    return;
  }

  // fork() uses the same Node/Electron binary but runs in a separate process.
  // Setting cwd to the backend folder ensures require('express') etc. resolve
  // correctly from backend/node_modules/.
  backendProcess = fork(serverScript, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      PAWNBOOK_DATA_DIR: DATA_DIR,
      PORT: String(BACKEND_PORT),
      // Prevent Electron from passing --inspect flags to the child
      ELECTRON_RUN_AS_NODE: '1',
    },
    // Silent: capture logs in dev, discard in production
    silent: true,
    execArgv: [], // strip any --inspect / --debug flags
  });

  if (backendProcess.stdout) {
    backendProcess.stdout.on('data', (d) => {
      if (!isPackaged) console.log('[backend]', d.toString().trim());
    });
  }
  if (backendProcess.stderr) {
    backendProcess.stderr.on('data', (d) => {
      console.error('[backend ERR]', d.toString().trim());
    });
  }

  backendProcess.on('error', (err) => {
    console.error('[main] Backend process error:', err.message);
  });

  backendProcess.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && code !== 0) {
      console.warn(`[main] Backend exited unexpectedly (code=${code})`);
    }
    backendProcess = null;
  });
}

/**
 * Poll /api/health until backend responds (max timeoutMs).
 * Always resolves — never rejects. Returns true if backend is up.
 */
function waitForBackend(timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();

    function poll() {
      // Give up cleanly on timeout — app will use offline mode
      if (Date.now() - start > timeoutMs) {
        console.warn('[main] Backend health check timed out — using offline mode');
        resolve(false);
        return;
      }

      const req = http.get(
        { hostname: 'localhost', port: BACKEND_PORT, path: '/api/health', timeout: 800 },
        (res) => {
          res.resume(); // drain response body
          if (res.statusCode === 200) {
            backendReady = true;
            console.log('[main] Backend is ready on port', BACKEND_PORT);
            resolve(true);
          } else {
            setTimeout(poll, 400);
          }
        }
      );

      req.on('error', () => setTimeout(poll, 400));
      req.on('timeout', () => { req.destroy(); setTimeout(poll, 400); });
    }

    // Small initial delay to let the child process start up
    setTimeout(poll, 500);
  });
}

// ── BrowserWindow ─────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  const iconFile = isPackaged
    ? path.join(process.resourcesPath, '..', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'PawnBook Pro',
    icon: fs.existsSync(iconFile) ? iconFile : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Needed so file:// pages can fetch http://localhost:3000
      webSecurity: false,
    },
    backgroundColor: '#FDFCF7',
    show: false, // avoids white flash — shown in ready-to-show
  });

  const indexHtml = resourcePath('frontend', 'index.html');
  mainWindow.loadFile(indexHtml);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // External links → system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startBackend();
  await waitForBackend(10000);
  // Whether or not backend started, open the window.
  // The React app detects server availability and uses offline mode if needed.
  createWindow();
});

// Bring existing window to front on second-instance launch
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Gracefully kill backend on quit
app.on('will-quit', () => {
  if (backendProcess) {
    try { backendProcess.kill('SIGTERM'); } catch (_) {}
    backendProcess = null;
  }
});
