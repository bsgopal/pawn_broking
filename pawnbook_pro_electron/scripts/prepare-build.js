/**
 * prepare-build.js
 *
 * Always reads source from the original project folders:
 *   pawnbook_pro_react/   → builds with Vite → copies dist/ to electron/frontend/
 *   pawnbook_pro_backend/ → copies source + installs prod deps → electron/backend/
 *
 * Run this before `npm run pack-only` to get a fresh build from latest source.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..', '..'); // Pawn_Broking_ERP/
const ELECTRON_DIR = path.resolve(__dirname, '..');
const REACT_DIR    = path.join(ROOT, 'pawnbook_pro_react');
const BACKEND_SRC  = path.join(ROOT, 'pawnbook_pro_backend');
const FRONTEND_OUT = path.join(ELECTRON_DIR, 'frontend');
const BACKEND_OUT  = path.join(ELECTRON_DIR, 'backend');

// ── Helper: recursive directory copy (skips node_modules) ───────────────────

function copyDir(src, dest, skipDirs = ['node_modules']) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipDirs.includes(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// ── Step 1: Build React with Vite ────────────────────────────────────────────

console.log('\n[1/5] Building React frontend (vite build) from pawnbook_pro_react...');
execSync('npm run build', { cwd: REACT_DIR, stdio: 'inherit' });
console.log('      React build complete.');

// ── Step 2: Copy React dist → electron/frontend ──────────────────────────────

console.log('\n[2/5] Copying React dist → electron/frontend...');
rmDir(FRONTEND_OUT);
copyDir(path.join(REACT_DIR, 'dist'), FRONTEND_OUT);
console.log('      Done.');

// ── Step 3: Copy backend source → electron/backend ──────────────────────────

console.log('\n[3/5] Copying backend source from pawnbook_pro_backend...');
rmDir(BACKEND_OUT);
copyDir(BACKEND_SRC, BACKEND_OUT, ['node_modules', 'data']); // skip data files — stored in AppData at runtime
console.log('      Done.');

// ── Step 4: Patch backend/server.js ─────────────────────────────────────────

console.log('\n[4/5] Patching backend/server.js for AppData storage + env PORT...');

const serverPath = path.join(BACKEND_OUT, 'server.js');
let src = fs.readFileSync(serverPath, 'utf8');

let changed = false;

// Patch DATA_DIR
const oldDataDir  = `const DATA_DIR = path.join(__dirname, 'data');`;
const newDataDir  = `const DATA_DIR = process.env.PAWNBOOK_DATA_DIR || path.join(__dirname, 'data');`;
if (src.includes(oldDataDir)) {
  src = src.replace(oldDataDir, newDataDir);
  changed = true;
  console.log('      Patched DATA_DIR.');
} else if (src.includes(newDataDir)) {
  console.log('      DATA_DIR already patched.');
} else {
  console.warn('      WARNING: Could not locate DATA_DIR line — check server.js manually.');
}

// Patch PORT
const oldPort = `const PORT = 3000;`;
const newPort = `const PORT = parseInt(process.env.PORT, 10) || 3000;`;
if (src.includes(oldPort)) {
  src = src.replace(oldPort, newPort);
  changed = true;
  console.log('      Patched PORT.');
} else if (src.includes(newPort)) {
  console.log('      PORT already patched.');
}

if (changed) {
  fs.writeFileSync(serverPath, src, 'utf8');
}

// ── Step 5: Install backend production dependencies ──────────────────────────

console.log('\n[5/5] Installing backend production dependencies...');
execSync('npm install --omit=dev', { cwd: BACKEND_OUT, stdio: 'inherit' });
console.log('      Done.');

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n✅  Prepare complete! Sources used:');
console.log(`     Frontend : ${REACT_DIR}`);
console.log(`     Backend  : ${BACKEND_SRC}`);
console.log('\n   Run  npm run pack-only  to create the Windows installer.\n');
