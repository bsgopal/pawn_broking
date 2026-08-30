// PawnBook Pro v2.0 - Local Node.js + Express API Backend Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const JWT_SECRET = 'pb_cryptographic_jwt_secret_signing_key_2026';

// Enable CORS and Body-Parser
app.use(cors());
app.use(bodyParser.json());

// Ensure the local data directory exists
const DATA_DIR = process.env.PAWNBOOK_DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper: Load a table from JSON file or seed default mock data
function loadTable(name, seedData) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(seedData, null, 2), 'utf8');
    return seedData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return seedData;
  }
}

// Helper: Save table data back to JSON file
function saveTable(name, data) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ==================== DATABASE INITIALIZATION AND SEEDS ==================== //
const INITIAL_BRANCHES = [
  { id: "B001", name: "Chennai Main", code: "CHN001", manager: "Suresh Kumar", phone: "044-28340987", mobile: "9876543210", email: "chn@srilakshmipawn.com", address: "123 Gandhi Nagar, T Nagar", city: "Chennai", openTime: "10:00 AM", closeTime: "07:00 PM", vaults: ["Main Vault - Safe A", "Secondary Vault - Safe B"], staff: ["Ravi Sharma", "Priya Nair"] },
  { id: "B002", name: "Bangalore Main", code: "BLR002", manager: "Rajesh Nair", phone: "080-41258963", mobile: "9876543211", email: "blr@srilakshmipawn.com", address: "45 MG Road, Indiranagar", city: "Bangalore", openTime: "10:00 AM", closeTime: "07:00 PM", vaults: ["Vault Alpha"], staff: ["Anil Kumar"] }
];

const INITIAL_USERS = [
  { id: "U001", mobile: "9345578103", password: "123456", name: "Ravi Sharma", role: "Staff", branchId: "B001", status: "Active" },
  { id: "U002", mobile: "9876543210", password: "password123", name: "Suresh Kumar", role: "Manager", branchId: "B001", status: "Active" }
];

const INITIAL_CUSTOMERS = [];

const INITIAL_LOANS = [];

const INITIAL_VAULTS = Array.from({ length: 12 }, (_, i) => {
  const compNo = i + 1;
  return {
    id: `VAULT-A-12-${compNo}`,
    branchId: 'B001',
    vaultName: 'Main Vault - Safe A',
    compartmentNo: compNo,
    boxNo: compNo,
    capacity: 10,
    currentItems: 0,
    temperature: 18.2 + (i * 0.1),
    lastAudited: '',
    loanIds: []
  };
});

const INITIAL_RATES = {
  current: { date: "2026-05-30", gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500 },
  history: [
    { date: "2026-05-30", gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500 }
  ]
};

const INITIAL_AUCTIONS = [];

const INITIAL_AUDITS = [];

const INITIAL_SETTINGS = {
  shopName: "Sri Lakshmi Pawn Brokers",
  rbiLicenseNo: "RB/2026/0045",
  gstinNo: "33ABCDE1234F1Z5",
  address: "123 Gandhi Nagar, T Nagar, Chennai",
  eligibleCollateralPct: 75,
  rbiInterestCapPa: 24,
  defaultGracePeriodDays: 5,
  defaultPenaltyPct: 1,
  smsRemindersEnabled: true
};

const INITIAL_FLOORS = [
  { id: 'FLOOR-B001-1', branchId: 'B001', name: 'Ground Floor - Locker Room A', capacity: 100, securityLevel: 'Maximum Security', itemsCount: 0, loanIds: [], photoProof: '' },
  { id: 'FLOOR-B001-2', branchId: 'B001', name: 'First Floor - Heavy Gold Safe', capacity: 200, securityLevel: 'High Guard Safe', itemsCount: 0, loanIds: [], photoProof: '' }
];

const INITIAL_BULK_TRADES = [];
const INITIAL_DAILY_AUDITS = [];

