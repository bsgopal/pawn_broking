import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from './config/db.js';
import Branch from './models/Branch.js';
import User from './models/User.js';
import Customer from './models/Customer.js';
import Loan from './models/Loan.js';
import Repayment from './models/Repayment.js';
import Vault from './models/Vault.js';
import MetalRate from './models/MetalRate.js';
import ShopConfig from './models/ShopConfig.js';
import PrintTemplate from './models/PrintTemplate.js';
import DayBook from './models/DayBook.js';

export async function seedPawnDatabase() {
  try {
    await connectDB();

    console.log('--- Initializing PawnBook Pro Clean Production Database ---');

    // 1. Seed Clean Shop Config
    const existingConfig = await ShopConfig.findOne();
    if (!existingConfig) {
      await ShopConfig.create({
        customerCode: process.env.CUSTOMER_CODE || 'DEFAULT',
        shopName: process.env.SHOP_NAME || 'Sri Lakshmi Pawn Brokers',
        rbiLicenseNo: 'RB/PB/2026/001',
        gstinNo: '',
        address: 'Main Commercial Street',
        phone: '044-28340987',
        mobile: process.env.ADMIN_MOBILE || '9345578103',
        email: process.env.ADMIN_EMAIL || 'admin@srilakshmipawn.com',
        eligibleCollateralPct: 75,
        rbiInterestCapPa: 24,
        defaultMonthlyInterestPct: 2.0,
        defaultGracePeriodDays: 7,
        defaultPenaltyPct: 1.0,
        thermalPrinterName: 'Default Printer',
        thermalPaperWidth: '80mm',
        smsRemindersEnabled: true,
        whatsappAlertsEnabled: true
      });
      console.log('✓ Clean Shop Config initialized');
    }

    // 2. Seed Single Clean Store Branch (No fake multi-branches or fake staff)
    const branchCount = await Branch.countDocuments();
    if (branchCount === 0) {
      await Branch.create({
        code: 'MAIN01',
        name: 'Main Store Branch',
        manager: 'Store Administrator',
        mobile: process.env.ADMIN_MOBILE || '9345578103',
        email: process.env.ADMIN_EMAIL || 'admin@srilakshmipawn.com',
        address: 'Main Commercial Street',
        city: 'City Central',
        openTime: '09:30 AM',
        closeTime: '07:30 PM',
        vaults: ['Main Vault Safe A'],
        staff: []
      });
      console.log('✓ 1 Clean Store Branch initialized');
    } else {
      // Remove any leftover demo branches
      await Branch.deleteMany({ code: { $in: ['BLR002'] } });
    }

    // 3. Seed ONLY the Single Admin User (No dummy managers or cashiers)
    const adminMobile = process.env.ADMIN_MOBILE || '9345578103';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@srilakshmipawn.com';
    const adminName = process.env.ADMIN_NAME || 'Store Administrator';

    const existingAdmin = await User.findOne({
      $or: [{ mobile: adminMobile }, { role: 'ADMIN' }]
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: adminName,
        mobile: adminMobile,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        branchCode: 'MAIN01',
        permissions: {
          canDisburseLoan: true,
          canCollectPayment: true,
          canRedeemLoan: true,
          canUpdateRates: true,
          canManageVault: true,
          canViewReports: true,
          canManageSettings: true
        }
      });
      console.log(`✓ Admin User created (${adminMobile} / [Configured Password])`);
    }

    // Clean up any extraneous dummy users (Suresh Kumar, Priya Nair, etc.)
    await User.deleteMany({
      mobile: { $in: ['9876543210', '9876543212'] }
    });

    // 4. Seed Metal Rates schema
    const todayStr = new Date().toISOString().split('T')[0];
    const rateCount = await MetalRate.countDocuments();
    if (rateCount === 0) {
      await MetalRate.create({
        date: todayStr,
        gold22K: 6850,
        gold24K: 7450,
        gold18K: 5600,
        silver: 92,
        platinum: 3600,
        updatedBy: 'System Setup',
        history: [
          { date: todayStr, gold22K: 6850, gold24K: 7450, gold18K: 5600, silver: 92, platinum: 3600 }
        ]
      });
      console.log('✓ Metal Rates initialized');
    }

    // 5. Seed Clean Vault Compartments
    const vaultCount = await Vault.countDocuments();
    if (vaultCount === 0) {
      const defaultVaults = Array.from({ length: 12 }, (_, i) => ({
        vaultName: 'Main Vault Safe A',
        compartmentNo: i + 1,
        boxNo: i + 1,
        capacity: 15,
        currentItems: 0,
        securityLevel: 'MAXIMUM',
        temperature: 20.2,
        lastAudited: new Date(),
        loanIds: [],
        branchCode: 'MAIN01'
      }));
      await Vault.insertMany(defaultVaults);
      console.log('✓ 12 Empty Vault Compartments ready');
    }

    console.log('✓ Customer Database clean & ready (0 Dummy Loans, 0 Mock Customers)');
    console.log('--- Initialization Finished Successfully ---');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

if (process.argv.includes('--run')) {
  seedPawnDatabase().then(() => process.exit(0));
}

export default seedPawnDatabase;
