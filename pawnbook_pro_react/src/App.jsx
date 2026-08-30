import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Button,
  Chip,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Bolt as BoltIcon,
  Description as DescriptionIcon,
  ListAlt as ListIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Gavel as GavelIcon,
  MonetizationOn as RatesIcon,
  PieChart as ReportsIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  LocationOn as LocationIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Help as HelpIcon
} from '@mui/icons-material';

import { db } from './services/database';
import { PermissionHelper } from './services/permissionHelper';

// Import split sub-view components
import LoginScreen from './components/LoginScreen';
import DashboardView from './components/DashboardView';
import BulkTradingView from './components/BulkTradingView';
import NewPawnView from './components/NewPawnView';
import PawnListView from './components/PawnListView';
import PaymentScreen from './components/PaymentScreen';
import VaultManagerView from './components/VaultManagerView';
import RedemptionView from './components/RedemptionView';
import OverdueView from './components/OverdueView';
import AuctionsView from './components/AuctionsView';
import DailyRatesView from './components/DailyRatesView';
import ReportsView from './components/ReportsView';
import AuditTrailView from './components/AuditTrailView';
import SettingsView from './components/SettingsView';
import PrintVoucherModal from './components/PrintVoucherModal';

// 🎨 Premium Malabar Gold Corporate Palette Theme Definitions
const erpTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B1F38', // Malabar Deep Crimson/Burgundy
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C5A059', // Malabar Premium Gilded Gold
      contrastText: '#1A0D11',
    },
    background: {
      default: '#FDFCF7', // Soft warm cream light background
      paper: '#FFFFFF',   // Pure white card surfaces
    },
    text: {
      primary: '#1A0D11', // Deep charcoal typography
      secondary: '#5C5255', // Soft warm slate
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 'bold',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid rgba(197, 160, 89, 0.25)', // Elegant gilded gold border
          boxShadow: '0 4px 12px 0 rgba(107, 31, 56, 0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#FFFFFF',
          backgroundColor: '#6B1F38',
          '&:hover': {
            backgroundColor: '#521427',
          },
        },
      },
    },
  },
});

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function App() {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Print voucher states
  const [printableLoan, setPrintableLoan] = useState(null);
  const [printablePayment, setPrintablePayment] = useState(null);
  const [ledgerFilter, setLedgerFilter] = useState('All');
  const [helpOpen, setHelpOpen] = useState(false);

  // Payment states
  const [paymentLoan, setPaymentLoan] = useState(null);

  // Trigger state updates
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  // Initialize dual database client
  useEffect(() => {
    db.initialize().then(() => {
      setIsDbLoaded(true);
      setIsAuthenticated(db.currentUser !== null);
      
      // Auto-trigger native permission prompts (Camera, Mic, Location) on startup
      PermissionHelper.requestStartupPermissions();
    });

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-clear active loan context when navigating away from payments terminal
  useEffect(() => {
    if (activePage !== 'payment-screen') {
      setPaymentLoan(null);
    }
  }, [activePage]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = async () => {
    await db.logout();
    setIsAuthenticated(false);
  };

  if (!isDbLoaded) {
    return (
      <ThemeProvider theme={erpTheme}>
        <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.default' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold', letterSpacing: 1 }}>
              PAWNBOOK PRO
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Loading enterprise system data...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={erpTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Desktop Left Sidebar */}
            {!isMobile && (
              <Box sx={{ width: 240, bgcolor: 'background.paper', borderRight: '1px solid rgba(212,175,55,0.15)', display: 'flex', flexDirection: 'column' }}>
                <SidebarHeader />
                <SidebarNav activePage={activePage} setActivePage={setActivePage} />
                <SidebarFooter onLogout={handleLogout} />
              </Box>
            )}

            {/* Mobile Topbar */}
            {isMobile && (
              <AppBar position="sticky" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(107,31,56,0.18)', boxShadow: 'none' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                  <IconButton color="primary" edge="start" onClick={() => setDrawerOpen(true)}>
                    <MenuIcon />
                  </IconButton>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>
                      {db.currentBranch?.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setHelpOpen(true)} sx={{ color: '#C5A059' }}>
                      <HelpIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  <Chip
                    size="small"
                    label={`${db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status === 'Overdue').length} Overdue`}
                    color="error"
                    sx={{ fontWeight: 'bold', fontSize: 10 }}
                  />
                </Toolbar>
              </AppBar>
            )}

            {/* Mobile Left Drawer (Collapsible) */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 240, bgcolor: 'background.paper' } }}>
              <SidebarHeader />
              <SidebarNav activePage={activePage} setActivePage={setActivePage} onClose={() => setDrawerOpen(false)} />
              <SidebarFooter onLogout={handleLogout} />
            </Drawer>

            {/* Main Application Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Desktop Dashboard Headers */}
              {!isMobile && <DesktopTopbar onOpenHelp={() => setHelpOpen(true)} />}

              {/* Precious Metal Price Ribbon Ticker */}
              <PriceTicker />

              {/* Dynamic Pages Panel Router */}
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                <ActiveScreen
                  activePage={activePage}
                  setActivePage={setActivePage}
                  setPrintableLoan={setPrintableLoan}
                  setPaymentLoan={setPaymentLoan}
                  setPrintablePayment={setPrintablePayment}
                  tick={tick}
                  forceUpdate={forceUpdate}
                  printableLoan={printableLoan}
                  paymentLoan={paymentLoan}
                  ledgerFilter={ledgerFilter}
                  setLedgerFilter={setLedgerFilter}
                />
              </Box>
            </Box>

            {/* Mobile Bottom Navigation Bar */}
            {isMobile && (
              <BottomNavigation
                value={['dashboard', 'new-pawn', 'pawn-list', 'vault-manager'].indexOf(activePage)}
                onChange={(event, newValue) => {
                  const tabs = ['dashboard', 'new-pawn', 'pawn-list', 'vault-manager'];
                  if (newValue !== -1) setActivePage(tabs[newValue]);
                }}
                showLabels
                sx={{ bgcolor: 'background.paper', borderTop: '1px solid rgba(107,31,56,0.15)', position: 'sticky', bottom: 0 }}
              >
                <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} sx={{ color: activePage === 'dashboard' ? '#6B1F38' : '#5C5255' }} />
                <BottomNavigationAction label="New Pawn" icon={<DescriptionIcon />} sx={{ color: activePage === 'new-pawn' ? '#6B1F38' : '#5C5255' }} />
                <BottomNavigationAction label="Pawn Ledger" icon={<ListIcon />} sx={{ color: activePage === 'pawn-list' ? '#6B1F38' : '#5C5255' }} />
                <BottomNavigationAction label="Lockers" icon={<SecurityIcon />} sx={{ color: activePage === 'vault-manager' ? '#6B1F38' : '#5C5255' }} />
              </BottomNavigation>
            )}
          </Box>
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {/* Dynamic Professional Invoice Voucher Print Modal */}
        {printableLoan && (
          <PrintVoucherModal
            loan={printableLoan}
            payment={printablePayment}
            onClose={() => {
              setPrintableLoan(null);
              setPrintablePayment(null);
            }}
          />
        )}

        {/* Central Help Documentation Dialog */}
        {(() => {
          const getHelpContent = () => {
            switch (activePage) {
              case 'dashboard':
                return {
                  title: '🏠 Dashboard & Counter Overview',
                  steps: [
                    'View expected collections due today, upcoming active payouts, and critical overdue accounts.',
                    'Click on KPI cards to instantly filter the Pawn Ledger by active status (Today, Upcoming, or Overdue).',
                    'Settle active branch alerts by clicking the "Collect" action on overdue accounts.',
                    'Use "Quick Access" cards to navigate directly to critical operations: Release Gold, Create Pawn Tickets, or view Pawn Ledgers.'
                  ],
                  rules: 'RBI Compliance: Interest rates must be calculated transparently and overdue accounts must be monitored closely to trigger legal notifications on time.'
                };
              case 'new-pawn':
                return {
                  title: '💎 Gold Pawn Ticket Creation Guide',
                  steps: [
                    'Borrower Details: Input the customer\'s mobile number. Repeat customer details will auto-sync. Snap or upload KYC photos (Aadhaar/PAN).',
                    'Ornament Specs: Select gold category (e.g. Chain, Ring), enter purity, gross weight, and stone weight. Net weight calculates automatically.',
                    'Appraisal Value: Collateral value is calculated dynamically based on current market rates (24K, 22K, 20K, or 18K).',
                    'LTV Compliance: Outstanding loan principal cannot exceed a maximum limit of 75% of the appraised ornament value.',
                    'Secure Box Assignment: Allocate locker boxes or storage rooms to bind and track gold collateral securely.'
                  ],
                  rules: 'Gold Appraisal Rules: Every ornament must undergo strict acid/touchstone verification by authorized appraisers before disbursement.'
                };
              case 'pawn-list':
                return {
                  title: '📁 Pawn Ledger Directory & Dossier Guide',
                  steps: [
                    'Search & Filter: Search active, overdue, or redeemed tickets using the text filter at the top right of the directory.',
                    'Quick Repayments: Click "Collect" on any ledger row to navigate directly to the priority split collections terminal.',
                    'View Dossier: Click on any row to open the complete customer dossier card showing collateral photos, nominee details, and storage codes.',
                    'Nominee Editing: Click "Edit Profile Details" inside the dossier dialogue to modify nominees, relations, residential details, and Borrower Photos.'
                  ],
                  rules: 'Audit Integrity: Original disburse dates, loan amounts, and accrued YTD interest are fixed ledger values that cannot be modified post-issuance.'
                };
              case 'vault-manager':
                return {
                  title: '🏢 Strong Room Lockers & Audits Guide',
                  steps: [
                    'Construct Strong Rooms: Click "+ Construct Strong Room" in the header to register new storage lockers or secure floor rooms.',
                    'Locker Capacities: Set safe rooms items limit and Safety Guard Levels (Maximum, High, or Standard).',
                    'Climate Check: Select any compartment cell from the climate grid layout to inspect internal temperatures and calibrate sensors.',
                    'Daily Night Audits: Complete physical ornament counts at counter close. Compares manual gold items with system active indexes, raising warnings in case of inventory mismatches.'
                  ],
                  rules: 'Vault Safety Rules: Gold items must be stored inside safety-guard compartments immediately upon loan disbursement.'
                };
              case 'bulk-trading':
                return {
                  title: '👑 Bulk Gold Bullion Trading Guide',
                  steps: [
                    'Transaction Type: Toggle between buying gold from clients (Purchase) or selling outright assets (Sale).',
                    'Wholesale Valuation: Enter customer name, contact details, net weight, purity level, making charges, and waste deductions.',
                    'Photo Proofs: Capture bullion snapshots or upload files. Photos are stored inside the transaction history ledger.',
                    'GST Taxes: Computes standard 3% bullion GST tax. Splitting payment mode allocations (Cash, UPI, Card) is required to execute trades.',
                    'Trade Invoice: Execute direct trades to automatically launch the receipt printer modal featuring printed collateral pictures.'
                  ],
                  rules: 'Tax Rules: Direct bullion trades do not represent pledged collateral loans; they are outright retail transactions requiring immediate 3% GST filing.'
                };
              case 'redemption-hub':
                return {
                  title: '🎯 Release Pledged Gold & Settle Balances Guide',
                  steps: [
                    'Pawn Selection: Search and select the gold pawn ticket the customer is seeking to redeem.',
                    'Side-by-Side Review: Verify original borrower photos and ornaments proofs side-by-side with retrieved safe box items.',
                    'Locker Location: Displays physical room blueprints or compartment box index numbers to retrieve gold items quickly.',
                    'Repayment Settlement: Settle outstanding loan principal, interest amount, 18% GST tax, late penalty, and locker room fees.',
                    'Security OTP Code: Generate and enter the simulated verification OTP sent to the borrower\'s phone to release gold ornaments.'
                  ],
                  rules: 'Handover Rules: Physical gold ornaments must only be disbursed to the original borrower after successful OTP check.'
                };
              case 'payment-screen':
                return {
                  title: '💵 Split Payments Repayments Terminal',
                  steps: [
                    'Collect Repayments: Decoupled screen allows opening payment fields immediately on click without triggers.',
                    'EMI Expectations Memory: Displays expected EMI, progress towards current month expected payments, and carry-over advance surplus.',
                    'Priority Allocation: Auto-calculates allocations: (1) Outstanding Interest first, (2) GST tax, (3) Late Penalties, and (4) Principal Reduction.',
                    'Surplus Roll-over: Excess repayments automatically reduce the customer\'s next expected monthly EMI slices.'
                  ],
                  rules: 'Repayment Rules: Split transactions require immediate receipts printed and GST registers updated.'
                };
              case 'overdue-manager':
                return {
                  title: '⚠️ Delinquent Accounts & Overdue Manager Guide',
                  steps: [
                    'Identify Defaults: Displays list of active accounts that have exceeded their maturity dates.',
                    'Calculate Interest & Penalties: Computes accumulated penalty fees dynamically (usually 1% per overdue cycle).',
                    'Trigger Legal Actions: Prepares defaulted assets to be listed on the Public Auctions Board.',
                    'Export Defaulters Ledger: Print list of critical accounts to dispatch notices.'
                  ],
                  rules: 'Legal Rules: Customers must receive printed notifications at least 30 days before default assets are scheduled for auction.'
                };
              case 'auction-board':
                return {
                  title: '📈 Legal Auctions & Asset Forfeiture Guide',
                  steps: [
                    'Liquidate Defaults: Lists loans that have exceeded RBI\'s 6-month default threshold.',
                    'Reserve Bid Price: Calculates the minimum legal reserve bid (80% of original gold valuation) to ensure compliance.',
                    'Public Bidding Simulator: Click "Run Bids" to simulate live bidding between corporate gold dealers.',
                    'Deficit/Surplus Resolution: Automatically returns excess proceeds to the client\'s bank account or files deficit recovery logs.'
                  ],
                  rules: 'Forfeiture Rules: Auctions are legally permissible only when accounts have exceeded 6 months of unpaid default status.'
                };
              case 'daily-rates':
                return {
                  title: '📈 Metal Rates Board Guide',
                  steps: [
                    'Live Metal Feed: Displays current counter gold (24K, 22K, 20K, 18K), silver, and platinum rates per gram.',
                    'Rates History Ledger: View previous rate updates to track market value trends.',
                    'Manual Rate Calibration: Enter new gram prices to adjust gold loan appraisal values instantly.',
                    'Counter Sync: Updating rates forces all gold loan calculations and wholesale direct trade parameters to align immediately.'
                  ],
                  rules: 'RBI Cap: Rate updates must represent standard market pricing to maintain fair-lending appraisal calculations.'
                };
              case 'reports':
                return {
                  title: '📊 Business Intelligence & Analytics Guide',
                  steps: [
                    'YTD Financial Overview: Computes actual outstanding portfolio volumes, interest earnings, and active client metrics.',
                    'Category Breakdowns: Displays real percentage allocations for interest, principal, penalties, and GST.',
                    'Dynamic Ledger & Expenses: Auto-computes vault storage overhead, processing fees, and staff expenses.',
                    'Branch Comparison: Compares corporate branches dynamically based on actual in-memory loan allocations.'
                  ],
                  rules: 'Reporting Rules: Financial intelligence reports must reflect strictly verified database records for auditing purposes.'
                };
              case 'audit-trail':
                return {
                  title: '📁 Audit Log Trail Guide',
                  steps: [
                    'Enterprise Audit Logging: Tracks all critical actions completed by counter operators in the system.',
                    'Security Details: Logs login events, pawn disbursements, cash repayments, rate adjustments, and vault relocations.',
                    'Operator Accountability: Registers the timestamp, operator name, active branch, and precise detail message for every single log.'
                  ],
                  rules: 'Legal Mandate: System audits must remain locked and immutable to comply with standard jewelry pawn shop inspection requirements.'
                };
              case 'settings':
                return {
                  title: '⚙️ ERP System Settings Guide',
                  steps: [
                    'Shop Configuration: Set shop name, official address, registered branch codes, and GSTIN identification parameters.',
                    'Eligible Collateral Cap: Set the standard LTV cap percentage (default: 75% of gold appraisal value).',
                    'Rules & Caps: Configure standard annual interest rate caps, penalty percentages, and default grace periods.',
                    'System Sync: Saving settings updates official document headers, printed invoices, and loan disburse compliance bounds.'
                  ],
                  rules: 'Security Cap: Settings changes must represent official branch policies and require administrative authorization.'
                };
              default:
                return {
                  title: '📖 PawnBook Pro Counter Guide',
                  steps: [
                    'Select any feature view from the left sidebar navigation.',
                    'Click on "Operator Guide" at the top right header to read instructions for that specific page.',
                    'Contact System Administrators for advanced credentials, settings changes, or backup restorations.'
                  ],
                  rules: 'PawnBook Pro is configured for multi-device branch counter offline operations.'
                };
            }
          };

          const helpInfo = getHelpContent();

          return (
            <Dialog
              open={helpOpen}
              onClose={() => setHelpOpen(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  border: '2px solid #C5A059',
                  bgcolor: '#FDFCF7',
                  p: 1
                }
              }}
            >
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B1F38', fontWeight: 'bold' }}>
                <Typography variant="h6" sx={{ fontWeight: 'black', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {helpInfo.title}
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#6B1F38', mb: 1.5 }}>
                  Step-by-Step Operator Guide:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  {helpInfo.steps.map((step, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ bgcolor: 'rgba(107, 31, 56, 0.1)', minWidth: 20, height: 20, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.2 }}>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', fontSize: 10 }}>{idx + 1}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: 12, color: '#1A0D11', lineHeight: 1.4 }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {helpInfo.rules && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#6B1F38', fontWeight: 'black', display: 'block', mb: 0.5 }}>
                      ⚖️ COMPLIANCE & LEGAL DIRECTIVE:
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.4 }}>
                      {helpInfo.rules}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setHelpOpen(false)} variant="contained" color="primary" sx={{ px: 3 }}>
                  Understood
                </Button>
              </DialogActions>
            </Dialog>
          );
        })()}
      </Box>
    </ThemeProvider>
  );
}

