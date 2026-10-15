import jwt from 'jsonwebtoken';
import Client from '../models/Client.js';
import { runWithTenant } from './tenantContext.js';

const JWT_SECRET = process.env.JWT_SECRET || 'PawnBookPro_Enterprise_Secure_Token_Key_2026';

const APP_SLUGS = new Set(['pb', 'pawn', 'pawnbroking', 'pos', 'challan', 'wa', 'hq', 'api']);

const hostCache = new Map();
const HOST_CACHE_TTL = 60 * 1000;

async function customerCodeFromHost(rawHost) {
  const host = String(rawHost || '').split(':')[0].toLowerCase();
  if (!host) return '';

  const cached = hostCache.get(host);
  if (cached && Date.now() - cached.at < HOST_CACHE_TTL) return cached.value;

  const parts = host.split('.').filter(Boolean);
  const candidates = [];

  if (parts.length >= 3 && APP_SLUGS.has(parts[0])) candidates.push(`${parts[0]}.${parts[1]}`);
  if (parts.length >= 2) candidates.push(parts[1]);
  if (parts.length >= 1) candidates.push(parts[0]);
  if (parts.length >= 3 && !APP_SLUGS.has(parts[0])) candidates.push(parts.slice(0, 2).join('.'));

  const unique = [...new Set(candidates.filter(Boolean))];
  let code = '';

  if (unique.length) {
    try {
      const client = await Client.findOne({
        $or: [
          { customerCode: { $in: unique.map(c => c.toUpperCase()) } },
          { shopSlug: { $in: unique } },
          { subdomain: { $in: unique } }
        ]
      });
      if (client?.customerCode) code = String(client.customerCode);
    } catch {
      // Ignore
    }
  }

  hostCache.set(host, { value: code, at: Date.now() });
  return code;
}

function heuristicCodeFromHost(rawHost) {
  const hostWithoutPort = String(rawHost || '').split(':')[0].toLowerCase();
  const isIp =
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort) ||
    hostWithoutPort === 'localhost' ||
    hostWithoutPort === '127.0.0.1';
  if (isIp) return '';

  // Cloud provider preview/deployment domains must NEVER be treated as tenant codes!
  if (
    hostWithoutPort.endsWith('.vercel.app') ||
    hostWithoutPort.endsWith('.now.sh') ||
    hostWithoutPort.endsWith('.onrender.com') ||
    hostWithoutPort.endsWith('.netlify.app')
  ) {
    return '';
  }

  const parts = hostWithoutPort.split('.');
  if (parts.length < 2) return '';

  let sub = parts[0];
  if (APP_SLUGS.has(sub) && parts.length >= 3) sub = parts[1];

  const reserved = ['www', 'api', 'admin', 'hq', 'localhost', 'app', 'mail', 'ftp', 'lvh', 'local', 'pb', 'pawn', 'pawn-broking', 'pawnbroking'];
  if (reserved.includes(sub) || /^\d+$/.test(sub)) return '';
  return sub;
}

export async function tenantResolver(req, res, next) {
  try {
    await resolveTenant(req, res);
    runWithTenant(req.customerCode, () => next());
  } catch (err) {
    console.error('[PawnBook TenantResolver] Resolution error:', err?.message);
    req.customerCode = 'renic-pb';
    req.tenantSource = 'error-fallback';
    try { res.setHeader('X-Tenant-Code', 'renic-pb'); res.setHeader('X-Tenant-Source', 'error-fallback'); } catch {}
    runWithTenant('renic-pb', () => next());
  }
}

async function resolveTenant(req, res) {
  let customerCode = '';
  let source = 'none';

  // 0. URL path prefix (e.g. /:clientId/api/...)
  const pathMatch = req.url.match(/^\/([a-zA-Z0-9_-]+)(\/api(?:\/.*|\?.*|$))/);
  const reservedPathSegments = ['api', 'uploads', 'assets', 'static', 'node_modules', 'favicon.ico', 'health', 'public'];
  if (pathMatch && !reservedPathSegments.includes(pathMatch[1].toLowerCase())) {
    customerCode = pathMatch[1].toUpperCase();
    source = 'path';
    req.originalUrl = req.url;
    req.url = pathMatch[2];
  }

  // 1. Signed JWT token
  let rawToken = req.cookies?.token;
  if (!rawToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    rawToken = req.headers.authorization.slice(7).trim();
  }
  if (rawToken) {
    try {
      const decoded = jwt.decode(rawToken);
      if (decoded && decoded.customerCode) {
        customerCode = decoded.customerCode;
        source = 'jwt';
      }
    } catch {}
  }

  // 2. Explicit headers
  if (!customerCode) {
    const headerCode = req.headers['x-customer-code'] || req.headers['x-tenant-code'] || req.headers['x-tenant-id'] || req.headers['x-client-id'];
    if (headerCode) {
      customerCode = String(headerCode).trim();
      source = 'header';
    }
  }

  // 3. Query parameters
  if (!customerCode && (req.query.tenant || req.query.customerCode)) {
    customerCode = String(req.query.tenant || req.query.customerCode).trim();
    source = 'query';
  }

  // 4. Host header
  if (!customerCode) {
    const fromHost = await customerCodeFromHost(req.headers.host);
    if (fromHost) {
      customerCode = fromHost;
      source = 'host-verified';
    } else {
      const heuristic = heuristicCodeFromHost(req.headers.host);
      if (heuristic) {
        customerCode = heuristic;
        source = 'host-heuristic';
      }
    }
  }

  // 5. Fallback default
  if (!customerCode || customerCode === 'default' || customerCode === 'renic-pb' || /^\d+$/.test(customerCode)) {
    customerCode = 'default';
    source = source === 'none' ? 'fallback-default' : source;
  }

  const cleanCode = customerCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  req.customerCode = cleanCode;
  req.tenantSource = source;
  res.setHeader('X-Tenant-Code', cleanCode);
  res.setHeader('X-Tenant-Source', source);
}

export default tenantResolver;
