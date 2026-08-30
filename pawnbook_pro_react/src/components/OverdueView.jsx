import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Warning as WarningIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  NotificationsActive as AlertIcon,
  Gavel as AuctionIcon,
  CheckCircle as DoneIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function OverdueView({ onStateChange, setActivePage, setPrintableLoan }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status !== 'Redeemed' && l.status !== 'Auctioned');

  // Trigger state updates
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSimulationLoan, setActiveSimulationLoan] = useState(null);
  
  // Follow up dialog states
  const [simulatedAction, setSimulatedAction] = useState(null);
  const [actionCustomer, setActionCustomer] = useState(null);

  // Grouping loans by maturity ranges
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  const criticalOverdues = []; // Days Overdue > 0
  const warningDues = [];      // Due today or in the next 3 days
  const infoExpiring = [];     // Expiring within 4 to 10 days

  activeLoans.forEach(l => {
    const maturity = new Date(l.maturityDate);
    const diffTime = maturity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || l.status === 'Overdue') {
      criticalOverdues.push(l);
    } else if (diffDays >= 0 && diffDays <= 3) {
      warningDues.push({ loan: l, days: diffDays });
    } else if (diffDays > 3 && diffDays <= 10) {
      infoExpiring.push({ loan: l, days: diffDays });
    }
  });

  const getCustName = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.name : 'Unknown';
  };

  const getCustMobile = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.mobile : 'N/A';
  };

  const triggerCallSimulation = (loan) => {
    const custName = getCustName(loan.customerId);
    const custMob = getCustMobile(loan.customerId);
    setActionCustomer({ name: custName, mobile: custMob, ticket: loan.ticket });
    setSimulatedAction('Call');
  };

  const triggerSmsSimulation = (loan, channel) => {
    const custName = getCustName(loan.customerId);
    const custMob = getCustMobile(loan.customerId);
    setActionCustomer({ name: custName, mobile: custMob, ticket: loan.ticket, channel });
    setSimulatedAction('SMS');
  };

  const handleBulkRemind = (channel) => {
    if (criticalOverdues.length === 0) {
      setSuccessMsg('No active overdue accounts available to send reminders.');
      return;
    }
    setSuccessMsg(`Bulk compliance reminders successfully broadcasted to ${criticalOverdues.length} operators via ${channel}.`);
    
    // Log audit
    db.logAuditEvent('Bulk Alert Issued', `Broadcasted overdue notices via ${channel} to ${criticalOverdues.length} borrowers.`);
    onStateChange();
  };

  // Simulate default and force overdue status
  const handleForceOverdueSimulation = async (loan, defaultDays) => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - defaultDays);
    
    loan.maturityDate = pastDate.toISOString().split('T')[0];
    loan.status = 'Overdue';
    loan.daysOverdue = defaultDays;
    
    // calculate penalty offline
    const penaltyPct = db.settings.defaultPenaltyPct / 100;
    loan.penalty = Math.round(loan.principal * penaltyPct * (defaultDays / 30));
    loan.interestDue = Math.round(loan.principal * (loan.interestPct / 100) * 3); // 3 months accumulated

    // Update settings in database
    await db.persist();
    
    db.logAuditEvent('Default Sim Active', `Loan Ticket ${loan.ticket} forced into delinquency (${defaultDays} days overdue).`);
    setActiveSimulationLoan(null);
    setSuccessMsg(`Simulation active! Loan ${loan.ticket} marked as ${defaultDays} days overdue with penalty of ${currencyFormat(loan.penalty)}.`);
    onStateChange();
  };

  // Escalate to RBI Auction schedule
  const handleEscalateToAuction = async (loan) => {
    loan.status = 'Auctioned';
    
    // Create an Auction Lot Record
    const lotObj = {
      id: `AUC-${Date.now()}`,
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
      loans: [{ loanId: loan.id, ticketNo: loan.ticket, estimatedValue: loan.collateralValue }],
      estimatedTotal: loan.collateralValue,
      status: 'Scheduled',
      venue: 'Head Office Auction Hall',
      biddingStartTime: '10:00 AM',
      auctioneer: 'Legal Officer',
      terms: 'As per RBI guidelines',
      results: { soldItems: [], unsold: [] }
    };
    
    db.auctions.unshift(lotObj);
    
    // Clear locked assets in vaults
    const v = db.vaults.find(vault => vault.id === loan.vaultRef);
    if (v) {
      v.currentItems = Math.max(0, v.currentItems - 1);
      v.loanIds = v.loanIds.filter(id => id !== loan.id);
    }
    
    await db.persist();
    
    db.logAuditEvent('Auction Forfeiture', `Ticket ${loan.ticket} forfeited & assigned to RBI Auction Catalog ${lotObj.id}.`);
    setSuccessMsg(`RBI legal notice filed! Loan ticket ${loan.ticket} forfeited and scheduled for auction.`);
    onStateChange();
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>⚠️ Forfeitures & Overdue Ledger</Typography>
          <Typography variant="caption" color="textSecondary">Regulatory default tracking, progressive penalty interest, and legal auction prep.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {activeLoans.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={() => setActiveSimulationLoan(activeLoans[0])}
              startIcon={<SpeedIcon />}
              sx={{ fontSize: 10, borderColor: 'rgba(212,175,55,0.3)' }}
            >
              Simulate Delinquency
            </Button>
          )}
        </Stack>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, border: '1px solid #10B981', bgcolor: 'rgba(16,185,129,0.05)' }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Overdue list categorized */}
        <Grid xs={12} md={8}>
          {/* Critical Overdues panel */}
          <Card sx={{ mb: 3, border: '1px solid rgba(239,68,68,0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ fontSize: 18 }} />
                  🔴 CRITICAL - Overdue Collections ({criticalOverdues.length})
                </Typography>
                <Chip label="HIGH RISK" color="error" size="small" sx={{ fontWeight: 'bold', fontSize: 9, height: 16 }} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {criticalOverdues.length === 0 ? (
                <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', py: 4, fontWeight: 'bold' }}>
                  ✅ Branch portfolio healthy. Zero delinquencies or overdue records.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {criticalOverdues.map(l => {
                    const days = l.daysOverdue || Math.floor((new Date() - new Date(l.maturityDate)) / (1000 * 60 * 60 * 24));
                    return (
                      <Card key={l.id} sx={{ mb: 1.5, bgcolor: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <CardContent sx={{ p: '12px !important' }}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid xs={12} sm={4}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>
                                {l.ticket} · {getCustName(l.customerId)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                Principal: {currencyFormat(l.principal)} · Vault: {l.vaultRef}
                              </Typography>
                            </Grid>
                            <Grid xs={12} sm={3}>
                              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', display: 'block' }}>
                                {days} Days Overdue
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Penalty: {currencyFormat(l.penalty || 0)}
                              </Typography>
                            </Grid>
                            <Grid xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => {
                                  setPrintableLoan(l);
                                  setActivePage('payment-screen');
                                }}
                                sx={{ height: 26, fontSize: 9 }}
                              >
                                Collect
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<PhoneIcon sx={{ fontSize: 10 }} />}
                                onClick={() => triggerCallSimulation(l)}
                                sx={{ height: 26, fontSize: 9, borderColor: 'rgba(239,68,68,0.3)' }}
                              >
                                Call
                              </Button>
                              {days >= 180 && (
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  startIcon={<AuctionIcon sx={{ fontSize: 10 }} />}
                                  onClick={() => handleEscalateToAuction(l)}
                                  sx={{ height: 26, fontSize: 9, fontWeight: 'bold', bgcolor: '#EF4444' }}
                                >
                                  Forfeit Asset
                                </Button>
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Warning Dues Panel */}
          <Card sx={{ mb: 3, border: '1px solid rgba(245,158,11,0.2)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertIcon sx={{ fontSize: 18 }} />
                🟡 WARNING - Due Within 3 Days ({warningDues.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {warningDues.length === 0 ? (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                  No outstanding loan accounts maturing in the next 3 days.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {warningDues.map(({ loan, days }) => (
                    <Box key={loan.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, p: 1, borderRadius: 1, bgcolor: 'rgba(245,158,11,0.02)' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>
                          {loan.ticket} · {getCustName(loan.customerId)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Maturity: {loan.maturityDate} ({days === 0 ? 'Today' : `in ${days} days`}) · Principal: {currencyFormat(loan.principal)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<WhatsAppIcon sx={{ fontSize: 10 }} />}
                          onClick={() => triggerSmsSimulation(loan, 'WhatsApp')}
                          sx={{ height: 24, fontSize: 9, borderColor: 'rgba(245,158,11,0.3)' }}
                        >
                          Alert
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Info Expiring panel */}
          <Card sx={{ border: '1px solid rgba(59,130,246,0.2)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DoneIcon sx={{ fontSize: 18 }} />
                🟢 INFO - Expiring Soon ({infoExpiring.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {infoExpiring.length === 0 ? (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                  No active loan accounts expiring in the 4-10 days buffer window.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {infoExpiring.map(({ loan, days }) => (
                    <Box key={loan.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, p: 1, borderRadius: 1, bgcolor: 'rgba(59,130,246,0.02)' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>
                          {loan.ticket} · {getCustName(loan.customerId)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Expires in {days} days ({loan.maturityDate}) · Interest Rate: {loan.interestPct}%
                        </Typography>
                      </Box>
                      <Chip label="RENEWAL READY" size="small" color="primary" sx={{ fontSize: 8, height: 16, fontWeight: 'bold' }} />
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Bulk Actions & Compliance Rules */}
        <Grid xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Smart Reminder Dashboard</Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleBulkRemind('WhatsApp')}
                  startIcon={<WhatsAppIcon />}
                  sx={{ py: 1, color: '#0B0F19', fontWeight: 'bold' }}
                >
                  WhatsApp Broadcast All
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  onClick={() => handleBulkRemind('SMS')}
                  startIcon={<AlertIcon />}
                  sx={{ py: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  SMS Broadcast All Due
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  onClick={() => handleBulkRemind('Email')}
                  startIcon={<EmailIcon />}
                  sx={{ py: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  Email Overdue Notices
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>RBI Compliance Forfeiture Directives</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                <ComplianceText text="Loans must be outstanding for 6+ months (180+ days) past maturity before asset forfeiture is legally active." />
                <ComplianceText text="Grace periods are fixed at 5 days. Penalty interest accrues progressively at 1% per month." />
                <ComplianceText text="Prior to public auctions, registered legal notices must be delivered to verified Aadhaar mobile addresses." />
                <ComplianceText text="Asset recovery surplus must be returned to client bank accounts; deficit remains customer liability." />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Simulator Dialog */}
      <Dialog open={activeSimulationLoan !== null} onClose={() => setActiveSimulationLoan(null)}>
        <DialogTitle sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Simulate Account Delinquency</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            For testing and demonstration, select the number of days you want to force this loan past maturity. This will automatically compute overdue status, progressive penalties, and default flags.
          </Typography>

          {activeSimulationLoan && (
            <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{activeSimulationLoan.ticket}</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                Customer: {getCustName(activeSimulationLoan.customerId)} · Principal: {currencyFormat(activeSimulationLoan.principal)}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" color="warning" onClick={() => handleForceOverdueSimulation(activeSimulationLoan, 15)}>
              15 Days Overdue
            </Button>
            <Button variant="outlined" color="error" onClick={() => handleForceOverdueSimulation(activeSimulationLoan, 65)}>
              65 Days Overdue
            </Button>
            <Button variant="contained" color="error" sx={{ color: '#0B0F19', fontWeight: 'bold' }} onClick={() => handleForceOverdueSimulation(activeSimulationLoan, 200)}>
              200 Days Overdue (Forfeiture Active)
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveSimulationLoan(null)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={simulatedAction !== null} onClose={() => setSimulatedAction(null)}>
        <DialogTitle sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Simulated Counter Engagement</DialogTitle>
        <DialogContent>
          {actionCustomer && (
            <Box>
              {simulatedAction === 'Call' ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <PhoneIcon sx={{ fontSize: 50, color: '#D4AF37', mb: 2, animation: 'pulse 1.5s infinite' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Simulated Dialer Active</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Dialing borrower <strong>{actionCustomer.name}</strong> at <strong>{actionCustomer.mobile}</strong> regarding outstanding ticket <strong>{actionCustomer.ticket}</strong>.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 3, fontStyle: 'italic', color: '#10B981' }}>
                    "Connected. Borrower promised interest settlement by end of week."
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ py: 2 }}>
                  <WhatsAppIcon sx={{ fontSize: 40, color: '#10B981', mb: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Simulated Message Sent</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    A secure RBI Forfeiture warning notification has been issued to {actionCustomer.name} ({actionCustomer.mobile}) via {actionCustomer.channel}.
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>MESSAGE BODY:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: 11 }}>
                      "Sri Lakshmi Pawn Brokers Notice: Gold Loan {actionCustomer.ticket} is currently overdue. Pay ₹{criticalOverdues[0]?.penalty || 500} penalty now or extend collateral term to avoid public legal auction procedures."
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulatedAction(null)} color="primary" variant="contained" sx={{ color: '#0B0F19' }}>
            Acknowledge & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ComplianceText({ text }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%', mt: 0.8 }} />
      <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11, lineHeight: 1.4 }}>
        {text}
      </Typography>
    </Box>
  );
}