// ==================== SIDEBAR LAYOUT SUB-COMPONENTS ==================== //

function SidebarHeader() {
  return (
    <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <Typography variant="h6" color="primary" sx={{ fontWeight: 'black', letterSpacing: 1.5, fontSize: 18 }}>
        PAWNBOOK PRO
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9, letterSpacing: 0.5 }}>
        Secure Jewelry Broking ERP
      </Typography>
    </Box>
  );
}

function SidebarNav({ activePage, setActivePage, onClose }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id);
  const overdueCount = activeLoans.filter(l => l.status === 'Overdue').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'new-pawn', label: 'New Pawn Ticket', icon: <DescriptionIcon /> },
    { id: 'pawn-list', label: 'Pawn Ledger', icon: <ListIcon />, badge: activeLoans.length },
    { id: 'payment-screen', label: 'EMI Repayments', icon: <RatesIcon /> },
    { id: 'vault-manager', label: 'Strong Room Lockers', icon: <SecurityIcon /> },
    { id: 'bulk-trading', label: 'Bulk Gold Trading', icon: <RatesIcon /> },
    { id: 'redemption-hub', label: 'Release Pledged Gold', icon: <SecurityIcon /> }, // Mapped Redemption
    { id: 'overdue-manager', label: 'Overdue Manager', icon: <WarningIcon />, badge: overdueCount, badgeColor: 'error' },
    { id: 'auction-board', label: 'Auctions Board', icon: <GavelIcon /> },
    { id: 'daily-rates', label: 'Metal Rates Board', icon: <RatesIcon /> },
    { id: 'reports', label: 'Business Reports', icon: <ReportsIcon /> },
    { id: 'audit-trail', label: 'Audit Log Trail', icon: <AuditIcon /> },
    { id: 'settings', label: 'ERP Settings', icon: <SettingsIcon /> },
  ];

  return (
    <List sx={{ flex: 1, p: 2 }}>
      {menuItems.map(item => {
        const active = activePage === item.id;
        return (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setActivePage(item.id);
                if (onClose) onClose();
              }}
              sx={{
                borderRadius: 1,
                bgcolor: active ? 'rgba(107,31,56,0.08)' : 'transparent',
                borderLeft: active ? '4px solid #6B1F38' : 'none',
                color: active ? '#6B1F38' : '#5C5255',
                py: 1,
                px: 1.5,
              }}
            >
              <ListItemIcon sx={{ color: active ? '#6B1F38' : '#5C5255', minWidth: 32 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: active ? 'bold' : 'normal', color: active ? '#6B1F38' : '#5C5255' }}>{item.label}</Typography>} />
              {item.badge > 0 && (
                <Chip
                  size="small"
                  label={item.badge}
                  color={item.badgeColor || 'primary'}
                  sx={{ height: 16, fontSize: 9, fontWeight: 'bold' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

function SidebarFooter({ onLogout }) {
  const name = db.currentUser?.name || 'Operator';
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#D4AF37', color: '#0B0F19', fontWeight: 'bold', fontSize: 11 }}>
          {initials}
        </Avatar>
        <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }} noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>
            {db.currentUser?.role} Operator
          </Typography>
        </Box>
      </Box>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        size="small"
        startIcon={<LogoutIcon />}
        onClick={onLogout}
        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: 10 }}
      >
        Revoke Token & Exit
      </Button>
    </Box>
  );
}

function DesktopTopbar({ onOpenHelp }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id);
  const overdueCount = activeLoans.filter(l => l.status === 'Overdue').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const dueCount = activeLoans.filter(l => l.maturityDate === todayStr && l.status === 'Active').length;

  return (
    <Box sx={{ height: 70, bgcolor: 'background.paper', borderBottom: '1px solid rgba(212,175,55,0.15)', px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', px: 2, py: 0.7, borderRadius: 1 }}>
          <LocationIcon sx={{ color: '#D4AF37', fontSize: 14 }} />
          <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 'bold', fontSize: 11 }}>
            {db.currentBranch?.name} Counter
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<HelpIcon sx={{ color: '#C5A059' }} />}
          onClick={onOpenHelp}
          sx={{ height: 30, fontSize: 11, borderColor: 'rgba(197, 160, 89, 0.3)', color: '#6B1F38', bgcolor: 'rgba(197, 160, 89, 0.03)' }}
        >
          📖 Operator Guide
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
          <WarningIcon sx={{ color: '#EF4444', fontSize: 12 }} />
          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 'bold', fontSize: 10 }}>
            {overdueCount} Overdue
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
          <WarningIcon sx={{ color: '#F59E0B', fontSize: 12 }} />
          <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 10 }}>
            {dueCount} Due Today
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function PriceTicker() {
  const { currentRates } = db;
  return (
    <Box sx={{ height: 38, bgcolor: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.15)', display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', py: 1, px: 3, alignItems: 'center', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%' }} />
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11 }}>Gold 22K: </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 11, color: 'text.primary' }}>{currencyFormat(currentRates.gold22K)}/gm</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%' }} />
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11 }}>Gold 24K: </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 11, color: 'text.primary' }}>{currencyFormat(currentRates.gold24K)}/gm</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%' }} />
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11 }}>Silver: </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 11, color: 'text.primary' }}>{currencyFormat(currentRates.silver)}/gm</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%' }} />
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11 }}>Platinum: </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 11, color: 'text.primary' }}>{currencyFormat(currentRates.platinum)}/gm</Typography>
      </Box>
    </Box>
  );
}