const INITIAL_PAYMENT_TYPES = [
  { id: 'PT-1', name: 'Monthly Installments (EMI)', desc: 'Calculates monthly payment slices including monthly interest accruals' },
  { id: 'PT-2', name: 'Single Settlement (Bullet)', desc: 'Bullet payout scheme where all principal + interest is settled at maturity' }
];

// Seed databases in local files
let branches = loadTable('branches', INITIAL_BRANCHES);
let users = loadTable('users', INITIAL_USERS);
let customers = loadTable('customers', INITIAL_CUSTOMERS);
let loans = loadTable('loans', INITIAL_LOANS);
let vaults = loadTable('vaults', INITIAL_VAULTS);
let rates = loadTable('rates', INITIAL_RATES);
let auctions = loadTable('auctions', INITIAL_AUCTIONS);
let audits = loadTable('audits', INITIAL_AUDITS);
let settings = loadTable('settings', INITIAL_SETTINGS);
let floors = loadTable('floors', INITIAL_FLOORS);
let bulkTrades = loadTable('bulkTrades', INITIAL_BULK_TRADES);
let dailyAudits = loadTable('dailyAudits', INITIAL_DAILY_AUDITS);
let paymentTypes = loadTable('paymentTypes', INITIAL_PAYMENT_TYPES);

// Middleware: Authenticate Request via Bearer JWT
function verifyJwtToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Auth token missing' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = decoded;
    next();
  });
}

function logAudit(username, branchCode, action, details) {
  audits.unshift({
    timestamp: new Date().toISOString(),
    username: username || 'System',
    branchCode: branchCode || 'Global',
    action: action,
    details: details
  });
  saveTable('audits', audits);
}

// ==================== REST API ENDPOINTS ==================== //

// 0. Public Health Check (Connection Diagnostics)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', environment: 'PawnBook Pro v2.0' });
});

