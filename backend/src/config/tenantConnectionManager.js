import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import Redemption from '../models/Redemption.js';
import Vault from '../models/Vault.js';
import Floor from '../models/Floor.js';
import MetalRate from '../models/MetalRate.js';
import Auction from '../models/Auction.js';
import AuctionSurplus from '../models/AuctionSurplus.js';
import DayBook from '../models/DayBook.js';
import AuditLog from '../models/AuditLog.js';
import PrintTemplate from '../models/PrintTemplate.js';
import ShopConfig from '../models/ShopConfig.js';
import Client from '../models/Client.js';
import RePledge from '../models/RePledge.js';

const baseModels = {
  Branch,
  User,
  Customer,
  Loan,
  Repayment,
  Redemption,
  Vault,
  Floor,
  MetalRate,
  Auction,
  AuctionSurplus,
  DayBook,
  AuditLog,
  PrintTemplate,
  ShopConfig,
  Client,
  RePledge
};

// Cache of registered schemas
const schemaRegistry = new Map();

for (const [name, model] of Object.entries(baseModels)) {
  if (model && model.schema) {
    schemaRegistry.set(name, model.schema);
  }
}

// Track already bootstrapped tenant databases to prevent repeated checks
const bootstrappedTenants = new Set();

/**
 * Returns a Mongoose connection/DB handle for the given customerCode.
 * Uses isolated database: `renic_tenant_<customerCode>`
 * 1 Server -> Many isolated Databases per Client
 */
export function getTenantDb(customerCode) {
  let cleanCode = (customerCode || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  
  let dbName;
  if (!cleanCode || cleanCode === 'default' || cleanCode === 'pawnbook_master' || cleanCode === 'master' || cleanCode === 'renic-pb') {
    dbName = 'pawnbook_master';
  } else if (cleanCode.startsWith('pawnbroking-') || cleanCode.startsWith('pawnbroking_')) {
    dbName = cleanCode;
  } else if (cleanCode.startsWith('renic_tenant_') || cleanCode.startsWith('renic_trial_')) {
    const slug = cleanCode.replace(/^(renic_tenant_|renic_trial_)/, '');
    dbName = `pawnbroking-${slug}`;
  } else {
    const slug = cleanCode.replace(/^(pawnbroking[-_]|renic_tenant_)+/g, '');
    dbName = slug ? `pawnbroking-${slug}` : 'pawnbook_master';
  }

  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error(`MongoDB master connection is not ready (readyState: ${mongoose.connection?.readyState})`);
  }

  return mongoose.connection.useDb(dbName, { useCache: true });
}

/**
 * Ensures initial default data exists in the isolated tenant database
 */
