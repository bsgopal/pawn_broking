import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Avatar,
  IconButton
} from '@mui/material';
import {
  TrendingUp as BuyIcon,
  TrendingDown as SellIcon,
  LocalPrintshop as PrintIcon,
  Money as CashIcon,
  ArrowForward as TradeIcon,
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const DEFAULT_BULLION_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><rect width="24" height="24" fill="%23FDFCF7"/><rect x="4" y="6" width="16" height="12" rx="2" stroke="%23C5A059" stroke-width="2" fill="none"/><path d="M7 10h10v4H7z" fill="%23C5A059"/></svg>';

export default function BulkTradingView({ onStateChange }) {
  // Trade Form states
  const [tradeType, setTradeType] = useState('Purchase'); // Purchase (Buying Gold) or Sale (Selling Gold)
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldPurity, setGoldPurity] = useState('22K');
  const [goldRate, setGoldRate] = useState(db.currentRates.gold22K.toString());
  const [makingCharges, setMakingCharges] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [tradePhotos, setTradePhotos] = useState([]);
  
  const simulateCameraCapture = () => {
    const premiumBullionMock = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23FDFCF7"/><rect x="25" y="35" width="50" height="30" rx="3" fill="%23C5A059" stroke="%236B1F38" stroke-width="1.5"/><text x="50" y="53" fill="%236B1F38" font-size="8" font-weight="bold" text-anchor="middle">BULLION</text></svg>';
    setTradePhotos(prev => [...prev, premiumBullionMock]);
  };

  const handlePhotoUploadMultiple = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTradePhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Split payment modes
  const [payCash, setPayCash] = useState('');
  const [payUpi, setPayUpi] = useState('');
  const [payCard, setPayCard] = useState('');
  
  // Printing voucher modal
  const [printedTrade, setPrintedTrade] = useState(null);

  // Auto rate calculation
  React.useEffect(() => {
    if (goldPurity === '24K') setGoldRate(db.currentRates.gold24K.toString());
    else if (goldPurity === '22K') setGoldRate(db.currentRates.gold22K.toString());
    else if (goldPurity === '20K') setGoldRate(Math.round(db.currentRates.gold24K * 0.83).toString());
    else if (goldPurity === '18K') setGoldRate(Math.round(db.currentRates.gold24K * 0.75).toString());
  }, [goldPurity]);

  const weight = parseFloat(goldWeight) || 0;
  const rate = parseFloat(goldRate) || 0;
  const making = parseFloat(makingCharges) || 0;
  const deduct = parseFloat(deductions) || 0;

  // Gold Bullion Appraisal Calculations
  const baseValue = weight * rate;
  const dynamicTaxGST = Math.round((baseValue + making - deduct) * 0.03); // 3% standard bullion trading GST
  const netTotalValue = Math.round(baseValue + making - deduct + dynamicTaxGST);

  // Live total sum paid splits
  const cashVal = parseFloat(payCash) || 0;
  const upiVal = parseFloat(payUpi) || 0;
  const cardVal = parseFloat(payCard) || 0;
  const totalPaidSplits = cashVal + upiVal + cardVal;
  const pendingAmount = netTotalValue - totalPaidSplits;

  const isPhoneValid = custMobile === '' || (custMobile.length === 10 && /^\d+$/.test(custMobile));

  const handleExecuteTrade = async (e) => {
    e.preventDefault();

    if (!custName || !custMobile || !goldWeight || netTotalValue <= 0) {
      alert('Please fill out all mandatory customer name, phone, and weight parameters.');
      return;
    }

    if (!isPhoneValid) {
      alert('Dossier contains live validation errors. Phone must be exactly 10 digits.');
      return;
    }

    if (pendingAmount !== 0) {
      alert(`Payment Mode imbalance! Paid split sum (₹${totalPaidSplits}) must exactly match transaction net total value (₹${netTotalValue}). Pending gap: ₹${pendingAmount}`);
      return;
    }

    // Save Bulk Trade Ticket
    const newTrade = {
      id: `T-${Date.now()}`,
      ticket: `TRD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: tradeType,
      date: new Date().toISOString().split('T')[0],
      custName,
      custMobile,
      purity: goldPurity,
      rate,
      netWeight: weight,
      makingCharges: making,
      deductions: deduct,
      taxGST: dynamicTaxGST,
      totalAmount: netTotalValue,
      photos: tradePhotos,
      payments: [
        { mode: 'Cash', amount: cashVal },
        { mode: 'UPI', amount: upiVal },
        { mode: 'Card', amount: cardVal }
      ].filter(p => p.amount > 0)
    };

    await db.addBulkTrade(newTrade);
    setPrintedTrade(newTrade);
    onStateChange();

    // Reset Form
    setCustName('');
    setCustMobile('');
    setGoldWeight('');
    setMakingCharges('0');
    setDeductions('0');
    setPayCash('');
    setPayUpi('');
    setPayCard('');
    setTradePhotos([]);

    alert('Bulk Gold Bullion transaction recorded successfully!');
  };

  const triggerPrintReceipt = (trade) => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>👑 Bulk Gold Bullion Trading (Buy/Sell)</Typography>
        <Typography variant="caption" color="textSecondary">Outright purchasing of gold assets from clients or direct liquidation sales with complete split payment ledgers and tax GST logs.</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Bulk Trade Form Panel */}
        <Grid xs={12} md={5}>
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TradeIcon /> Transaction Parameters
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <form onSubmit={handleExecuteTrade}>
                {/* Buy vs Sell Switcher Button Group */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid xs={6}>
                    <Button
                      fullWidth
                      variant={tradeType === 'Purchase' ? 'contained' : 'outlined'}
                      color="primary"
                      startIcon={<BuyIcon />}
                      onClick={() => setTradeType('Purchase')}
                      sx={{ py: 1 }}
                    >
                      Buy Gold (Purchase)
                    </Button>
                  </Grid>
                  <Grid xs={6}>
                    <Button
                      fullWidth
                      variant={tradeType === 'Sale' ? 'contained' : 'outlined'}
                      color="secondary"
                      startIcon={<SellIcon />}
                      onClick={() => setTradeType('Sale')}
                      sx={{ py: 1 }}
                    >
                      Sell Gold (Sale)
                    </Button>
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Customer Full Name*"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Customer Phone (10-Digit)*"
                      value={custMobile}
                      onChange={(e) => setCustMobile(e.target.value)}
                      error={!isPhoneValid}
                      helperText={!isPhoneValid && "10 digits required"}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Gold Weight (grams)*"
                      type="number"
                      value={goldWeight}
                      onChange={(e) => setGoldWeight(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="purity-bulk-label" sx={{ fontSize: 12 }}>Gold Purity*</InputLabel>
                      <Select
                        labelId="purity-bulk-label"
                        value={goldPurity}
                        label="Gold Purity*"
                        onChange={(e) => setGoldPurity(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        <MenuItem value="24K" sx={{ fontSize: 12 }}>24K (99.9%)</MenuItem>
                        <MenuItem value="22K" sx={{ fontSize: 12 }}>22K (91.6%)</MenuItem>
                        <MenuItem value="20K" sx={{ fontSize: 12 }}>20K (83.3%)</MenuItem>
                        <MenuItem value="18K" sx={{ fontSize: 12 }}>18K (75.0%)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Rate (₹/g)*"
                      type="number"
                      value={goldRate}
                      onChange={(e) => setGoldRate(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Making Charges (₹)"
                      type="number"
                      value={makingCharges}
                      onChange={(e) => setMakingCharges(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Deductions / Wastage (₹)"
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Gold Items Trading Photos */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                    📸 GOLD BULLION & ORNAMENT PHOTO PROOFS (REQUIRED)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    {tradePhotos.length === 0 ? (
                      <Avatar
                        src={DEFAULT_BULLION_BASE64}
                        variant="rounded"
                        sx={{
                          width: 76,
                          height: 76,
                          border: '2px dashed #C5A059',
                          bgcolor: '#FDFCF7'
                        }}
                      />
                    ) : (
                      tradePhotos.map((img, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                          <Avatar
                            src={img}
                            variant="rounded"
                            sx={{
                              width: 76,
                              height: 76,
                              border: '2px solid #C5A059',
                              bgcolor: '#FDFCF7'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setTradePhotos(prev => prev.filter((_, i) => i !== idx))}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              bgcolor: '#EF4444',
                              color: '#FFFFFF',
                              width: 18,
                              height: 18,
                              p: 0,
                              '&:hover': { bgcolor: '#DC2626' }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 10 }} />
                          </IconButton>
                        </Box>
                      ))
                    )}

                    <Box sx={{ ml: 1 }}>
                      <Grid container spacing={1} direction="column">
                        <Grid item>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<CameraIcon />}
                            onClick={simulateCameraCapture}
                            sx={{ fontSize: 10, py: 0.5, minWidth: 120 }}
                          >
                            Snap Photo
                          </Button>
                        </Grid>
                        <Grid item>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            color="inherit"
                            startIcon={<UploadIcon />}
                            sx={{ fontSize: 10, py: 0.5, minWidth: 120 }}
                          >
                            Upload File
                            <input
                              type="file"
                              hidden
                              multiple
                              accept="image/*"
                              onChange={handlePhotoUploadMultiple}
                            />
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Box>

                {/* Bullion transaction financial summary */}
                <Box sx={{ bgcolor: 'rgba(197, 160, 89, 0.06)', border: '1px solid rgba(197, 160, 89, 0.25)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Grid container spacing={1}>
                    <Grid xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Base Gold Value:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currencyFormat(baseValue)}</Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Tax GST (3% Bullion):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currencyFormat(dynamicTaxGST)}</Typography>
                    </Grid>
                    <Grid xs={12}>
                      <Divider sx={{ my: 1, borderColor: 'rgba(197,160,89,0.15)' }} />
                    </Grid>
                    <Grid xs={12}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>NET TRANSACTION TOTAL VALUE:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'black', color: '#6B1F38' }}>{currencyFormat(netTotalValue)}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Granular split payment entry */}
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>
                  💵 CUSTOMER PAYMENT MODE SPLIT (MUST EQUAL NET TOTAL)
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cash Amount"
                      type="number"
                      value={payCash}
                      onChange={(e) => setPayCash(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          style: { fontSize: 11 }
                        },
                        inputLabel: { style: { fontSize: 11 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="UPI Amount"
                      type="number"
                      value={payUpi}
                      onChange={(e) => setPayUpi(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          style: { fontSize: 11 }
                        },
                        inputLabel: { style: { fontSize: 11 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Card Amount"
                      type="number"
                      value={payCard}
                      onChange={(e) => setPayCard(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          style: { fontSize: 11 }
                        },
                        inputLabel: { style: { fontSize: 11 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        Total Entered Paid: {currencyFormat(totalPaidSplits)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: pendingAmount === 0 ? '#10B981' : '#EF4444' }}>
                        {pendingAmount === 0 ? 'Payment Matches Total' : `Gap Balance: ${currencyFormat(pendingAmount)}`}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{ py: 1.2, fontWeight: 'bold' }}
                >
                  EXECUTE DIRECT GOLD TRANSACTION
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Bullion Trade Ledger Directory */}
        <Grid xs={12} md={7}>
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold' }}>📁 Direct Bullion Trading History Ledger</Typography>
                <Typography variant="caption" color="textSecondary">Operational records audit trail of direct gold sales and purchases.</Typography>
              </Box>
              <Divider />

              {db.bulkTrades.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 6 }}>
                  No bulk gold trades logged under this branch yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Trade ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Specs</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Net Value</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }} align="right">Invoice</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {db.bulkTrades.map(trade => (
                        <TableRow key={trade.id}>
                          <TableCell sx={{ fontSize: 11 }}>{trade.date}</TableCell>
                          <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>{trade.ticket}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            <Chip
                              size="small"
                              label={trade.type}
                              color={trade.type === 'Purchase' ? 'primary' : 'secondary'}
                              sx={{ fontSize: 9, height: 18, fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 'bold' }}>{trade.custName}</Typography>
                            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{trade.custMobile}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            {trade.netWeight}g / {trade.purity}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, fontWeight: 'bold', color: trade.type === 'Purchase' ? '#10B981' : '#6B1F38' }}>
                            {currencyFormat(trade.totalAmount)}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }} align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setPrintedTrade(trade)}
                              sx={{ minWidth: 0, px: 1, py: 0.2, fontSize: 9 }}
                            >
                              Print
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
        </Grid>
      </Grid>

      {/* Bullion Trade Invoice Printer Dialog */}
      {printedTrade && (
        <Dialog open={true} onClose={() => setPrintedTrade(null)} PaperProps={{ sx: { width: '100%', maxWidth: 420, p: 1 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>TRADE INVOICE SLIP</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{printedTrade.ticket}</Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'black', color: '#6B1F38' }}>MALABAR GOLD PARTNERS</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Sri Lakshmi counter branch • GSTIN: 33ABCDE1234F</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Customer:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{printedTrade.custName}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Contact Mobile:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">{printedTrade.custMobile}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Trade Date:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">{printedTrade.date}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Transaction Category:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption" sx={{ fontWeight: 'bold' }}>OUTRIGHT {printedTrade.type.toUpperCase()}</Typography></Grid>
            </Grid>

            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Bullion Weight:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{printedTrade.netWeight} grams</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Karat Quality:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">{printedTrade.purity}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Appraisal Rate/g:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">{currencyFormat(printedTrade.rate)}/gm</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Making Charges:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">+{currencyFormat(printedTrade.makingCharges)}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Deductions:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">-{currencyFormat(printedTrade.deductions)}</Typography></Grid>
              <Grid xs={6}><Typography variant="caption" color="textSecondary">Bullion Tax GST (3%):</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="caption">+{currencyFormat(printedTrade.taxGST)}</Typography></Grid>
            </Grid>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid xs={6}><Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>NET TRADE VALUE:</Typography></Grid>
              <Grid xs={6} align="right"><Typography variant="subtitle2" sx={{ fontWeight: 'black', color: '#6B1F38' }}>{currencyFormat(printedTrade.totalAmount)}</Typography></Grid>
            </Grid>

            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Payment Mode Summary Splits:</Typography>
            {printedTrade.payments.map((p, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="textSecondary">• Payout Method {p.mode}:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{currencyFormat(p.amount)}</Typography>
              </Box>
            ))}

            {printedTrade.photos && printedTrade.photos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Trade Item Photograph Proofs:</Typography>
                <Grid container spacing={1}>
                  {printedTrade.photos.map((photo, idx) => (
                    <Grid item xs={4} key={idx}>
                      <Box sx={{ border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: 1, p: 0.5, bgcolor: '#FDFCF7', display: 'flex', justifyContent: 'center' }}>
                        <img src={photo} alt={`Item ${idx + 1}`} style={{ width: '100%', height: 48, objectFit: 'contain' }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                Thank you for trading with Malabar Gold Partners.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPrintedTrade(null)} variant="outlined">Close</Button>
            <Button onClick={() => triggerPrintReceipt(printedTrade)} variant="contained" startIcon={<PrintIcon />}>Print Receipt</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
