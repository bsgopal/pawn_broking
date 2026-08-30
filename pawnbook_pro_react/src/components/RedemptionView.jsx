import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Button,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Autocomplete,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as VerifiedIcon,
  Search as SearchIcon,
  MonetizationOn as CashIcon,
  WhatsApp as WhatsAppIcon,
  LocalPrintshop as PrintIcon,
  VerifiedUser as OtpIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const DEFAULT_PURCHASER_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><circle cx="12" cy="8" r="4" fill="%236B1F38"/><path d="M12 14c-6.1 0-10 4-10 10h20c0-6-3.9-10-10-10z" fill="%236B1F38"/></svg>';
const DEFAULT_JEWELRY_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><circle cx="12" cy="12" r="8" stroke="%23C5A059" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="5" fill="%23C5A059"/></svg>';

export default function RedemptionView({ onStateChange, setActivePage, setPrintableLoan }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status !== 'Redeemed' && l.status !== 'Auctioned');
  const redeemedLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id && l.status === 'Redeemed');

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receiptChannel, setReceiptChannel] = useState('Print');

  // Checklist states
  const [conditionChecked, setConditionChecked] = useState(false);
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [sendDigitalCopy, setSendDigitalCopy] = useState(true);
  const [printHandoverSlip, setPrintHandoverSlip] = useState(true);
  const [updateInsurance, setUpdateInsurance] = useState(true);

  // OTP release security
  const [otpOpen, setOtpOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setSuccessMsg('');
    setErrorMsg('');
    setAmountReceived('');
    setConditionChecked(false);
    setOtpVerified(false);
  };

  // Calculations for selected loan
  const principal = selectedLoan ? selectedLoan.principal : 0;
  const interestDue = selectedLoan ? selectedLoan.interestDue : 0;
  const gst = Math.round(interestDue * 0.18);
  const penalty = selectedLoan ? selectedLoan.penalty : 0;
  const insuranceFee = 50; // standard insurance safe room fee
  const totalPayable = principal + interestDue + gst + penalty + insuranceFee;

  const changeToReturn = amountReceived ? parseFloat(amountReceived) - totalPayable : 0;

  // Active Customer profile dossier
  const cust = selectedLoan ? db.customers.find(c => c.id === selectedLoan.customerId) : null;
  const orn = selectedLoan ? (selectedLoan.ornaments?.[0] || { photo: DEFAULT_JEWELRY_BASE64, type: 'Ornament', net: 0, purity: '22K' }) : null;

  // Floor location mapping lookup
  const getStorageRoomName = () => {
    if (!selectedLoan) return 'N/A';
    if (selectedLoan.floorRef) {
      const fl = db.floors.find(f => f.id === selectedLoan.floorRef);
      return fl ? `🏢 Floor Room: ${fl.name}` : '🏢 Storage Floor Locker';
    } else {
      const v = db.vaults.find(vault => vault.id === selectedLoan.vaultRef);
      return v ? `🔒 Strong Compartment COMP-${v.compartmentNo}` : '🔒 Safe Lockers';
    }
  };

  const handleRequestReleaseOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpError(false);
    setOtpOpen(true);
    console.log(`[PawnBook Gold Handover Release OTP] Dispatch for ${cust?.name}: ${code}`);
  };

  const handleVerifyReleaseOtp = () => {
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      setOtpOpen(false);
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!selectedLoan) return;

    if (!conditionChecked) {
      setErrorMsg('Handover Checklist Mismatch! You must complete physical check of ornaments before release.');
      return;
    }

    if (!amountReceived || parseFloat(amountReceived) < totalPayable) {
      setErrorMsg(`Insufficient collection. Net total settlement due is ${currencyFormat(totalPayable)}.`);
      return;
    }

    if (!otpVerified) {
      setErrorMsg('Release Security OTP Verification Required! Complete OTP validation to hand over gold assets.');
      return;
    }

    try {
      const paymentObj = {
        id: `PMT-${Date.now()}`,
        loanId: selectedLoan.id,
        customerId: selectedLoan.customerId,
        date: new Date().toISOString().split('T')[0],
        type: 'Full Settlement',
        principal: principal,
        interest: interestDue,
        gst: gst,
        penalty: penalty,
        totalAmount: totalPayable,
        amountReceived: parseFloat(amountReceived),
        change: changeToReturn > 0 ? changeToReturn : 0,
        mode: paymentMode,
        refNo: paymentMode === 'Cash' ? 'N/A' : `GPay-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'Success',
        receiptNo: `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        receiptSent: sendDigitalCopy,
        receiptChannel: receiptChannel,
        collectedBy: db.currentUser?.name || 'Staff Operator',
        notes: `Gold collateral released from storage location. Type: Full Settlement Redemption.`
      };

      await db.processPayment(selectedLoan, paymentObj, 'Full Settlement');
      
      // Update local statistics logs
      db.logAuditEvent('Collateral Handed Over', `Gold assets cleared from storage. Loan Ticket ${selectedLoan.ticket} fully redeemed.`);

      setSuccessMsg(`Gold ornaments safely handed over to borrower! Ticket ${selectedLoan.ticket} cleared.`);
      setErrorMsg('');

      // Launch Print Voucher Modal automatically
      if (setPrintableLoan) {
        setPrintableLoan(selectedLoan);
      }

      setSelectedLoan(null);
      setAmountReceived('');
      setConditionChecked(false);
      setOtpVerified(false);
      onStateChange();
    } catch (err) {
      setErrorMsg('Failed to process gold collateral release. Verify parameters.');
    }
  };

  const getCustName = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.name : 'Unknown Customer';
  };

  const getCustMobile = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.mobile : 'N/A';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🎯 Release Pledged Gold & Settle Balances</Typography>
        <Typography variant="caption" color="textSecondary">Verify customer identity and original gold items, secure the gold release, and settle the final balance.</Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, border: '1px solid #10B981', bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, border: '1px solid #EF4444', bgcolor: 'rgba(239,68,68,0.05)', borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Search and Form */}
        <Grid xs={12} md={7}>
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>1. Select Gold Pawn Ticket to Release</Typography>
              <Autocomplete
                options={activeLoans}
                getOptionLabel={(option) => option ? `${option.ticket} - ${getCustName(option.customerId)} (${getCustMobile(option.customerId)})` : ''}
                onChange={(event, newValue) => handleSelectLoan(newValue)}
                value={selectedLoan}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Search active tickets or customers..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#C5A059', fontSize: 16 }} />
                          </InputAdornment>
                          {params.InputProps?.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>

          {selectedLoan ? (
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>2. Side-by-Side Gold Release & Verification Check</Typography>
                <Divider sx={{ mb: 2.5 }} />

                {/* Handover Verification Avatars */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid xs={6} align="center">
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                      CUSTOMER IDENTIFICATION PHOTO
                    </Typography>
                    <Avatar
                      src={cust?.photo || DEFAULT_PURCHASER_BASE64}
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px solid #6B1F38',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>{cust?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{cust?.mobile}</Typography>
                  </Grid>
                  
                  <Grid xs={6} align="center">
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                      STORED GOLD ITEM PHOTO
                    </Typography>
                    <Avatar
                      src={orn?.photo || DEFAULT_JEWELRY_BASE64}
                      variant="rounded"
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px solid #C5A059',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>{orn?.type} ({orn?.purity})</Typography>
                    <Typography variant="caption" color="textSecondary">{orn?.net?.toFixed(2)} grams</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ bgcolor: 'rgba(107,31,56,0.03)', border: '1px solid rgba(107,31,56,0.15)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                    🏢 STORED GOLD LOCATION (STRONG ROOM / LOCKER):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ fontSize: 18, color: '#C5A059' }} /> {getStorageRoomName()}
                  </Typography>
                </Box>

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>
                  ☑️ GOLD QUALITY & WEIGHT CHECKLIST
                </Typography>

                <Grid container spacing={1} sx={{ mb: 3 }}>
                  <Grid xs={12}>
                    <FormControlLabel
                      control={<Checkbox checked={conditionChecked} onChange={(e) => setConditionChecked(e.target.checked)} size="small" color="primary" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>I have retrieved the gold from the locker room, checked its pieces and weight, and verified that it matches the customer's gold photo.</Typography>}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <FormControlLabel control={<Checkbox checked={generateCertificate} onChange={(e) => setGenerateCertificate(e.target.checked)} size="small" />} label={<Typography variant="caption">Issue Gold Release Receipt</Typography>} />
                    <FormControlLabel control={<Checkbox checked={sendDigitalCopy} onChange={(e) => setSendDigitalCopy(e.target.checked)} size="small" />} label={<Typography variant="caption">Send Receipt via WhatsApp</Typography>} />
                  </Grid>
                  <Grid xs={6}>
                    <FormControlLabel control={<Checkbox checked={printHandoverSlip} onChange={(e) => setPrintHandoverSlip(e.target.checked)} size="small" />} label={<Typography variant="caption">Print Release slip</Typography>} />
                    <FormControlLabel control={<Checkbox checked={updateInsurance} onChange={(e) => setUpdateInsurance(e.target.checked)} size="small" />} label={<Typography variant="caption">Stop Safe Room Insurance</Typography>} />
                  </Grid>
                </Grid>

                {/* Release OTP verification dialog pinger */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, p: 1.5, borderRadius: 2, bgcolor: otpVerified ? 'rgba(16,185,129,0.06)' : 'rgba(107,31,56,0.03)', border: otpVerified ? '1px solid #10B981' : '1px dashed rgba(107,31,56,0.2)' }}>
                  <OtpIcon sx={{ color: otpVerified ? '#10B981' : '#6B1F38' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                      {otpVerified ? 'CUSTOMER VERIFICATION SUCCESSFUL' : 'SEND CUSTOMER OTP TO CONFIRM'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {otpVerified ? 'Simulated 4-digit verification code check passed.' : 'Enter the 4-digit code sent to the customer to release the gold.'}
                    </Typography>
                  </Box>
                  {!otpVerified && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={handleRequestReleaseOtp}
                      sx={{ fontSize: 10 }}
                    >
                      Verify Customer OTP
                    </Button>
                  )}
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleConfirmRedemption}
                  disabled={!otpVerified}
                  sx={{ py: 1.2, fontWeight: 'bold' }}
                >
                  Settle Payout & Release Gold
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', height: 260, bgcolor: 'rgba(107,31,56,0.02)', border: '1px dashed rgba(197,160,89,0.25)', borderRadius: 2, justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                Select an active pawn ticket above to verify the customer and start releasing their gold.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Right Side: Calculations & Cleared Ledger */}
        <Grid xs={12} md={5}>
          {selectedLoan && (
            <Card sx={{ mb: 3, border: '1px solid rgba(16,185,129,0.3)', bgcolor: 'rgba(16,185,129,0.01)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold', mb: 2 }}>3. Final Payment Breakdown</Typography>
                <Divider sx={{ mb: 2.5 }} />

                <AppraisalRow label="Loan Amount (Pending)" value={currencyFormat(principal)} />
                <AppraisalRow label="Interest Amount" value={currencyFormat(interestDue)} />
                <AppraisalRow label="Government GST Tax (18%)" value={currencyFormat(gst)} />
                <AppraisalRow label="Late Payment Penalty" value={currencyFormat(penalty)} valueColor={penalty > 0 ? '#EF4444' : 'text.primary'} />
                <AppraisalRow label="Locker Safe Room Fee" value={currencyFormat(insuranceFee)} />
                
                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                <AppraisalRow label="TOTAL AMOUNT TO PAY:" value={currencyFormat(totalPayable)} isBold valueColor="#10B981" />
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Amount Collected (₹)*"
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          style: { fontSize: 12 }
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                {amountReceived && (
                  <Box sx={{ mb: 3, p: 1.5, borderRadius: 2, bgcolor: changeToReturn >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: changeToReturn >= 0 ? '1px solid #10B981' : '1px solid #EF4444' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12, textAlign: 'center', color: changeToReturn >= 0 ? '#10B981' : '#EF4444' }}>
                      {changeToReturn >= 0
                        ? `Change to Return: ${currencyFormat(changeToReturn)}`
                        : `Insufficient Collection! Outstanding: ${currencyFormat(Math.abs(changeToReturn))}`}
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>HOW CUSTOMER IS PAYING</Typography>
                <RadioGroup row value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} sx={{ mb: 2 }}>
                  <FormControlLabel value="Cash" control={<Radio size="small" />} label={<Typography variant="caption">Cash</Typography>} />
                  <FormControlLabel value="UPI" control={<Radio size="small" />} label={<Typography variant="caption">UPI (PhonePe/GPay)</Typography>} />
                  <FormControlLabel value="Card" control={<Radio size="small" />} label={<Typography variant="caption">Card Swipe</Typography>} />
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Cleared Ledger Cards list */}
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold' }}>📁 Settle & Release History (Branch)</Typography>
              </Box>
              <Divider />

              {redeemedLoans.length === 0 ? (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 4 }}>
                  No gold releases finalized under this branch counter yet.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {redeemedLoans.map(l => (
                    <Box key={l.id} sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{l.ticket}</Typography>
                        <Typography variant="caption" color="textSecondary">{getCustName(l.customerId)}</Typography>
                      </Box>
                      <Chip size="small" label="Settle & Released" color="success" sx={{ fontSize: 9, height: 18 }} />
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Simulated Gold Handover Release OTP Challenge dialog */}
      <Dialog open={otpOpen} onClose={() => setOtpOpen(false)} PaperProps={{ sx: { p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🔐 Gold Release Verification Code</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            Simulating code sent to customer <strong>{cust?.name}</strong>'s mobile <strong>{cust?.mobile}</strong>.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, fontSize: 11 }}>
            [Customer OTP Code Simulator]: Code is <strong>{generatedOtp}</strong>
          </Alert>

          <TextField
            fullWidth
            size="small"
            label="Enter 4-Digit Code"
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
          <Button onClick={handleVerifyReleaseOtp} variant="contained">Confirm Code</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function AppraisalRow({ label, value, valueColor = 'text.primary', isBold = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: isBold ? 'bold' : 'normal', color: valueColor }}>{value}</Typography>
    </Box>
  );
}