export async function ensureTenantBootstrap(customerCode) {
  const cleanCode = (customerCode || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  if (cleanCode === 'default' || cleanCode === 'pawnbook_master' || cleanCode === 'master' || cleanCode === 'renic-pb') {
    return;
  }
  if (bootstrappedTenants.has(cleanCode)) return;
  bootstrappedTenants.add(cleanCode);

  try {
    const tenantDb = getTenantDb(cleanCode);
    const usersCol = tenantDb.collection('users');
    const userCount = await usersCol.countDocuments();

    if (userCount === 0) {
      console.log(`\x1b[36m[Tenant Auto-Bootstrap]\x1b[0m Initializing clean database for tenant [${cleanCode.toUpperCase()}]...`);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '123456', 10);
      
      // 1. Seed Admin User
      await usersCol.insertOne({
        name: 'Store Administrator',
        mobile: process.env.ADMIN_MOBILE || '9345578103',
        email: `${cleanCode}@client.com`,
        password: hashedPassword,
        role: 'ADMIN',
        branchCode: `${cleanCode.toUpperCase()}-01`,
        permissions: {
          canDisburseLoan: true,
          canCollectPayment: true,
          canRedeemLoan: true,
          canUpdateRates: true,
          canManageVault: true,
          canViewReports: true,
          canManageUsers: true,
          canAccessSettings: true,
          canAuctionPledge: true,
          canRePledgeBank: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Seed ShopConfig with Ticket Number Configuration
      const shopCol = tenantDb.collection('shopconfigs');
      await shopCol.updateOne(
        { customerCode: cleanCode.toUpperCase() },
        {
          $set: {
            customerCode: cleanCode.toUpperCase(),
            shopName: `${cleanCode.toUpperCase()} Pawn Brokers`,
            rbiLicenseNo: `RB/PB/${cleanCode.toUpperCase()}/2026`,
            gstinNo: '',
            address: 'Main Commercial Street',
            phone: '044-28340987',
            mobile: process.env.ADMIN_MOBILE || '9345578103',
            email: `${cleanCode}@client.com`,
            eligibleCollateralPct: 75,
            rbiInterestCapPa: 24,
            defaultMonthlyInterestPct: 2.0,
            defaultGracePeriodDays: 7,
            defaultPenaltyPct: 1.0,
            thermalPrinterName: 'Default Printer',
            thermalPaperWidth: '80mm',
            smsRemindersEnabled: true,
            whatsappAlertsEnabled: true,
            ticketConfig: {
              enabled: true,
              prefix: 'PWN',
              suffix: '',
              separator: '-',
              yearFormat: 'YYYY',
              monthFormat: 'NONE',
              paddingDigits: 4,
              nextSequence: 1,
              patternTemplate: '{PREFIX}-{YEAR}-{SEQ}',
              strictEnforcement: true
            },
            branchConfig: {
              mode: 'SINGLE',
              maxBranches: 1,
              allowInterBranchTransfer: false,
              branches: []
            },
            featurePermissions: {
              allowPartialRelease: true,
              allowRePledge: true,
              enableBlacklistShield: true,
              allowCustomPrintTemplates: true
            },
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      // 3. Seed Main Branch
      const branchCol = tenantDb.collection('branches');
      await branchCol.updateOne(
        { code: `${cleanCode.toUpperCase()}-01` },
        {
          $set: {
            code: `${cleanCode.toUpperCase()}-01`,
            name: `${cleanCode.toUpperCase()} Main Branch`,
            manager: 'Store Administrator',
            mobile: process.env.ADMIN_MOBILE || '9345578103',
            email: `${cleanCode}@client.com`,
            address: 'Main Commercial Street',
            city: 'City Central',
            openTime: '09:30 AM',
            closeTime: '07:30 PM',
            vaults: ['Main Vault Safe A'],
            staff: [],
            isActive: true,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      // 4. Seed Initial Metal Rates if missing
      const ratesCol = tenantDb.collection('metalrates');
      const rateCount = await ratesCol.countDocuments();
      if (rateCount === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        await ratesCol.updateOne(
          { date: todayStr },
          {
            $set: {
              date: todayStr,
              gold22K: 6850,
              gold24K: 7450,
              gold18K: 5600,
              silver: 92,
              platinum: 3600,
              updatedBy: 'System Setup',
              updatedAt: new Date(),
              history: [{ date: todayStr, gold22K: 6850, gold24K: 7450, gold18K: 5600, silver: 92, platinum: 3600 }]
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
      }
      console.log(`\x1b[32m[Tenant Ready]\x1b[0m Isolated DB 'renic_tenant_${cleanCode}' ready.`);
    }
  } catch (err) {
    console.error(`[Tenant Bootstrap Error] Failed for '${cleanCode}':`, err?.message);
  }
}

/**
 * Returns a model bound strictly to the given tenant's database.
 */
export function getTenantModel(customerCode, modelName) {
  const tenantDb = getTenantDb(customerCode);

  if (tenantDb.models[modelName]) {
    return tenantDb.models[modelName];
  }

  const schema = schemaRegistry.get(modelName);
  if (!schema) {
    throw new Error(`Schema for model '${modelName}' is not registered`);
  }

  return tenantDb.model(modelName, schema);
}

export default {
  getTenantDb,
  getTenantModel,
  ensureTenantBootstrap
};