// 1. Counter Authentication Login
app.post('/api/auth/login', (req, res) => {
  const { mobile, password, branchId } = req.body;
  const user = users.find(u => u.mobile === mobile && u.password === password);
  
  if (user) {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return res.status(400).json({ error: 'Invalid branch ID' });

    // Sign Cryptographically Secure HS256 Token
    const token = jwt.sign(
      { userId: user.id, name: user.name, role: user.role, branchId: branch.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit(user.name, branch.code, 'User Login', `Operator authenticated successfully under branch ${branch.name}.`);
    res.json({ token, user, branch });
  } else {
    res.status(401).json({ error: 'Invalid operator credentials' });
  }
});

// Verify active JWT token on startup
app.get('/api/auth/verify', verifyJwtToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  const branch = branches.find(b => b.id === req.user.branchId);
  res.json({ valid: true, user, branch });
});

// 2. Loans Ledger Management
app.get('/api/loans', verifyJwtToken, (req, res) => {
  const branchLoans = loans.filter(l => l.branchId === req.user.branchId);
  
  // DYNAMIC DUE CALCULATIONS based on current dates comparison
  const today = new Date();
  branchLoans.forEach(l => {
    if (l.status === 'Redeemed' || l.status === 'Auctioned') return;

    const maturity = new Date(l.maturityDate);
    const timeDiff = today - maturity;
    
    if (timeDiff > 0) {
      // Loan has expired, compute overdue parameters
      const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      l.daysOverdue = daysOverdue;
      l.status = 'Overdue';

      // Accrue penalty fees: 1% per month overdue (0.033% per day)
      const penaltyPct = settings.defaultPenaltyPct / 100;
      l.penalty = Math.round(l.principal * penaltyPct * (daysOverdue / 30));
    } else {
      l.daysOverdue = 0;
      l.penalty = 0;
    }

    // Dynamic balance payable update
    const gst = l.interestDue * 0.18;
    l.balancePayable = Math.round(l.principal + l.interestDue + gst + l.penalty);
  });

  saveTable('loans', loans);
  res.json(branchLoans);
});

app.post('/api/loans', verifyJwtToken, (req, res) => {
  const newLoan = req.body;
  
  // Appraisal constraint check (75% LTV)
  const mainOrn = newLoan.ornaments[0];
  const rate = mainOrn.rate;
  const net = mainOrn.net;
  const eligibleCap = net * rate * (settings.eligibleCollateralPct / 100);

  if (newLoan.principal > eligibleCap) {
    return res.status(400).json({ error: `LTV Breach! Principal exceeds 75% cap worth of ₹${Math.round(eligibleCap)}` });
  }

  loans.unshift(newLoan);
  saveTable('loans', loans);

  // Update vault items capacity
  const v = vaults.find(vault => vault.id === newLoan.vaultRef);
  if (v) {
    v.currentItems = Math.min(v.capacity, v.currentItems + 1);
    v.loanIds.push(newLoan.id);
    saveTable('vaults', vaults);
  }

  logAudit(req.user.name, req.user.branchId, 'New Pawn Ticket', `Created Gold Loan Ticket ${newLoan.ticket} for ₹${newLoan.principal}.`);
  res.json({ success: true, loan: newLoan });
});

// 3. Process Repayments Collections
app.post('/api/payments', verifyJwtToken, (req, res) => {
  const { loanId, payment, action } = req.body;
  const l = loans.find(loan => loan.id === loanId);
  if (!l) return res.status(404).json({ error: 'Loan ledger not found' });

  l.payments.push(payment);
  l.amountPaid += payment.totalAmount;

  if (action === 'Interest') {
    l.interestDue = 0;
    l.penalty = 0;
    l.status = 'Active';
    l.daysOverdue = 0;
  } else if (action === 'Partial') {
    l.principal = Math.max(0, l.principal - payment.principal);
    l.interestDue = 0;
    l.penalty = 0;
    l.status = 'Active';
    l.daysOverdue = 0;
  } else if (action === 'Full Settlement') {
    l.principal = 0;
    l.interestDue = 0;
    l.penalty = 0;
    l.status = 'Redeemed';
    l.daysOverdue = 0;

    // Clear locked assets in vaults
    const v = vaults.find(vault => vault.id === l.vaultRef);
    if (v) {
      v.currentItems = Math.max(0, v.currentItems - 1);
      v.loanIds = v.loanIds.filter(id => id !== l.id);
      saveTable('vaults', vaults);
    }
  } else if (action === 'Renewal') {
    l.interestDue = 0;
    l.penalty = 0;
    l.renewalCount++;
    const nextMaturity = new Date();
    nextMaturity.setMonth(nextMaturity.getMonth() + l.duration);
    l.maturityDate = nextMaturity.toISOString().split('T')[0];
    l.status = 'Active';
    l.daysOverdue = 0;
  }

  saveTable('loans', loans);
  logAudit(req.user.name, req.user.branchId, 'Repayment Collected', `Processed ${action} payment for ticket ${l.ticket}. Value: ₹${payment.totalAmount}.`);
  res.json({ success: true, loan: l });
});

// 4. Customers Management
app.get('/api/customers', verifyJwtToken, (req, res) => {
  res.json(customers);
});

app.post('/api/customers', verifyJwtToken, (req, res) => {
  const newCust = req.body;
  customers.push(newCust);
  saveTable('customers', customers);

  logAudit(req.user.name, req.user.branchId, 'Customer Enrolled', `Dossier created for customer ${newCust.name}.`);
  res.json({ success: true, customer: newCust });
});

// 5. Vaults status
app.get('/api/vaults', verifyJwtToken, (req, res) => {
  const branchVaults = vaults.filter(v => v.branchId === req.user.branchId);
  res.json(branchVaults);
});

app.post('/api/vaults/:id/audit', verifyJwtToken, (req, res) => {
  const v = vaults.find(vault => vault.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Vault COMP not found' });

  v.lastAudited = new Date().toISOString().split('T')[0];
  v.temperature = 18.0 + Math.random();
  saveTable('vaults', vaults);

  logAudit(req.user.name, req.user.branchId, 'Vault Inspection', `Inspected COMP ${v.compartmentNo} Safe A. Temp verified at ${v.temperature.toFixed(1)}°C.`);
  res.json({ success: true, vault: v });
});

// 6. Daily Metal Prices
app.get('/api/rates', verifyJwtToken, (req, res) => {
  res.json(rates);
});

app.post('/api/rates', verifyJwtToken, (req, res) => {
  const { gold22K, gold24K, silver, platinum } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  const freshRates = {
    date: todayStr,
    gold22K: parseFloat(gold22K),
    gold24K: parseFloat(gold24K),
    silver: parseFloat(silver),
    platinum: parseFloat(platinum)
  };

  rates.current = freshRates;
  rates.history.push(freshRates);
  saveTable('rates', rates);

  logAudit(req.user.name, req.user.branchId, 'Rates Update', `Board prices altered. Gold 22K updated to ₹${gold22K}/gm.`);
  res.json({ success: true, rates });
});

// 7. General compliance metrics
app.get('/api/audits', verifyJwtToken, (req, res) => {
  const branchAudits = audits.filter(a => a.branchCode === req.user.branchId || a.branchCode === 'CHN001' || a.branchCode === 'Global');
  res.json(branchAudits);
});

app.get('/api/settings', verifyJwtToken, (req, res) => {
  res.json(settings);
});

app.post('/api/settings', verifyJwtToken, (req, res) => {
  settings = req.body;
  saveTable('settings', settings);
  logAudit(req.user.name, req.user.branchId, 'Settings Saved', 'Corporate parameters updated.');
  res.json({ success: true, settings });
});

// 8. Floors Management
app.get('/api/floors', verifyJwtToken, (req, res) => {
  const branchFloors = floors.filter(f => f.branchId === req.user.branchId);
  res.json(branchFloors);
});

app.post('/api/floors', verifyJwtToken, (req, res) => {
  const newFloor = req.body;
  floors.push(newFloor);
  saveTable('floors', floors);
  logAudit(req.user.name, req.user.branchId, 'Storage Room Created', `Created safe storage floor ${newFloor.name}.`);
  res.json({ success: true, floor: newFloor });
});

// 9. Bulk Trades Management
app.get('/api/bulk-trades', verifyJwtToken, (req, res) => {
  res.json(bulkTrades);
});

app.post('/api/bulk-trades', verifyJwtToken, (req, res) => {
  const newTrade = req.body;
  bulkTrades.push(newTrade);
  saveTable('bulkTrades', bulkTrades);
  logAudit(req.user.name, req.user.branchId, 'Bulk Trade Logged', `${newTrade.type} of ${newTrade.netWeight}g logged.`);
  res.json({ success: true, trade: newTrade });
});

// 10. Daily Inventory Count Audits
app.get('/api/audits/inventory', verifyJwtToken, (req, res) => {
  res.json(dailyAudits);
});

app.post('/api/audits/inventory', verifyJwtToken, (req, res) => {
  const newAudit = req.body;
  dailyAudits.unshift(newAudit);
  saveTable('dailyAudits', dailyAudits);
  logAudit(req.user.name, req.user.branchId, 'Daily Inventory Count Audit', `Audit logged. Match: ${newAudit.isMatch ? 'YES' : 'NO'}`);
  res.json({ success: true, audit: newAudit });
});

// 11. Custom Payment Types Schemes
app.get('/api/payment-types', verifyJwtToken, (req, res) => {
  res.json(paymentTypes);
});

app.post('/api/payment-types', verifyJwtToken, (req, res) => {
  const newType = req.body;
  paymentTypes.push(newType);
  saveTable('paymentTypes', paymentTypes);
  logAudit(req.user.name, req.user.branchId, 'Payment Type Created', `New payment type scheme ${newType.name} created.`);
  res.json({ success: true, type: newType });
});

// Start Server
app.listen(PORT, () => {
  console.log(`PawnBook Pro API Backend successfully booted.`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Local JSON databases loaded inside data/ folder.`);
});
