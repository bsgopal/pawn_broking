import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  VerifiedUser as OtpIcon,
  MonetizationOn as CollectionsIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function PaymentScreen({ initialLoan, initialMode = 'Interest', onStateChange, onShowVoucher }) {
  const [activeTab, setActiveTab] = useState(0);

  // Tab 0: Installments Directory Search & Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Tab 1: Global Repayments History Search & Filters
  const [historySearchText, setHistorySearchText] = useState('');
  const [historyModeFilter, setHistoryModeFilter] = useState('All');

  // Selected Loan for Collection Dialogue popup
  const [loan, setLoan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billingMode, setBillingMode] = useState(initialMode);
  
  // Split payment amounts
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [refNo, setRefNo] = useState('');

  // OTP Verification Challenge states
  const [otpOpen, setOtpOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);

  // Toast Snackbar States
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const showToast = (msg, severity = 'info') => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Auto-launch dialogue when pre-selected from Pawn Ledger click "Collect"
  useEffect(() => {
    if (initialLoan) {
      handleOpenRepaymentDialog(initialLoan);
    }
  }, [initialLoan]);

  const handleExportDirectoryToExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Ticket,Borrower,Outstanding Principal,Interest Due,Expected Monthly EMI,Status\r\n';
    
    filteredLoans.forEach(l => {
      const c = db.customers.find(cust => cust.id === l.customerId) || { name: 'Unknown Dossier' };
      const calculatedEmi = l.monthlyInstallmentEMI || Math.round((l.principal / l.duration) + (l.principal * (l.interestPct / 100)));
      const row = `"${l.ticket}","${c.name}",${l.principal},${l.interestDue},${calculatedEmi},"${l.status}"`;
      csvContent += row + '\r\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Repayments_Installments_Directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    db.logAuditEvent('Repayments Directory Exported', `Exported ${filteredLoans.length} active repayment rows to Excel.`);
  };

  const handleExportDirectoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>EMI Repayments Directory</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; color: #6B1F38; }
            p { text-align: center; font-size: 12px; color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #C5A059; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: rgba(107,31,56,0.05); color: #6B1F38; }
          </style>
        </head>
        <body>
          <h2>${db.settings.shopName}</h2>
          <p>EMI Repayments Directory - Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Borrower</th>
                <th>Outstanding Principal</th>
                <th>Interest Due</th>
                <th>Expected EMI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    filteredLoans.forEach(l => {
      const c = db.customers.find(cust => cust.id === l.customerId) || { name: 'Unknown Dossier' };
      const calculatedEmi = l.monthlyInstallmentEMI || Math.round((l.principal / l.duration) + (l.principal * (l.interestPct / 100)));
      html += `
        <tr>
          <td><b style="color: #6B1F38;">${l.ticket}</b></td>
          <td>${c.name}</td>
          <td><b>₹${l.principal.toLocaleString('en-IN')}</b></td>
          <td>₹${l.interestDue.toLocaleString('en-IN')}</td>
          <td><b>₹${calculatedEmi.toLocaleString('en-IN')}</b></td>
          <td>${l.status}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    db.logAuditEvent('Repayments Directory Exported', `Generated PDF window for ${filteredLoans.length} directory rows.`);
  };

  const handleExportHistoryToExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Ticket,Customer,Type,Total Collected,Ref No,Cash Split,UPI Split,Card Split\r\n';
    
    filteredHistory.forEach(p => {
      const cash = p.splits?.find(s => s.mode === 'Cash')?.amount || 0;
      const upi = p.splits?.find(s => s.mode === 'UPI')?.amount || 0;
      const card = p.splits?.find(s => s.mode === 'Card')?.amount || 0;
      const row = `"${p.date}","${p.loanTicket}","${p.customerName}","${p.type}",${p.totalAmount},"${p.refNo}",${cash},${upi},${card}`;
      csvContent += row + '\r\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Branch_Repayments_History.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    db.logAuditEvent('Repayments History Exported', `Exported ${filteredHistory.length} transaction events to Excel.`);
  };

  const handleExportHistoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>Branch Repayments History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; color: #6B1F38; }
            p { text-align: center; font-size: 12px; color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #C5A059; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: rgba(107,31,56,0.05); color: #6B1F38; }
          </style>
        </head>
        <body>
          <h2>${db.settings.shopName}</h2>
          <p>Branch Repayments History Ledger - Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Total Collected</th>
                <th>Ref No</th>
                <th>Splits Breakdown</th>
              </tr>
            </thead>
            <tbody>
    `;

    filteredHistory.forEach(p => {
      const splitsText = p.splits?.map(s => `${s.mode}: ₹${s.amount.toLocaleString('en-IN')}`).join(', ') || 'Direct Payout';
      html += `
        <tr>
          <td>${p.date}</td>
          <td><b style="color: #6B1F38;">${p.loanTicket}</b></td>
          <td>${p.customerName}</td>
          <td>${p.type}</td>
          <td><b>₹${p.totalAmount.toLocaleString('en-IN')}</b></td>
          <td>${p.refNo}</td>
          <td>${splitsText}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    db.logAuditEvent('Repayments History Exported', `Generated PDF window for ${filteredHistory.length} history events.`);
  };

  const handleWhatsAppShareForPayment = (p) => {
    const customerObj = db.customers.find(c => c.name === p.customerName) || { mobile: '0000000000' };
    
    let msg = `*${db.settings.shopName}*\n`;
    msg += `*REPAYMENT TRANSACTION RECEIPT*\n\n`;
    msg += `Dear *${p.customerName}*,\n`;
    msg += `We have received your payment successfully.\n\n`;
    msg += `- Ticket No: *${p.loanTicket}*\n`;
    msg += `- Receipt Date: *${p.date}*\n`;
    msg += `- Settlement Scope: *${p.type}*\n`;
    msg += `- Total Paid: *${currencyFormat(p.totalAmount)}*\n`;
    
    const splitsText = p.splits?.map(s => `${s.mode}: ${currencyFormat(s.amount)}`).join(', ');
    if (splitsText) {
      msg += `- Split Breakdown: *${splitsText}*\n`;
    }
    
    msg += `- Reference No: *${p.refNo}*\n\n`;
    msg += `*Allocations:*\n`;
    msg += `- Interest: ${currencyFormat(p.interest || 0)}\n`;
    msg += `- CGST/SGST (18%): ${currencyFormat(p.gst || 0)}\n`;
    msg += `- Penalty: ${currencyFormat(p.penalty || 0)}\n`;
    msg += `- Principal Reduced: ${currencyFormat(p.principal || 0)}\n\n`;
    
    if (p.originalLoan) {
      msg += `Remaining Principal Balance: *${currencyFormat(p.originalLoan.principal)}*\n\n`;
    }
    msg += `Thank you for your payment.`;

    const waUrl = `https://wa.me/91${customerObj.mobile}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    db.logAuditEvent('WhatsApp Receipt Re-Shared', `Re-shared receipt for ticket ${p.loanTicket} to ${customerObj.mobile}.`);
  };

  const handleOpenRepaymentDialog = (selectedLoan) => {
    setLoan(selectedLoan);
    setBillingMode('Interest');
    setCashAmount('');
    setUpiAmount('');
    setCardAmount('');
    setRefNo('');
    setOtpVerified(false);
    setDialogOpen(true);
  };

  const handleCloseRepaymentDialog = () => {
    setDialogOpen(false);
    setLoan(null);
  };

  // Directory Filtering Calculations
  const activeBranchLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status !== 'Redeemed');
  
  const filteredLoans = activeBranchLoans.filter(l => {
    const c = db.customers.find(cust => cust.id === l.customerId) || { name: '', mobile: '' };
    const matchesSearch = l.ticket.toLowerCase().includes(searchText.toLowerCase()) ||
                          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          c.mobile.includes(searchText);
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'Active') {
      return l.status === 'Active';
    }
    if (statusFilter === 'Overdue') {
      return l.status === 'Overdue';
    }
    return true;
  });

  // Global Repayments Event Audit calculations
  const branchLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id);
  const allRepayments = branchLoans.flatMap(l => {
    const c = db.customers.find(cust => cust.id === l.customerId) || { name: 'Unknown Dossier' };
    return (l.payments || []).map(p => ({
      ...p,
      loanTicket: l.ticket,
      customerName: c.name,
      originalLoan: l
    }));
  }).sort((a, b) => b.id.localeCompare(a.id));

  const filteredHistory = allRepayments.filter(p => {
    const matchesSearch = p.loanTicket.toLowerCase().includes(historySearchText.toLowerCase()) ||
                          p.customerName.toLowerCase().includes(historySearchText.toLowerCase()) ||
                          p.refNo.toLowerCase().includes(historySearchText.toLowerCase());
    
    if (!matchesSearch) return false;

    if (historyModeFilter !== 'All') {
      const splits = p.splits || [];
      return splits.some(s => s.mode === historyModeFilter);
    }
    return true;
  });

  // Active Loan statement math details (compiled for Dialog)
  const cust = loan ? (db.customers.find(c => c.id === loan.customerId) || { name: 'Unknown Dossier', mobile: '-' }) : { name: '-', mobile: '-' };
  const gst = loan ? Math.round(loan.interestDue * 0.18) : 0;
  const overduePenalty = loan ? (loan.penalty || 0) : 0;

  // Expected monthly EMI formula with priority override support
  const expectedMonthlyEMI = loan ? (loan.monthlyInstallmentEMI || Math.round(
    (loan.principal / loan.duration) + (loan.principal * (loan.interestPct / 100))
  )) : 0;

  // Split payment totals
  const cashVal = parseFloat(cashAmount) || 0;
  const upiVal = parseFloat(upiAmount) || 0;
  const cardVal = parseFloat(cardAmount) || 0;
  const totalPaidSplits = cashVal + upiVal + cardVal;

  // Live real-time EMI balance simulations
  const remainingNeeded = loan ? Math.max(0, expectedMonthlyEMI - (loan.emiPaidThisMonth || 0) - (loan.surplusPaid || 0)) : 0;
  let simulatedRemainingEmi = remainingNeeded;
  let simulatedNextMonthSurplus = loan ? (loan.surplusPaid || 0) : 0;

  if (totalPaidSplits > 0) {
    if (totalPaidSplits >= remainingNeeded) {
      simulatedRemainingEmi = 0;
      simulatedNextMonthSurplus = (loan ? (loan.surplusPaid || 0) : 0) + (totalPaidSplits - remainingNeeded);
    } else {
      simulatedRemainingEmi = remainingNeeded - totalPaidSplits;
    }
  }

  // Accruals and calculations based on selected mode
  let baseTargetAmount = 0;
  let interestAllocated = 0;
  let gstAllocated = 0;
  let penaltyAllocated = 0;
  let principalAllocated = 0;

  if (loan) {
    if (billingMode === 'Interest') {
      interestAllocated = loan.interestDue;
      gstAllocated = gst;
      penaltyAllocated = overduePenalty;
      baseTargetAmount = loan.interestDue + gst + overduePenalty;
      if (totalPaidSplits > baseTargetAmount) {
        principalAllocated = totalPaidSplits - baseTargetAmount;
      } else {
        principalAllocated = 0;
      }
    } else if (billingMode === 'Full Settlement') {
      interestAllocated = loan.interestDue;
      gstAllocated = gst;
      penaltyAllocated = overduePenalty;
      principalAllocated = loan.principal;
      baseTargetAmount = loan.principal + loan.interestDue + gst + overduePenalty;
    } else if (billingMode === 'Partial') {
      baseTargetAmount = totalPaidSplits;
      
      // Mathematically flawless allocation priority
      let remaining = totalPaidSplits;
      const interestAndGstNeeded = loan.interestDue + gst;
      if (remaining >= interestAndGstNeeded) {
        interestAllocated = loan.interestDue;
        gstAllocated = gst;
        remaining -= interestAndGstNeeded;
      } else {
        interestAllocated = Math.round(remaining / 1.18);
        gstAllocated = remaining - interestAllocated;
        remaining = 0;
      }

      if (remaining > 0) {
        penaltyAllocated = Math.min(remaining, overduePenalty);
        remaining -= penaltyAllocated;
      }

      if (remaining > 0) {
        principalAllocated = remaining;
      }
    }
  }

  const targetPayValue = Math.round(baseTargetAmount);
  const pendingAmount = billingMode === 'Partial' ? 0 : Math.max(0, targetPayValue - totalPaidSplits);

  // Trigger simulated OTP dispatch
  const handleRequestOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpError(false);
    setOtpOpen(true);
    console.log(`[PawnBook OTP Dispatch] Security code for ticket ${loan.ticket}: ${code}`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      setOtpOpen(false);
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  const handleSubmitRepayment = async () => {
    const totalCollected = totalPaidSplits;
    if (totalCollected <= 0) {
      showToast('Please enter valid split payment modes amounts.', 'warning');
      return;
    }

    if (billingMode !== 'Partial' && totalPaidSplits < targetPayValue) {
      showToast(`Split Payment underpaid! Splits must sum to at least ${currencyFormat(targetPayValue)}`, 'warning');
      return;
    }

    if (!otpVerified) {
      showToast('Security Verification Required! Please complete OTP check.', 'warning');
      return;
    }

    // Allocate EMI expectation states
    let remainingNeeded = Math.max(0, expectedMonthlyEMI - (loan.emiPaidThisMonth || 0) - (loan.surplusPaid || 0));
    let newEmiPaid = loan.emiPaidThisMonth || 0;
    let newSurplus = loan.surplusPaid || 0;

    if (totalCollected > remainingNeeded) {
      const surplus = totalCollected - remainingNeeded;
      newSurplus = (loan.surplusPaid || 0) + surplus;
      newEmiPaid = (loan.emiPaidThisMonth || 0) + remainingNeeded;
    } else {
      newEmiPaid = (loan.emiPaidThisMonth || 0) + totalCollected;
    }

    const pmt = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: billingMode,
      principal: principalAllocated,
      interest: interestAllocated,
      gst: gstAllocated,
      penalty: penaltyAllocated,
      totalAmount: totalCollected,
      refNo: refNo || `REF-${Date.now().toString().slice(-6)}`,
      status: 'Success',
      collectedBy: db.currentUser.name,
      splits: [
        { mode: 'Cash', amount: cashVal },
        { mode: 'UPI', amount: upiVal },
        { mode: 'Card', amount: cardVal }
      ].filter(s => s.amount > 0)
    };

    loan.emiPaidThisMonth = newEmiPaid;
    loan.surplusPaid = newSurplus;

    await db.processPayment(loan, pmt, billingMode);
    
    // Add split details to repayment log history row
    loan.payments = loan.payments || [];
    
    setDialogOpen(false);
    onShowVoucher(loan, pmt);
    onStateChange();
    showToast('Repayment installment clearance completed successfully!', 'success');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>💵 expected Monthly EMI Repayments</Typography>
          <Typography variant="caption" color="textSecondary">Manage active borrower dues, adjust custom expect monthly EMIs, and log multi-mode split payment events.</Typography>
        </Box>
      </Box>

      {/* Tabs Layout Switcher */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{
          mb: 3,
          borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
          '& .MuiTabs-indicator': { bgcolor: '#6B1F38' },
          '& .MuiTab-root': { fontWeight: 'bold', fontSize: 13, color: '#5C5255' },
          '& .MuiTab-root.Mui-selected': { color: '#6B1F38' }
        }}
      >
        <Tab label="Installments Directory" />
        <Tab label="Global Repayments History" />
      </Tabs>

      {/* ==================== TAB 0: INSTALLMENTS DIRECTORY ==================== */}
      {activeTab === 0 && (
        <Box>
          {/* Advanced Search & Filtering Card */}
          <Card sx={{ mb: 3, border: '1px solid rgba(197,160,89,0.3)', bgcolor: '#FFFFFF' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search active tickets..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#C5A059', fontSize: 16 }} /></InputAdornment>,
                        style: { fontSize: 12 }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter-label" sx={{ fontSize: 11 }}>Filter by Active Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      label="Filter by Active Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      sx={{ fontSize: 12 }}
                      startAdornment={<InputAdornment position="start"><FilterIcon sx={{ color: '#C5A059', fontSize: 16, mr: 0.5 }} /></InputAdornment>}
                    >
                      <MenuItem value="All" sx={{ fontSize: 12 }}>Show All Active Pawn Tickets</MenuItem>
                      <MenuItem value="Active" sx={{ fontSize: 12 }}>Only On-Time Accounts (Active)</MenuItem>
                      <MenuItem value="Overdue" sx={{ fontSize: 12 }}>Only Delinquent Accounts (Overdue)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleExportDirectoryToExcel}
                    sx={{ height: 32, fontSize: 11, flex: 1 }}
                  >
                    Export Excel
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleExportDirectoryToPDF}
                    sx={{ height: 32, fontSize: 11, flex: 1 }}
                  >
                    Export PDF
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Directory Data Table */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              {filteredLoans.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 6 }}>
                  No active branch gold loans match your filter criteria.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'rgba(107,31,56,0.03)' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Ticket</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Borrower Name</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Outstanding Loan</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Interest Due</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Expected EMI</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5 }}>Status</TableCell>
                        <TableCell sx={{ color: '#6B1F38', fontSize: 11, fontWeight: 'bold', py: 1.5, textAlign: 'center' }}>Clearance Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLoans.map((l) => {
                        const borrower = db.customers.find(c => c.id === l.customerId) || { name: 'Unknown Dossier' };
                        const calculatedEmi = l.monthlyInstallmentEMI || Math.round((l.principal / l.duration) + (l.principal * (l.interestPct / 100)));
                        return (
                          <TableRow
                            key={l.id}
                            hover
                            onClick={() => handleOpenRepaymentDialog(l)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.05)' } }}
                          >
                            <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{l.ticket}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{borrower.name}</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{currencyFormat(l.principal)}</TableCell>
                            <TableCell sx={{ fontSize: 12, color: l.status === 'Overdue' ? '#EF4444' : 'text.primary' }}>{currencyFormat(l.interestDue)}</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 'bold', color: '#C5A059' }}>{currencyFormat(calculatedEmi)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={l.status}
                                color={l.status === 'Active' ? 'success' : 'error'}
                                sx={{ height: 18, fontSize: 9, fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => handleOpenRepaymentDialog(l)}
                                sx={{ height: 26, fontSize: 10 }}
                              >
                                Settle Dues
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ==================== TAB 1: GLOBAL REPAYMENTS HISTORY ==================== */}
      {activeTab === 1 && (
        <Box>
          {/* History Search & Filters */}
          <Card sx={{ mb: 3, border: '1px solid rgba(197,160,89,0.3)', bgcolor: '#FFFFFF' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search global history..."
                    value={historySearchText}
                    onChange={(e) => setHistorySearchText(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#C5A059', fontSize: 16 }} /></InputAdornment>,
                        style: { fontSize: 12 }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="history-filter-label" sx={{ fontSize: 11 }}>Filter by Pay Mode</InputLabel>
                    <Select
                      labelId="history-filter-label"
                      value={historyModeFilter}
                      label="Filter by Pay Mode"
                      onChange={(e) => setHistoryModeFilter(e.target.value)}
                      sx={{ fontSize: 12 }}
                      startAdornment={<InputAdornment position="start"><FilterIcon sx={{ color: '#C5A059', fontSize: 16, mr: 0.5 }} /></InputAdornment>}
                    >
                      <MenuItem value="All" sx={{ fontSize: 12 }}>Show All Payment Events</MenuItem>
                      <MenuItem value="Cash" sx={{ fontSize: 12 }}>Contains Cash Payout splits</MenuItem>
                      <MenuItem value="UPI" sx={{ fontSize: 12 }}>Contains UPI Payout splits</MenuItem>
                      <MenuItem value="Card" sx={{ fontSize: 12 }}>Contains Card Payout splits</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleExportHistoryToExcel}
                    sx={{ height: 32, fontSize: 11, flex: 1 }}
                  >
                    Export Excel
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleExportHistoryToPDF}
                    sx={{ height: 32, fontSize: 11, flex: 1 }}
                  >
                    Export PDF
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Global Event History Table */}
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', bgcolor: '#FFFFFF' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon /> Branch Repayments Event Audit Ledger
                </Typography>
              </Box>
              <Divider />

              {filteredHistory.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 5, fontSize: 12 }}>
                  No payment events found matching your search.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }}>Timestamp / Ref</TableCell>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }}>Ticket / Customer</TableCell>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }}>Type</TableCell>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }}>Total Collected</TableCell>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }} align="right">Event Split Breakdown</TableCell>
                        <TableCell sx={{ color: '#C5A059', fontSize: 10, fontWeight: 'bold', p: 1.5 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHistory.map((p, idx) => (
                        <TableRow key={p.id || idx} hover>
                          <TableCell sx={{ fontSize: 11, p: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 'bold' }}>{p.date}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9, display: 'block' }}>{p.refNo}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, p: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 'bold', color: '#6B1F38' }}>{p.loanTicket}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9, display: 'block' }}>{p.customerName}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, p: 1.5 }}>
                            <Chip
                              size="small"
                              label={p.type}
                              color={p.type === 'Full Settlement' ? 'secondary' : (p.type === 'Interest' ? 'primary' : 'default')}
                              sx={{ height: 16, fontSize: 9, fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, p: 1.5, fontWeight: 'black' }}>{currencyFormat(p.totalAmount)}</TableCell>
                          <TableCell sx={{ fontSize: 11, p: 1.5 }} align="right">
                            {p.splits && p.splits.length > 0 ? (
                              p.splits.map((s, sIdx) => (
                                <Chip
                                  key={sIdx}
                                  size="small"
                                  label={`${s.mode}: ${currencyFormat(s.amount)}`}
                                  sx={{ height: 16, fontSize: 8, mr: 0.5, bgcolor: s.mode === 'Cash' ? 'rgba(107,31,56,0.05)' : (s.mode === 'UPI' ? 'rgba(16,185,129,0.05)' : 'rgba(59,130,246,0.05)'), color: s.mode === 'Cash' ? '#6B1F38' : (s.mode === 'UPI' ? '#10B981' : '#3B82F6') }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" sx={{ fontSize: 10 }}>{p.mode || 'Direct Payout'}</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, p: 1 }} align="right">
                            <Button
                              size="small"
                              startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsAppShareForPayment(p);
                              }}
                              sx={{
                                height: 24,
                                fontSize: 9,
                                bgcolor: '#25D366',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: '#1ebe57' },
                                px: 1,
                                py: 0
                              }}
                            >
                              Share
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ==================== POPUP: REPAYMENTS CLEARANCE DIALOGUE ==================== */}
      {loan && (
        <Dialog
          open={dialogOpen}
          onClose={handleCloseRepaymentDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '2px solid #C5A059',
              bgcolor: '#FDFCF7'
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#6B1F38', color: '#FFFFFF', py: 1.5, px: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              🎫 Settle expected Monthly EMI Dues - {loan.ticket}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              Borrower: <strong>{cust.name}</strong> | Phone: <strong>{cust.mobile}</strong>
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={3}>
              {/* Left Column: Split Pay Entry Form */}
              <Grid item xs={12} md={7}>
                <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CollectionsIcon /> repayment clearance Entry
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel id="dialog-bill-scope-label" sx={{ fontSize: 12 }}>Select Settlement Scope</InputLabel>
                      <Select
                        labelId="dialog-bill-scope-label"
                        value={billingMode}
                        label="Select Settlement Scope"
                        onChange={(e) => {
                          setBillingMode(e.target.value);
                          setCashAmount('');
                          setUpiAmount('');
                          setCardAmount('');
                        }}
                        sx={{ fontSize: 12 }}
                      >
                        <MenuItem value="Interest" sx={{ fontSize: 12 }}>EMI Interest Payout Accruals</MenuItem>
                        <MenuItem value="Partial" sx={{ fontSize: 12 }}>Partial Principal Payout (Flexible EMI Split)</MenuItem>
                        <MenuItem value="Full Settlement" sx={{ fontSize: 12 }}>Full Collateral Pledges Settlement</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                      💳 MULTI-MODE SPLIT PAYOUT ENTRY (CASH, UPI, CARD)
                    </Typography>

                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Cash Split"
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              style: { fontSize: 11 }
                            },
                            inputLabel: { style: { fontSize: 10 } }
                          }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="UPI Split"
                          type="number"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              style: { fontSize: 11 }
                            },
                            inputLabel: { style: { fontSize: 10 } }
                          }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Card Split"
                          type="number"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              style: { fontSize: 11 }
                            },
                            inputLabel: { style: { fontSize: 10 } }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {totalPaidSplits > 0 && (
                      <Card sx={{ mb: 2, border: '1px solid rgba(16,185,129,0.2)', bgcolor: 'rgba(16,185,129,0.02)' }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 'bold', mb: 1, fontSize: 10 }}>
                            📊 Dynamic Payment Allocation Breakdown
                          </Typography>
                          <Divider sx={{ mb: 1 }} />
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Interest Settled</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 10 }}>{currencyFormat(interestAllocated)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">GST Settled (18%)</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 10 }}>{currencyFormat(gstAllocated)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Penalty Settled</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 10 }}>{currencyFormat(penaltyAllocated)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ color: '#6B1F38', fontWeight: 'bold' }} display="block">Principal Reduction</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38', fontSize: 10 }}>{currencyFormat(principalAllocated)}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}

                    <TextField
                      fullWidth
                      size="small"
                      label="Transaction Reference No / Notes"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      sx={{ mb: 2 }}
                      slotProps={{
                        input: { style: { fontSize: 11 } },
                        inputLabel: { style: { fontSize: 11 } }
                      }}
                    />

                    {/* Security Identity Check Box */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, p: 1.2, borderRadius: 2, bgcolor: otpVerified ? 'rgba(16,185,129,0.06)' : 'rgba(107,31,56,0.03)', border: otpVerified ? '1px solid #10B981' : '1px dashed rgba(107,31,56,0.2)' }}>
                      <OtpIcon sx={{ color: otpVerified ? '#10B981' : '#6B1F38', fontSize: 20 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', fontSize: 9 }}>
                          {otpVerified ? 'CUSTOMER IDENTITY SECURELY VERIFIED' : 'OTP RELEASE CHALLENGE REQUIRED'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 8 }}>
                          {otpVerified ? 'Simulated 4-Digit OTP token verified successfully.' : 'Click to send simulated OTP code challenge.'}
                        </Typography>
                      </Box>
                      {!otpVerified && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={handleRequestOtp}
                          sx={{ fontSize: 9, py: 0.2 }}
                        >
                          Send OTP Check
                        </Button>
                      )}
                    </Box>

                    {/* Live Split Status Feedback Panel */}
                    <Box sx={{ mb: 2 }}>
                      {totalPaidSplits === 0 ? (
                        <Alert severity="info" icon={false} sx={{ fontSize: 11, py: 0.5, border: '1px solid rgba(197, 160, 89, 0.3)', bgcolor: 'rgba(253, 252, 247, 0.8)', color: '#5C5255' }}>
                          ℹ️ Enter splits above to match the target payment of <strong>{currencyFormat(targetPayValue)}</strong>.
                        </Alert>
                      ) : pendingAmount > 0 ? (
                        <Alert severity="warning" sx={{ fontSize: 11, py: 0.5, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          ⚠️ Split Mismatch: Enter <strong>{currencyFormat(pendingAmount)}</strong> more in splits to match <strong>{currencyFormat(targetPayValue)}</strong>.
                        </Alert>
                      ) : totalPaidSplits > targetPayValue ? (
                        <Alert severity="success" sx={{ fontSize: 11, py: 0.5, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ✅ Overpayment Accepted! Splits cover target of <strong>{currencyFormat(targetPayValue)}</strong>. Excess <strong>{currencyFormat(totalPaidSplits - targetPayValue)}</strong> will automatically reduce loan principal.
                        </Alert>
                      ) : (
                        <Alert severity="success" sx={{ fontSize: 11, py: 0.5, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ✅ Balanced! Splits match the required <strong>{currencyFormat(targetPayValue)}</strong> perfectly.
                        </Alert>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={totalPaidSplits <= 0 || !otpVerified}
                      onClick={handleSubmitRepayment}
                      sx={{ py: 1, fontWeight: 'bold', fontSize: 11 }}
                    >
                      Save Payment & Update Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column: Statement Balances & Borrower Specific Repayments History */}
              <Grid item xs={12} md={5}>
                <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 1, fontSize: 11 }}>
                      🧾 Accrued Balance Ledger Statement
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />

                    <AppraisalRow label="Outstanding Loan Amount:" value={currencyFormat(loan.principal)} />
                    <AppraisalRow label="Accrued Interest Due:" value={currencyFormat(loan.interestDue)} />
                    <AppraisalRow label="Accrued GST Tax (18%):" value={currencyFormat(gst)} />
                    <AppraisalRow label="Overdue Penalty Accruals:" value={currencyFormat(overduePenalty)} valueColor={overduePenalty > 0 ? '#EF4444' : 'text.primary'} />

                    <Divider sx={{ my: 1, borderStyle: 'dotted' }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: '#C5A059', fontSize: 10 }}>
                      📆 expected Monthly Due
                    </Typography>
                    <AppraisalRow label="Total Expected EMI:" value={currencyFormat(expectedMonthlyEMI)} isBold />
                    <AppraisalRow label="Paid Towards This Month's EMI:" value={currencyFormat(loan.emiPaidThisMonth || 0)} valueColor="#10B981" />
                    <AppraisalRow label="Surplus Paid (Advance):" value={currencyFormat(loan.surplusPaid || 0)} valueColor="#3B82F6" />
                    <AppraisalRow 
                      label="Remaining Expected This Month:" 
                      value={currencyFormat(remainingNeeded)} 
                      valueColor={remainingNeeded > 0 ? '#EF4444' : '#10B981'} 
                      isBold 
                    />

                    {totalPaidSplits > 0 && (
                      <Box sx={{ mt: 1, p: 1.2, border: '1px dashed #C5A059', borderRadius: 1.5, bgcolor: 'rgba(197, 160, 89, 0.04)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: '#6B1F38', fontSize: 9 }}>
                          🔄 SIMULATED BALANCE ONCE SAVED:
                        </Typography>
                        <AppraisalRow label="Total Splits Entered:" value={currencyFormat(totalPaidSplits)} isBold valueColor="#6B1F38" />
                        <AppraisalRow label="Simulated Remaining EMI:" value={currencyFormat(simulatedRemainingEmi)} valueColor={simulatedRemainingEmi > 0 ? '#EF4444' : '#10B981'} isBold />
                        {simulatedNextMonthSurplus > (loan.surplusPaid || 0) && (
                          <AppraisalRow label="Added to Next Month Surplus:" value={currencyFormat(simulatedNextMonthSurplus - (loan.surplusPaid || 0))} valueColor="#3B82F6" />
                        )}
                      </Box>
                    )}

                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 10 }}>TARGET PAY VALUE:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'black', color: '#6B1F38', fontSize: 11 }}>
                        {billingMode === 'Partial' ? 'Flexible Input Sum' : currencyFormat(targetPayValue)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9 }}>Total Splits Paid:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: pendingAmount === 0 ? '#10B981' : '#EF4444', fontSize: 10 }}>
                        {currencyFormat(totalPaidSplits)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Specific Borrower Repayments History */}
                <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, fontSize: 11 }}>
                        <HistoryIcon sx={{ fontSize: 16 }} /> customer previous repayments
                      </Typography>
                    </Box>
                    <Divider />

                    {!loan.payments || loan.payments.length === 0 ? (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 2, fontSize: 10 }}>
                        No repayments captured under this ticket yet.
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none', maxHeight: 150, overflowY: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: 9, fontWeight: 'bold', p: 0.8 }}>Date</TableCell>
                              <TableCell sx={{ fontSize: 9, fontWeight: 'bold', p: 0.8 }}>Type</TableCell>
                              <TableCell sx={{ fontSize: 9, fontWeight: 'bold', p: 0.8 }}>Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loan.payments.map((p, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontSize: 9, p: 0.8 }}>{p.date}</TableCell>
                                <TableCell sx={{ fontSize: 9, p: 0.8 }}>{p.type}</TableCell>
                                <TableCell sx={{ fontSize: 9, p: 0.8, fontWeight: 'bold' }}>{currencyFormat(p.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Button onClick={handleCloseRepaymentDialog} variant="outlined" sx={{ fontSize: 11 }}>
              Close Terminal
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Simulated OTP verification check challenge popup */}
      <Dialog open={otpOpen} onClose={() => setOtpOpen(false)} PaperProps={{ sx: { p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🔐 Security OTP Challenge Dialog</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            Simulating SMS/WhatsApp security token sent to customer's mobile number: <strong>{cust.mobile}</strong>.
          </Typography>
          <Alert severity="info" sx={{ mb: 2, fontSize: 11 }}>
            [Security Simulator Log]: Verified OTP code is: <strong>{generatedOtp}</strong>
          </Alert>

          <TextField
            fullWidth
            size="small"
            label="Enter 4-Digit OTP Code"
            value={enteredOtp}
            onChange={(e) => setEnteredOtp(e.target.value)}
            error={otpError}
            helperText={otpError && 'Incorrect verification OTP entered!'}
            slotProps={{
              input: { style: { fontSize: 12 } }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOtpOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleVerifyOtp} variant="contained">Verify Code</Button>
        </DialogActions>
      </Dialog>

      {/* Dynamic Toast Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 'bold' }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function AppraisalRow({ label, value, valueColor = 'text.primary', isBold = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: isBold ? 'bold' : 'normal', color: valueColor, fontSize: 10 }}>{value}</Typography>
    </Box>
  );
}