// ==================== VIEW SCREENS ROUTER ==================== //

function ActiveScreen({ activePage, setActivePage, setPrintableLoan, setPaymentLoan, setPrintablePayment, tick, forceUpdate, printableLoan, paymentLoan, ledgerFilter, setLedgerFilter }) {
  switch (activePage) {
    case 'dashboard':
      return <DashboardView setActivePage={setActivePage} setPrintableLoan={setPrintableLoan} setLedgerFilter={setLedgerFilter} />;
    case 'new-pawn':
      return <NewPawnView onStateChange={forceUpdate} setPrintableLoan={setPrintableLoan} />;
    case 'pawn-list':
      return <PawnListView onStateChange={forceUpdate} setActivePage={setActivePage} setPrintableLoan={setPrintableLoan} setPaymentLoan={setPaymentLoan} ledgerFilter={ledgerFilter} setLedgerFilter={setLedgerFilter} />;
    case 'vault-manager':
      return <VaultManagerView onStateChange={forceUpdate} />;
    case 'bulk-trading':
      return <BulkTradingView onStateChange={forceUpdate} />;
    case 'payment-screen':
      return (
        <PaymentScreen
          initialLoan={paymentLoan}
          initialMode="Interest"
          onStateChange={forceUpdate}
          onShowVoucher={(l, p) => {
            setPrintableLoan(l);
            setPrintablePayment(p);
            setActivePage('pawn-list');
          }}
        />
      );
    case 'redemption-hub':
      return <RedemptionView onStateChange={forceUpdate} setActivePage={setActivePage} setPrintableLoan={setPrintableLoan} />;
    case 'overdue-manager':
      return <OverdueView onStateChange={forceUpdate} setActivePage={setActivePage} setPrintableLoan={setPrintableLoan} />;
    case 'auction-board':
      return <AuctionsView />;
    case 'daily-rates':
      return <DailyRatesView onStateChange={forceUpdate} />;
    case 'reports':
      return <ReportsView />;
    case 'audit-trail':
      return <AuditTrailView />;
    case 'settings':
      return <SettingsView onStateChange={forceUpdate} />;
    default:
      return <Typography>Module loaded offline.</Typography>;
  }
}
