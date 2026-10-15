import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5004;

async function startServer() {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`  🏛️  PawnBook Pro — Jewelry Pawn Broking & Gold Loan ERP `);
    console.log(`  🚀  Backend Server running on http://localhost:${PORT}`);
    console.log(`  ✨  Ready to serve multi-tenant requests`);
    console.log(`================================================================`);
  });

  // Sync port with electron if embedded
  if (global.resolveBackendPort) {
    global.resolveBackendPort(PORT);
  }
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
});
