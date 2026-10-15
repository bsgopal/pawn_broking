import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

import tenantResolver from './middleware/tenantResolver.js';
import { enforceClientRegistration } from './middleware/license.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import loanRoutes from './routes/loans.js';
import repaymentRoutes from './routes/repayments.js';
import redemptionRoutes from './routes/redemptions.js';
import vaultRoutes from './routes/vaults.js';
import rateRoutes from './routes/rates.js';
import auctionRoutes from './routes/auctions.js';
import daybookRoutes from './routes/daybook.js';
import reportRoutes from './routes/reports.js';
import settingRoutes from './routes/settings.js';
import printTemplateRoutes from './routes/printTemplates.js';
import auditLogRoutes from './routes/auditLogs.js';
import licenseRoutes from './routes/license.js';
import telemetryRoutes from './routes/telemetry.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import repledgeRoutes from './routes/repledge.js';
import { connectDB } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Restore original request URL if rewritten by Vercel serverless function
app.use((req, res, next) => {
  if (req.query && req.query.__path !== undefined) {
    const rawPath = Array.isArray(req.query.__path) ? req.query.__path.join('/') : req.query.__path;
    req.url = `/${rawPath}`;
    delete req.query.__path;
  } else if (req.url === '/api/index.js' || req.url.startsWith('/api/index.js')) {
    const original = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.url.replace(/^\/api\/index\.js/, '');
    if (original) {
      req.url = original.startsWith('/') ? original : `/${original}`;
    }
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure database connection is ready for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Serve static uploaded files (ornament photos, KYC documents, logos)
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[PawnBook] Upload directory init skipped or read-only:', e.message);
}
app.use('/uploads', express.static(uploadDir));

// Tenant resolution: authoritative Host, JWT, Header and Query binding
app.use(tenantResolver);

// Request logger
app.use((req, res, next) => {
  console.log(`[PawnBook API] ${req.method} ${req.url} (Tenant: ${req.customerCode || 'default'})`);
  next();
});

// Enforce Renic Soft Client Registration & SaaS License Gate
app.use(enforceClientRegistration);

// REST API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/daybook', daybookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/print-templates', printTemplateRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/v1/license', licenseRoutes);
app.use('/api/tenant', licenseRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/repledge', repledgeRoutes);

// Root & Health check
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    service: 'PawnBook Pro API',
    application: 'PawnBook Pro — Jewelry Pawn Broking ERP',
    version: '2.0.0',
    tenant: req.customerCode || 'default',
    time: new Date().toISOString()
  });
});

// Serve frontend dist static assets in production
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[PawnBook Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
