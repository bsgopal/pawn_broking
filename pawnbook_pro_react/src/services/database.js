// PawnBook Pro v2.0 - Smart Auto-Detecting Dual-Mode API & Local Storage Client for React
import { StorageHelper } from './storageHelper';

const kIsWeb = typeof window !== 'undefined';

class JwtService {
  static generateToken(user, branch) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: user.id,
      name: user.name,
      role: user.role,
      branchId: branch.id,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };
    return `${this.base64UrlEncode(JSON.stringify(header))}.${this.base64UrlEncode(JSON.stringify(payload))}.${this.base64UrlEncode('pb_secure_offline_signature')}`;
  }

  static decodeAndValidateToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      if (Math.floor(Date.now() / 1000) > payload.exp) return null;
      return payload;
    } catch (e) {
      return null;
    }
  }

  static base64UrlEncode(input) {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  static base64UrlDecode(input) {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
  }
}

class LocalDatabase {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.isServerActive = false;
    this.isInitialized = false;

    // Global in-memory cache
    this.branches = [];
    this.users = [];
    this.customers = [];
    this.loans = [];
    this.vaults = [];
    this.ratesHistory = [];
    this.currentRates = { date: '2026-05-30', gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500 };
    this.auctions = [];
    this.audits = [];
    this.floors = [];
    this.bulkTrades = [];
    this.dailyAudits = [];
    this.paymentTypes = [];
    this.settings = {
      shopName: 'Sri Lakshmi Pawn Brokers',
      rbiLicenseNo: 'RB/2026/0045',
      gstinNo: '33ABCDE1234F1Z5',
      address: '123 Gandhi Nagar, T Nagar, Chennai',
      eligibleCollateralPct: 75,
      rbiInterestCapPa: 24,
      defaultGracePeriodDays: 5,
      defaultPenaltyPct: 1,
      smsRemindersEnabled: true,
    };

