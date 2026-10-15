import axios from 'axios';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from './tenantContext.js';

const RENIC_MASTER_URL = process.env.RENIC_MASTER_URL || 'https://renicsoft-backend.vercel.app';

/**
 * Screen Gate Middleware: Verifies if the requested screen feature is enabled for the tenant
 */
export function checkScreenPermission(screenKey) {
  return async (req, res, next) => {
    try {
      const tenantCode = req.customerCode || getCurrentTenantCode();
      const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
      const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });

      if (config && config.screenPermissions && config.screenPermissions[screenKey] === false) {
        return res.status(403).json({
          success: false,
          code: 'SCREEN_LOCKED',
          message: `The '${screenKey}' module is not enabled in your current plan. Please contact Renic Soft Master Administrator to upgrade.`
        });
      }
      next();
    } catch (err) {
      next();
    }
  };
}

/**
 * Async telemetry reporter: sends non-blocking screen audit and usage events to Renic Soft HQ
 */
export async function reportScreenTelemetry(customerCode, screenPath, user, actionDetails = '') {
  if (!customerCode) return;
  try {
    const payload = {
      customerCode: customerCode.toUpperCase(),
      softwareProduct: 'PAWN_BROKING',
      screenPath,
      userMobile: user?.mobile || user?.email || 'counter_staff',
      userName: user?.name || 'Staff User',
      actionDetails,
      timestamp: new Date()
    };
    
    // Non-blocking fire-and-forget
    axios.post(`${RENIC_MASTER_URL}/api/v1/activity/log`, payload, { timeout: 2000 }).catch(() => {});
  } catch (e) {
    // Ignore telemetry send failure
  }
}

/**
 * Enforce Client Registration in Renic Soft Middleware:
 * Blocks all operational endpoints (loans, repayments, redemptions, vaults, auctions, daybook, etc.)
 * until the client is verified and registered with valid Client ID & Client Secret in Renic Soft Master HQ.
 */
export async function enforceClientRegistration(req, res, next) {
  const rawUrl = req.originalUrl || req.url || '';
  const pathname = rawUrl.split('?')[0];
  
  // Whitelisted endpoints that must remain accessible for licensing & authentication
  if (
    pathname === '/' ||
    pathname === '' ||
    pathname === '/health' ||
    pathname === '/api/health' ||
    pathname.startsWith('/health') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/settings') ||
    pathname.startsWith('/api/rates') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/v1/license') ||
    pathname.startsWith('/api/tenant') ||
    pathname.startsWith('/api/telemetry')
  ) {
    return next();
  }

  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const Client = getTenantModel(tenantCode, 'Client');

    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });
    const client = await Client.findOne({ customerCode: tenantCode.toUpperCase() });

    const isVerified = Boolean(config?.oauthConfig?.verified && config?.oauthConfig?.clientId && config?.oauthConfig?.clientSecret);

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        isRegistered: false,
        code: 'CLIENT_NOT_REGISTERED',
        message: 'PawnBook Pro is not activated. Client must be registered in Renic Soft Master HQ. Please enter your Client ID and Client Secret in Settings to activate your license.'
      });
    }

    next();
  } catch (err) {
    next();
  }
}

export default {
  checkScreenPermission,
  reportScreenTelemetry,
  enforceClientRegistration
};
