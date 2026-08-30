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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Description as DocIcon,
  TrendingUp as TrendIcon,
  CheckCircle as VerifyIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function AuctionsView() {
  const auctionedLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status === 'Auctioned');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [activeLot, setActiveLot] = useState(null);
  const [liveBidding, setLiveBidding] = useState(false);
  const [bidValue, setBidValue] = useState(0);
  const [bidProgress, setBidProgress] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const [bidSuccess, setBidSuccess] = useState(false);

  // RBI Compliance Rules List
  const rbiRules = [
    "Loans must be 6+ months overdue before auction is legally permitted.",
    "Minimum reserve bid must equal or exceed 80% of original ornament market valuation.",
    "Only registered, government-licensed auctioneers are authorized to host bidding.",
    "Public notice must be published in newspapers 30 days before auction start.",
    "Proceeds go to principal, interest, and legal charges clearance.",
    "Any surplus proceeds must be returned to the customer via verified bank accounts.",
    "Remaining deficit remains a collection debt payable by the customer."
  ];

  const handleStartBidding = (loan) => {
    setActiveLot(loan);
    setLiveBidding(true);
    setBidProgress(0);
    // Reserve bid is 80% of collateral value
    const reserve = Math.round(loan.collateralValue * 0.8);
    setBidValue(reserve);
    setBidHistory([`Reserve Price Set: ${currencyFormat(reserve)}`]);
    setBidSuccess(false);

    // Simulate bids arriving
    let progress = 0;
    let currentBid = reserve;
    const bidNames = ["Malabar Gold Corp", "Muthoot Jewelry Syndicate", "Joyalukkas Ltd", "Senco Bullion Traders", "Sri Lakshmi Partners"];
    
    const interval = setInterval(() => {
      progress += 20;
      setBidProgress(progress);

      if (progress < 100) {
        // Add random bid hike
        const increment = Math.round(5000 + Math.random() * 8000);
        currentBid += increment;
        setBidValue(currentBid);
        const buyer = bidNames[Math.floor(Math.random() * bidNames.length)];
        setBidHistory(prev => [...prev, `${buyer} Bid: ${currencyFormat(currentBid)}`]);
      } else {
        clearInterval(interval);
        setBidSuccess(true);
        // Sell the lot
        handleFinalizeSale(loan, currentBid);
      }
    }, 1200);
  };

  const handleFinalizeSale = async (loan, finalPrice) => {
    // Calculations: surplus or deficit
    const totalDue = Math.round(loan.principal + loan.interestDue + (loan.interestDue * 0.18) + (loan.penalty || 0) + 150); // principal + interest + GST + penalty + auction charges
    const surplus = finalPrice - totalDue;

    loan.status = 'Redeemed'; // sold & cleared
    loan.notes = `Asset sold via public auction for ${currencyFormat(finalPrice)}. total dues cleared. ${
      surplus > 0 ? `Surplus of ${currencyFormat(surplus)} due to return to client.` : `Deficit of ${currencyFormat(Math.abs(surplus))} remaining.`
    }`;

    // Add payment entry representing auction closure
    loan.payments = loan.payments || [];
    loan.payments.push({
      id: `PMT-AUC-${Date.now()}`,
      loanId: loan.id,
      customerId: loan.customerId,
      date: new Date().toISOString().split('T')[0],
      type: 'Full Settlement',
      principal: loan.principal,
      interest: loan.interestDue,
      gst: Math.round(loan.interestDue * 0.18),
      penalty: loan.penalty || 0,
      totalAmount: finalPrice,
      amountReceived: finalPrice,
      change: surplus > 0 ? surplus : 0,
      mode: 'Bank Transfer',
      refNo: `AUC-SOLD-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Success',
      receiptNo: `AUC-RCP-${Math.floor(10000 + Math.random() * 90000)}`,
      collectedBy: 'Auction Board',
      notes: `Auction settlement. Surplus: ${currencyFormat(surplus > 0 ? surplus : 0)}.`
    });

    await db.persist();
    db.logAuditEvent('Auction Lot Cleared', `Forfeited gold loan ${loan.ticket} sold for ${currencyFormat(finalPrice)}. Total realized.`);
  };

  const getCustName = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.name : 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>📈 Legal Auctions & Asset Forfeitures</Typography>
        <Typography variant="caption" color="textSecondary">Scheduled government listings, reserve bidding panels, and RBI-compliant default resolution.</Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, border: '1px solid #10B981', bgcolor: 'rgba(16,185,129,0.05)' }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Current Auction Lots / Forfeitures list */}
        <Grid xs={12} md={7}>
          <Card sx={{ mb: 3, border: '1px solid rgba(212,175,55,0.2)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Upcoming Forfeiture Lot Catalog</Typography>
              <Divider sx={{ mb: 2.5 }} />

              {auctionedLoans.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <GavelIcon sx={{ color: '#D4AF37', fontSize: 36, mb: 1.5 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>Branch Portfolio Clear</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', maxWidth: 400, mx: 'auto' }}>
                    Zero assets are currently in default under RBI's 6-month forfeiture threshold. Delinquent accounts will populate here for legal processing.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Lot Ticket</TableCell>
                        <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Customer</TableCell>
                        <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Collateral</TableCell>
                        <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Valuation</TableCell>
                        <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Legal Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auctionedLoans.map(l => (
                        <TableRow key={l.id}>
                          <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{l.ticket}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{getCustName(l.customerId)}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{l.ornaments[0]?.type || 'Gold Item'} · {l.totalNetWt}g</TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{currencyFormat(l.collateralValue)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', py: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<PlayIcon sx={{ fontSize: 12 }} />}
                              onClick={() => handleStartBidding(l)}
                              sx={{ height: 26, fontSize: 10, color: '#0B0F19', fontWeight: 'bold' }}
                            >
                              Run Bids
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

          {/* Historical Results Card */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Previous Auction Results (15-May-2026)</Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">Total Lots Listed</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>22 Lots</Typography>
                  </Box>
                </Grid>
                <Grid xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">Realized Value</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#10B981' }}>{currencyFormat(745320)}</Typography>
                  </Box>
                </Grid>
                <Grid xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">Recovery Rate</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#D4AF37' }}>87.5%</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="inherit" size="small" startIcon={<DocIcon sx={{ fontSize: 12 }} />} sx={{ fontSize: 9, borderColor: 'rgba(255,255,255,0.1)' }}>
                  Download Summary Report
                </Button>
                <Button variant="outlined" color="inherit" size="small" startIcon={<VerifyIcon sx={{ fontSize: 12 }} />} sx={{ fontSize: 9, borderColor: 'rgba(255,255,255,0.1)' }}>
                  Licensed Certificate
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: RBI Rules & Bidding Details */}
        <Grid xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>RBI Compliance Directives</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {rbiRules.map((rule, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ bgcolor: 'rgba(212,175,55,0.1)', p: 0.5, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', fontSize: 10 }}>{idx + 1}</Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11, lineHeight: 1.4 }}>
                      {rule}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Upcoming Public Auction Details</Typography>
              <Divider sx={{ mb: 2 }} />

              <AppraisalRow label="Auction Venue:" value="Corporate Office Auction Hall" />
              <AppraisalRow label="Bidding Commencement:" value="10:00 AM (Daily Ticker)" />
              <AppraisalRow label="Licensed Auctioneer:" value="Govt. Appraiser Legal Officer" />
              <AppraisalRow label="Authorized Observers:" value="RBI Nominee Observer Team" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Bidding Simulator Dialog */}
      <Dialog open={liveBidding} onClose={() => !bidSuccess && setLiveBidding(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#D4AF37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon />
          Live RBI Auction Bidding Simulator
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          {activeLot && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>LOT Ticket: {activeLot.ticket}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Borrower: {getCustName(activeLot.customerId)} · Weight: {activeLot.totalNetWt}g
                  </Typography>
                </Box>
                <Chip
                  label={bidSuccess ? "LOT SOLD" : "BIDDING ACTIVE"}
                  color={bidSuccess ? "success" : "warning"}
                  sx={{ fontWeight: 'bold', fontSize: 10 }}
                />
              </Box>

              <Box sx={{ mb: 3, p: 3, bgcolor: 'background.default', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">CURRENT ACTIVE BID PRICE</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#D4AF37', my: 1 }}>
                  {currencyFormat(bidValue)}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                  Reserve Price Covered (80% Valuation Met ✓)
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>BIDDING PROGRESS</Typography>
                <LinearProgress variant="determinate" value={bidProgress} sx={{ height: 6, borderRadius: 3 }} />
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>REAL-TIME BID LOGS</Typography>
              <Box sx={{ maxHeight: 150, overflowY: 'auto', bgcolor: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.18)', p: 1.5, borderRadius: 1 }}>
                {bidHistory.slice().reverse().map((bid, i) => (
                  <Typography key={i} variant="caption" sx={{ display: 'block', mb: 0.5, fontFamily: 'monospace', color: i === 0 && !bidSuccess ? '#D4AF37' : '#475569' }}>
                    {bid}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLiveBidding(false)} color="primary" variant="contained" disabled={!bidSuccess} sx={{ color: '#0B0F19', fontWeight: 'bold' }}>
            Acknowledge Lot Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function AppraisalRow({ label, value, valueColor = 'text.primary', isBold = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: isBold ? 'bold' : 'normal', color: valueColor, fontSize: 11 }}>{value}</Typography>
    </Box>
  );
}