    this.currentUser = null;
    this.currentBranch = null;
    this.activeJwtToken = null;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.activeJwtToken ? { 'Authorization': `Bearer ${this.activeJwtToken}` } : {}),
    };
  }

  // Diagnostic boot check
  async initialize() {
    if (this.isInitialized) return;

    try {
      const response = await fetch(`${this.baseUrl}/api/health`, { method: 'GET' }).catch(() => null);
      if (response && response.status === 200) {
        this.isServerActive = true;
      }
    } catch (e) {
      this.isServerActive = false;
    }

    if (this.isServerActive) {
      await this._initializeFullStackMode();
    } else {
      await this._initializeOfflineMode();
    }

    this.isInitialized = true;
  }

  // Connected network mode
  async _initializeFullStackMode() {
    try {
      const token = localStorage.getItem('pawnbook_pro_jwt_token');
      if (token) {
        this.activeJwtToken = token;
        const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
          method: 'GET',
          headers: this.headers,
        });
        if (response.status === 200) {
          const data = await response.json();
          this.currentUser = data.user;
          this.currentBranch = data.branch;
          await this.fetchAllServerData();
        } else {
          localStorage.removeItem('pawnbook_pro_jwt_token');
          this.activeJwtToken = null;
        }
      } else {
        // Just seed counter dropdown branches dynamically on startup
        const branchesRes = await fetch(`${this.baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: 'dummy', password: 'dummy' }),
        }).catch(() => null);
        // Will fail credentials but we can bootstrap branches list using a silent fetch
      }
    } catch (e) {}

    // Safe fallbacks to fetch branches if not authenticated yet
    if (this.branches.length === 0) {
      this.branches = [
        { id: 'B001', name: 'Chennai Main', code: 'CHN001', manager: 'Suresh Kumar', phone: '044-28340987', mobile: '9876543210', email: 'chn@srilakshmipawn.com', address: '123 Gandhi Nagar, T Nagar', city: 'Chennai', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Main Vault - Safe A', 'Secondary Vault - Safe B'], staff: ['Ravi Sharma', 'Priya Nair'] },
        { id: 'B002', name: 'Bangalore Main', code: 'BLR002', manager: 'Rajesh Nair', phone: '080-41258963', mobile: '9876543211', email: 'blr@srilakshmipawn.com', address: '45 MG Road, Indiranagar', city: 'Bangalore', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Vault Alpha'], staff: ['Anil Kumar'] },
      ];
    }
  }

  async fetchAllServerData() {
    try {
      const [loansRes, custsRes, vaultsRes, ratesRes, auditsRes, settingsRes, floorsRes, tradesRes, auditsInvRes, typesRes] = await Promise.all([
        fetch(`${this.baseUrl}/api/loans`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/customers`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/vaults`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/rates`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/audits`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/settings`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/floors`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/bulk-trades`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/audits/inventory`, { headers: this.headers }),
        fetch(`${this.baseUrl}/api/payment-types`, { headers: this.headers }),
      ]);

      if (loansRes.status === 200) this.loans = await loansRes.json();
      if (custsRes.status === 200) this.customers = await custsRes.json();
      if (vaultsRes.status === 200) this.vaults = await vaultsRes.json();
      if (ratesRes.status === 200) {
        const ratesData = await ratesRes.json();
        this.currentRates = ratesData.current;
        this.ratesHistory = ratesData.history;
      }
      if (auditsRes.status === 200) this.audits = await auditsRes.json();
      if (settingsRes.status === 200) this.settings = await settingsRes.json();
      if (floorsRes.status === 200) this.floors = await floorsRes.json();
      if (tradesRes.status === 200) this.bulkTrades = await tradesRes.json();
      if (auditsInvRes.status === 200) this.dailyAudits = await auditsInvRes.json();
      if (typesRes.status === 200) this.paymentTypes = await typesRes.json();
    } catch (e) {}
  }

  // Standalone offline fallback mode
  async _initializeOfflineMode() {
    try {
      const branchesData = await StorageHelper.readFile('branches.json');
      if (branchesData) {
        this.branches = branchesData;
        this.users = await StorageHelper.readFile('users.json') || [];
        this.customers = await StorageHelper.readFile('customers.json') || [];
        this.loans = await StorageHelper.readFile('loans.json') || [];
        this.vaults = await StorageHelper.readFile('vaults.json') || [];
        this.ratesHistory = await StorageHelper.readFile('ratesHistory.json') || [];
        this.currentRates = await StorageHelper.readFile('currentRates.json') || this.currentRates;
        this.auctions = await StorageHelper.readFile('auctions.json') || [];
        this.audits = await StorageHelper.readFile('audits.json') || [];
        this.floors = await StorageHelper.readFile('floors.json') || [];
        this.bulkTrades = await StorageHelper.readFile('bulkTrades.json') || [];
        this.dailyAudits = await StorageHelper.readFile('dailyAudits.json') || [];
        this.paymentTypes = await StorageHelper.readFile('paymentTypes.json') || [];
        this.settings = await StorageHelper.readFile('settings.json') || this.settings;
      } else {
        this._seedMockData();
        await this.persist();
      }

      const storedToken = localStorage.getItem('pawnbook_pro_jwt_token');
      if (storedToken) {
        const payload = JwtService.decodeAndValidateToken(storedToken);
        if (payload) {
          this.currentUser = this.users.find(u => u.id === payload.userId) || null;
          this.currentBranch = this.branches.find(b => b.id === payload.branchId) || null;
          this.activeJwtToken = storedToken;
        } else {
          localStorage.removeItem('pawnbook_pro_jwt_token');
        }
      }
    } catch (e) {
      this._seedMockData();
    }
  }

  _loadStateFromMap(state) {
    this.branches = state.branches || [];
    this.users = state.users || [];
    this.customers = state.customers || [];
    this.loans = state.loans || [];
    this.vaults = state.vaults || [];
    this.ratesHistory = state.ratesHistory || [];
    this.currentRates = state.currentRates || this.currentRates;
    this.auctions = state.auctions || [];
    this.audits = state.audits || [];
    this.floors = state.floors || [];
    this.bulkTrades = state.bulkTrades || [];
    this.dailyAudits = state.dailyAudits || [];
    this.paymentTypes = state.paymentTypes || [];
    this.settings = state.settings || this.settings;
  }

  _saveStateToMap() {
    return {
      branches: this.branches,
      users: this.users,
      customers: this.customers,
      loans: this.loans,
      vaults: this.vaults,
      ratesHistory: this.ratesHistory,
      currentRates: this.currentRates,
      auctions: this.auctions,
      audits: this.audits,
      floors: this.floors,
      bulkTrades: this.bulkTrades,
      dailyAudits: this.dailyAudits,
      paymentTypes: this.paymentTypes,
      settings: this.settings,
    };
  }

  async persist() {
    if (this.isServerActive) return; // Managed on backend JSON files
    try {
      await Promise.all([
        StorageHelper.writeFile('branches.json', this.branches),
        StorageHelper.writeFile('users.json', this.users),
        StorageHelper.writeFile('customers.json', this.customers),
        StorageHelper.writeFile('loans.json', this.loans),
        StorageHelper.writeFile('vaults.json', this.vaults),
        StorageHelper.writeFile('ratesHistory.json', this.ratesHistory),
        StorageHelper.writeFile('currentRates.json', this.currentRates),
        StorageHelper.writeFile('auctions.json', this.auctions),
        StorageHelper.writeFile('audits.json', this.audits),
        StorageHelper.writeFile('floors.json', this.floors),
        StorageHelper.writeFile('bulkTrades.json', this.bulkTrades),
        StorageHelper.writeFile('dailyAudits.json', this.dailyAudits),
        StorageHelper.writeFile('paymentTypes.json', this.paymentTypes),
        StorageHelper.writeFile('settings.json', this.settings),
      ]);
    } catch (e) {
      console.error('Failed to persist database files offline:', e);
    }
  }

  // Authentication interfaces
  async authenticate(mobile, password, branchId) {
    if (this.isServerActive) {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, password, branchId }),
        });

        if (response.status === 200) {
          const data = await response.json();
          this.currentUser = data.user;
          this.currentBranch = data.branch;
          this.activeJwtToken = data.token;

          localStorage.setItem('pawnbook_pro_jwt_token', this.activeJwtToken);
          await this.fetchAllServerData();
          return true;
        }
      } catch (e) {}
      return false;
    } else {
      // Local offline verification
      const user = this.users.find(u => u.mobile === mobile && u.password === password);
      if (user) {
        this.currentUser = user;
        this.currentBranch = this.branches.find(b => b.id === branchId) || null;

        const token = JwtService.generateToken(user, this.currentBranch);
        this.activeJwtToken = token;

        localStorage.setItem('pawnbook_pro_jwt_token', token);
        this.logAuditEvent('Offline Login', 'Operator authenticated under offline parameters.');
        return true;
      }
      return false;
    }
  }

  async logout() {
    this.currentUser = null;
    this.currentBranch = null;
    this.activeJwtToken = null;
    localStorage.removeItem('pawnbook_pro_jwt_token');
    if (!this.isServerActive) {
      this.logAuditEvent('Offline Logout', 'Session ended.');
    }
  }

  logAuditEvent(action, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      username: this.currentUser ? this.currentUser.name : 'System',
      branchCode: this.currentBranch ? this.currentBranch.code : 'Global',
      action,
      details,
    };
    this.audits.unshift(entry);
    this.persist();
  }

  // Loans Ledger
  async addNewLoan(newLoan) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/loans`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(newLoan),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.loans.unshift(newLoan);
      const v = this.vaults.find(vault => vault.id === newLoan.vaultRef);
      if (v) {
        v.currentItems = Math.min(v.capacity, v.currentItems + 1);
        v.loanIds.push(newLoan.id);
      }
      this.logAuditEvent('New Pawn Ticket', `Created Gold Loan Ticket ${newLoan.ticket} locally.`);
      await this.persist();
    }
  }

  // Payments Collection
  async processPayment(loan, payment, action) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/payments`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ loanId: loan.id, payment, action }),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      loan.payments = loan.payments || [];
      loan.payments.push(payment);
      loan.amountPaid += payment.totalAmount;

      if (action === 'Interest') {
        loan.interestDue = 0;
        loan.penalty = 0;
        loan.status = 'Active';
        loan.daysOverdue = 0;
      } else if (action === 'Partial') {
        loan.principal = Math.max(0, loan.principal - payment.principal);
        loan.interestDue = Math.max(0, loan.interestDue - payment.interest);
        loan.penalty = Math.max(0, loan.penalty - payment.penalty);
        loan.status = 'Active';
        loan.daysOverdue = 0;
      } else if (action === 'Full Settlement') {
        loan.principal = 0;
        loan.interestDue = 0;
        loan.penalty = 0;
        loan.status = 'Redeemed';
        loan.daysOverdue = 0;

        const v = this.vaults.find(vault => vault.id === loan.vaultRef);
        if (v) {
          v.currentItems = Math.max(0, v.currentItems - 1);
          v.loanIds = v.loanIds.filter(id => id !== loan.id);
        }
      } else if (action === 'Renewal') {
        loan.interestDue = 0;
        loan.penalty = 0;
        loan.renewalCount++;
        const nextMaturity = new Date();
        nextMaturity.setMonth(nextMaturity.getMonth() + loan.duration);
        loan.maturityDate = nextMaturity.toISOString().split('T')[0];
        loan.status = 'Active';
        loan.daysOverdue = 0;
      }

      this.logAuditEvent('Repayment Collected', `Processed ${payment.type} locally.`);
      await this.persist();
    }
  }

  // Customers Management
  async addCustomer(customer) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/customers`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(customer),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.customers.push(customer);
      this.logAuditEvent('Customer Enrolled', `Created locally.`);
      await this.persist();
    }
  }

  // Daily Rates
  async updateRates(g22, g24, sil, plat) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/rates`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ gold22K: g22, gold24K: g24, silver: sil, platinum: plat }),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const fresh = { date: todayStr, gold22K: g22, gold24K: g24, silver: sil, platinum: plat };
      this.currentRates = fresh;
      this.ratesHistory.push(fresh);
      this.logAuditEvent('Rates Update', `Metal prices updated locally.`);
      await this.persist();
    }
  }

  // Vault Audit
  async executeVaultInspection(vaultId) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/vaults/${vaultId}/audit`, {
          method: 'POST',
          headers: this.headers,
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      const v = this.vaults.find(vault => vault.id === vaultId);
      if (v) {
        v.lastAudited = new Date().toISOString().split('T')[0];
        v.temperature = 18.0 + Math.random();
      }
      this.logAuditEvent('Vault Inspection', `Manual safety inspection completed locally.`);
      await this.persist();
    }
  }

  // Settings
  async saveSettings(sets) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/settings`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(sets),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.settings = sets;
      this.logAuditEvent('Settings Saved', `Corporate parameters updated locally.`);
      await this.persist();
    }
  }

  // Floors Manager
  async addNewFloor(newFloor) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/floors`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(newFloor),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.floors.push(newFloor);
      this.logAuditEvent('Storage Room Created', `Created safe storage floor ${newFloor.name} locally.`);
      await this.persist();
    }
  }

  // Bulk Trades Manager
  async addBulkTrade(newTrade) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/bulk-trades`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(newTrade),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.bulkTrades.push(newTrade);
      this.logAuditEvent('Bulk Trade Logged', `${newTrade.type} of ${newTrade.netWeight}g logged locally.`);
      await this.persist();
    }
  }

  // Daily Counts Audits
  async addDailyAudit(newAudit) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/audits/inventory`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(newAudit),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.dailyAudits.unshift(newAudit);
      this.logAuditEvent('Daily Inventory Count Audit', `Audit logged locally. Match: ${newAudit.isMatch ? 'YES' : 'NO'}`);
      await this.persist();
    }
  }

  // Payment Types Manager
  async addPaymentType(newType) {
    if (this.isServerActive) {
      try {
        await fetch(`${this.baseUrl}/api/payment-types`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(newType),
        });
        await this.fetchAllServerData();
      } catch (e) {}
    } else {
      this.paymentTypes.push(newType);
      this.logAuditEvent('Payment Type Created', `New payment type scheme ${newType.name} created locally.`);
      await this.persist();
    }
  }

  _seedMockData() {
    this.branches = [
      { id: 'B001', name: 'Chennai Main', code: 'CHN001', manager: 'Suresh Kumar', phone: '044-28340987', mobile: '9876543210', email: 'chn@srilakshmipawn.com', address: '123 Gandhi Nagar, T Nagar', city: 'Chennai', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Main Vault - Safe A', 'Secondary Vault - Safe B'], staff: ['Ravi Sharma', 'Priya Nair'] },
      { id: 'B002', name: 'Bangalore Main', code: 'BLR002', manager: 'Rajesh Nair', phone: '080-41258963', mobile: '9876543211', email: 'blr@srilakshmipawn.com', address: '45 MG Road, Indiranagar', city: 'Bangalore', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Vault Alpha'], staff: ['Anil Kumar'] },
    ];

    this.users = [
      { id: 'U001', mobile: '9345578103', password: '123456', name: 'Ravi Sharma', role: 'Staff', branchId: 'B001', status: 'Active' },
      { id: 'U002', mobile: '9876543210', password: 'password123', name: 'Suresh Kumar', role: 'Manager', branchId: 'B001', status: 'Active' },
    ];

    // Clean house: completely empty operational logs
    this.customers = [];
    this.loans = [];
    this.bulkTrades = [];
    this.dailyAudits = [];

    // Seed default payment types
    this.paymentTypes = [
      { id: 'PT-1', name: 'Monthly Installments (EMI)', desc: 'Calculates monthly payment slices including monthly interest accruals' },
      { id: 'PT-2', name: 'Single Settlement (Bullet)', desc: 'Bullet payout scheme where all principal + interest is settled at maturity' }
    ];

    // Seed default storage floors
    this.floors = [
      { id: 'FLOOR-B001-1', branchId: 'B001', name: 'Ground Floor - Locker Room A', capacity: 100, securityLevel: 'Maximum Security', itemsCount: 0, loanIds: [], photoProof: '' },
      { id: 'FLOOR-B001-2', branchId: 'B001', name: 'First Floor - Heavy Gold Safe', capacity: 200, securityLevel: 'High Guard Safe', itemsCount: 0, loanIds: [], photoProof: '' }
    ];

    this.vaults = Array.from({ length: 12 }, (_, index) => {
      const compNo = index + 1;
      return {
        id: `VAULT-A-12-${compNo}`,
        branchId: 'B001',
        vaultName: 'Main Vault - Safe A',
        compartmentNo: compNo,
        boxNo: compNo,
        capacity: 10,
        currentItems: 0,
        temperature: 18.2 + index * 0.1,
        lastAudited: '',
        loanIds: [],
      };
    });

    this.ratesHistory = [
      { date: '2026-05-30', gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500 },
    ];
    this.currentRates = this.ratesHistory[0];

    this.auctions = [];
    this.audits = [];
  }
}

export const db = new LocalDatabase();
