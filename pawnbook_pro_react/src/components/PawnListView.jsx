import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Avatar
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function PawnListView({ onStateChange, setActivePage, setPrintableLoan, setPaymentLoan, ledgerFilter = 'All', setLedgerFilter }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id);
  const [search, setSearch] = useState('');
  const [selectedDetailLoan, setSelectedDetailLoan] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNominee, setEditNominee] = useState('');
  const [editRelation, setEditRelation] = useState('');
  const [editNomineeMob, setEditNomineeMob] = useState('');
  const [editAadhaarNo, setEditAadhaarNo] = useState('');
  const [editPanNo, setEditPanNo] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editEmi, setEditEmi] = useState('');

  const startEditing = (cust, loan) => {
    setEditName(cust.name || '');
    setEditMobile(cust.mobile || '');
    setEditAddress(cust.address || '');
    setEditCity(cust.city || '');
    setEditNominee(cust.nominee || '');
    setEditRelation(cust.relation || '');
    setEditNomineeMob(cust.nomineeMob || '');
    setEditAadhaarNo(cust.aadhaarNo || '');
    setEditPanNo(cust.panNo || '');
    setEditPhoto(cust.photo || '');
    
    const defaultEmi = loan.monthlyInstallmentEMI || Math.round((loan.principal / loan.duration) + (loan.principal * (loan.interestPct / 100)));
    setEditEmi(defaultEmi.toString());
    
    setIsEditing(true);
  };

  const handleSaveChanges = async (customerId, loanId) => {
    if (!editName || !editMobile) {
      alert('Name and Mobile number are required.');
      return;
    }
    
    if (editMobile.length !== 10 || !/^\d+$/.test(editMobile)) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    if (editPanNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editPanNo)) {
      alert('Invalid PAN format (expected ABCDE1234F).');
      return;
    }

    if (editAadhaarNo && (editAadhaarNo.length !== 12 || !/^\d+$/.test(editAadhaarNo))) {
      alert('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const customerIndex = db.customers.findIndex(c => c.id === customerId);
    if (customerIndex !== -1) {
      db.customers[customerIndex] = {
        ...db.customers[customerIndex],
        name: editName,
        mobile: editMobile,
        address: editAddress,
        city: editCity,
        nominee: editNominee,
        relation: editRelation,
        nomineeMob: editNomineeMob,
        aadhaarNo: editAadhaarNo,
        panNo: editPanNo,
        photo: editPhoto
      };
    }

    const loanIndex = db.loans.findIndex(l => l.id === loanId);
    if (loanIndex !== -1) {
      db.loans[loanIndex] = {
        ...db.loans[loanIndex],
        monthlyInstallmentEMI: parseInt(editEmi) || 0
      };
    }

    await db.persist();
    db.logAuditEvent('Customer Dossier & Loan Expected EMI Updated', `Updated profile and monthly expected EMI to ₹${editEmi} for customer ${editName}.`);
    
    if (selectedDetailLoan) {
      setSelectedDetailLoan(prev => ({
        ...prev,
        monthlyInstallmentEMI: parseInt(editEmi) || 0
      }));
    }

    if (onStateChange) onStateChange();
    setIsEditing(false);
    alert('Pledge details and Expected EMI updated successfully!');
  };

  const handleOpenDetails = (loan) => {
    setSelectedDetailLoan(loan);
  };

  const handleCloseDetails = () => {
    setSelectedDetailLoan(null);
    setIsEditing(false);
  };

  const filtered = activeLoans.filter(l => {
    const cust = db.customers.find(c => c.id === l.customerId) || { name: '', mobile: '' };
    
    const matchesSearch = l.ticket.toLowerCase().includes(search.toLowerCase()) ||
                          cust.name.toLowerCase().includes(search.toLowerCase()) ||
                          cust.mobile.includes(search);

    if (!matchesSearch) return false;

    if (ledgerFilter === 'Today') {
      return l.status === 'Overdue' || (l.status === 'Active' && l.maturityDate === todayStr);
    }
    if (ledgerFilter === 'Upcoming') {
      return l.status === 'Active' && l.maturityDate > todayStr;
    }
    if (ledgerFilter === 'Overdue') {
      return l.status === 'Overdue';
    }
    return true;
  });

  const handleExportToExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Ticket,Customer Name,Phone,Outstanding Principal,Interest Due,Maturity Date,Status\r\n';
    
    filtered.forEach(l => {
      const c = db.customers.find(cust => cust.id === l.customerId) || { name: 'Unknown', mobile: '-' };
      const row = `"${l.ticket}","${c.name}","${c.mobile}",${l.principal},${l.interestDue},"${l.maturityDate}","${l.status}"`;
      csvContent += row + '\r\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Pawn_Ledger_Directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    db.logAuditEvent('Pawn Ledger Exported', `Exported ${filtered.length} active pawn rows to Excel/CSV.`);
  };

  const handleExportToPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>Pawn Ledger Directory</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; color: #6B1F38; }
            p { text-align: center; font-size: 12px; color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #C5A059; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: rgba(107,31,56,0.05); color: #6B1F38; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${db.settings.shopName}</h2>
          <p>Pawn Ledger Directory - Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Borrower</th>
                <th>Phone</th>
                <th>Principal Outstanding</th>
                <th>Interest Due</th>
                <th>Maturity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(l => {
      const c = db.customers.find(cust => cust.id === l.customerId) || { name: 'Unknown', mobile: '-' };
      html += `
        <tr>
          <td><b style="color: #6B1F38;">${l.ticket}</b></td>
          <td>${c.name}</td>
          <td>${c.mobile}</td>
          <td><b>₹${l.principal.toLocaleString('en-IN')}</b></td>
          <td>₹${l.interestDue.toLocaleString('en-IN')}</td>
          <td>${l.maturityDate}</td>
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
    db.logAuditEvent('Pawn Ledger Exported', `Generated printable PDF window for ${filtered.length} pawn rows.`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pawn Ledger Directory</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <Typography variant="caption" color="textSecondary">Operational records audit, dynamic repayments billing, and settlement collections.</Typography>
            {ledgerFilter !== 'All' && (
              <Chip
                label={`Filtered: ${ledgerFilter}`}
                size="small"
                color="primary"
                onDelete={() => setLedgerFilter('All')}
                sx={{ height: 20, fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleExportToExcel}
            sx={{ height: 32, fontSize: 11 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleExportToPDF}
            sx={{ height: 32, fontSize: 11 }}
          >
            Export PDF
          </Button>
          <TextField
            size="small"
            placeholder="Filter ledger tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#D4AF37', fontSize: 16 }} />
                  </InputAdornment>
                ),
                style: { fontSize: 11 }
              }
            }}
          />
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {filtered.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
              No dynamic active loans outstanding under this operational branch.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Ticket</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Loan Amount</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Interest Due</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Billing Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((l) => {
                    const cust = db.customers.find(c => c.id === l.customerId) || { name: 'Unknown' };
                    return (
                      <TableRow key={l.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(l)}>
                        <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{l.ticket}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{cust.name}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{currencyFormat(l.principal)}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: l.daysOverdue > 0 ? '#EF4444' : '#E2E8F0' }}>{currencyFormat(l.interestDue)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={l.status}
                            color={l.status === 'Active' ? 'success' : (l.status === 'Overdue' ? 'error' : 'secondary')}
                            sx={{ height: 18, fontSize: 9, fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentLoan(l);
                              setActivePage('payment-screen');
                            }}
                            sx={{ height: 26, fontSize: 10 }}
                          >
                            Collect
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(l);
                            }}
                            sx={{ height: 26, fontSize: 10 }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintableLoan(l);
                            }}
                            sx={{ height: 26, fontSize: 10, borderColor: 'rgba(0,0,0,0.1)' }}
                          >
                            Print
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

      {/* Dynamic Detailed Pawn Ticket Dossier Viewer Dialog */}
      {selectedDetailLoan && (
        <Dialog
          open={!!selectedDetailLoan}
          onClose={handleCloseDetails}
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
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#6B1F38', color: '#FFFFFF', py: 1.5, px: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              🎫 Pledge Document Details - {selectedDetailLoan.ticket}
            </Typography>
            <Chip
              size="small"
              label={selectedDetailLoan.status}
              color={selectedDetailLoan.status === 'Active' ? 'success' : (selectedDetailLoan.status === 'Overdue' ? 'error' : 'secondary')}
              sx={{ fontWeight: 'black', color: '#FFFFFF', fontSize: 10, height: 18 }}
            />
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={3}>
              {/* Left Column: Borrower Dossier & Photos */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', border: '1px solid rgba(107,31,56,0.15)', bgcolor: '#FFFFFF' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 1, fontSize: 12 }}>
                      👤 Borrower Profile
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />

                    {(() => {
                      const cust = db.customers.find(c => c.id === selectedDetailLoan.customerId) || {
                        name: 'Unknown Borrower',
                        mobile: 'N/A',
                        aadhaarNo: 'N/A',
                        panNo: 'N/A',
                        address: 'N/A',
                        city: 'N/A',
                        nominee: 'N/A',
                        relation: 'N/A',
                        nomineeMob: 'N/A',
                        photo: '',
                        aadhaarPhoto: '',
                        panPhoto: ''
                      };
                      return isEditing ? (
                        <Box sx={{ py: 1 }}>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                              <Avatar src={editPhoto} sx={{ width: 64, height: 64, border: '2px solid #C5A059' }} />
                              <Box>
                                <Button component="label" variant="outlined" size="small" sx={{ fontSize: 10, py: 0.5 }}>
                                  Upload Profile Photo
                                  <input type="file" hidden accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditPhoto(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }} />
                                </Button>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5, fontSize: 9 }}>
                                  Accepts JPEG, PNG image files
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Customer Name"
                                size="small"
                                fullWidth
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Mobile Number"
                                size="small"
                                fullWidth
                                value={editMobile}
                                onChange={(e) => setEditMobile(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="City"
                                size="small"
                                fullWidth
                                value={editCity}
                                onChange={(e) => setEditCity(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Address"
                                size="small"
                                fullWidth
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Aadhaar Number"
                                size="small"
                                fullWidth
                                value={editAadhaarNo}
                                onChange={(e) => setEditAadhaarNo(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="PAN Card Number"
                                size="small"
                                fullWidth
                                value={editPanNo}
                                onChange={(e) => setEditPanNo(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Expected Monthly EMI (₹)"
                                size="small"
                                type="number"
                                fullWidth
                                value={editEmi}
                                onChange={(e) => setEditEmi(e.target.value)}
                                slotProps={{
                                  input: {
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    style: { fontSize: 11 }
                                  },
                                  inputLabel: { style: { fontSize: 11 } }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, fontSize: 10, color: '#6B1F38' }}>
                                Nominee Information
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Nominee Name"
                                size="small"
                                fullWidth
                                value={editNominee}
                                onChange={(e) => setEditNominee(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Nominee Relation"
                                size="small"
                                fullWidth
                                value={editRelation}
                                onChange={(e) => setEditRelation(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Nominee Mobile"
                                size="small"
                                fullWidth
                                value={editNomineeMob}
                                onChange={(e) => setEditNomineeMob(e.target.value)}
                                slotProps={{ input: { style: { fontSize: 11 } }, inputLabel: { style: { fontSize: 11 } } }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ) : (
                        <Box>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <Avatar src={cust.photo} sx={{ width: 64, height: 64, border: '2px solid #C5A059' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1A0D11' }}>{cust.name}</Typography>
                              <Typography variant="caption" color="textSecondary" display="block">📞 {cust.mobile}</Typography>
                              <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: 10 }}>📍 {cust.address}, {cust.city}</Typography>
                            </Box>
                          </Box>

                          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, fontSize: 10 }}>
                            Nominee Details
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 2, pl: 1, borderLeft: '3px solid #C5A059', fontSize: 11 }}>
                            {cust.nominee} ({cust.relation}) - 📞 {cust.nomineeMob}
                          </Typography>

                          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1, fontSize: 10 }}>
                            🆔 Verified KYC Documents
                          </Typography>
                          
                          <Grid container spacing={1.5}>
                            {/* Aadhaar Photo Display */}
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, bgcolor: '#FDFCF7', textAlign: 'center' }}>
                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', fontSize: 10, color: '#6B1F38' }}>Aadhaar Card</Typography>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: 9, mb: 0.5 }}>{cust.aadhaarNo}</Typography>
                                {cust.aadhaarPhoto ? (
                                  <img src={cust.aadhaarPhoto} alt="Aadhaar KYC" style={{ width: '100%', maxHeight: 75, borderRadius: 4, objectFit: 'contain', border: '1px solid rgba(0,0,0,0.05)' }} />
                                ) : (
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ py: 2, fontSize: 10 }}>Not Uploaded</Typography>
                                )}
                              </Box>
                            </Grid>

                            {/* PAN Photo Display */}
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, bgcolor: '#FDFCF7', textAlign: 'center' }}>
                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', fontSize: 10, color: '#6B1F38' }}>PAN Card</Typography>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: 9, mb: 0.5 }}>{cust.panNo}</Typography>
                                {cust.panPhoto ? (
                                  <img src={cust.panPhoto} alt="PAN KYC" style={{ width: '100%', maxHeight: 75, borderRadius: 4, objectFit: 'contain', border: '1px solid rgba(0,0,0,0.05)' }} />
                                ) : (
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ py: 2, fontSize: 10 }}>Not Uploaded</Typography>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column: Collateral Ornaments & Storage */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', border: '1px solid rgba(107,31,56,0.15)', bgcolor: '#FFFFFF' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 1, fontSize: 12 }}>
                      💍 Ornament Appraisal & Vault Box
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />

                    {(() => {
                      const orn = selectedDetailLoan.ornaments?.[0] || {
                        type: 'Ornament',
                        name: 'N/A',
                        pcs: 1,
                        purity: '22K',
                        grossWt: 0,
                        stone: 0,
                        net: 0,
                        rate: 0,
                        value: 0,
                        photos: []
                      };
                      return (
                        <Box>
                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Appraised Category</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{orn.type} ({orn.name})</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Quantity</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{orn.pcs} Pcs</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Purity</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#C5A059', fontSize: 11 }}>{orn.purity}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Gross Wt</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{selectedDetailLoan.totalGrossWt || 0}g</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Stone Wt</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{selectedDetailLoan.totalStoneWt || 0}g</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Net Wt</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38', fontSize: 11 }}>{selectedDetailLoan.totalNetWt || 0}g</Typography>
                            </Grid>

                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Appraisal Value</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981', fontSize: 11 }}>{currencyFormat(selectedDetailLoan.collateralValue || 0)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Vault Assignment</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38', fontSize: 11 }}>
                                {selectedDetailLoan.vaultRef ? `🔒 Locker COMP-${selectedDetailLoan.vaultRef.split('-').pop()}` : `🏢 Room Floor Storage`}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, fontSize: 10 }}>
                            Collateral Photography Proofs
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', py: 0.5 }}>
                            {orn.photos && orn.photos.length > 0 ? (
                              orn.photos.map((ph, idx) => (
                                <Avatar key={idx} src={ph} variant="rounded" sx={{ width: 64, height: 64, border: '1px solid rgba(197, 160, 89, 0.3)' }} />
                              ))
                            ) : (
                              <Avatar src={orn.photo} variant="rounded" sx={{ width: 64, height: 64, border: '1px solid rgba(197, 160, 89, 0.3)' }} />
                            )}
                          </Box>
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Bottom Row: Loan Schemes and Term Specifications */}
              <Grid item xs={12}>
                <Card sx={{ border: '1px solid rgba(107,31,56,0.15)', bgcolor: '#FFFFFF' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 1, fontSize: 12 }}>
                      💵 Financial Scheme & Term Specs
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />

                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Interest Accrual Scheme</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{selectedDetailLoan.interestType}</Typography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Interest Rate</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38', fontSize: 11 }}>{selectedDetailLoan.interestPct}% / month</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Pledge Term</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{selectedDetailLoan.duration} Months</Typography>
                      </Grid>
                      <Grid item xs={2.25}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Disbursement Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11 }}>{selectedDetailLoan.loanDate}</Typography>
                      </Grid>
                      <Grid item xs={2.25}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Maturity Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#EF4444', fontSize: 11 }}>{selectedDetailLoan.maturityDate}</Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 1.5, borderStyle: 'dotted' }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Outstanding Loan Amount</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>{currencyFormat(selectedDetailLoan.principal)}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Expected Monthly EMI</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#C5A059' }}>
                          {currencyFormat(selectedDetailLoan.monthlyInstallmentEMI || Math.round((selectedDetailLoan.principal / selectedDetailLoan.duration) + (selectedDetailLoan.principal * (selectedDetailLoan.interestPct / 100))))}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>Total Repayment Collected</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#10B981' }}>{currencyFormat(selectedDetailLoan.amountPaid || 0)}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)', justifyContent: 'space-between' }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleSaveChanges(selectedDetailLoan.customerId, selectedDetailLoan.id)}
                  sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, color: '#FFFFFF', fontSize: 11 }}
                >
                  Save Changes
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{ fontSize: 11 }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  const cust = db.customers.find(c => c.id === selectedDetailLoan.customerId) || {};
                  startEditing(cust, selectedDetailLoan);
                }}
                sx={{ bgcolor: '#C5A059', color: '#1A0D11', '&:hover': { bgcolor: '#B08E47' }, fontSize: 11 }}
              >
                Edit Profile Details
              </Button>
            )}
            <Button size="small" variant="contained" onClick={handleCloseDetails} sx={{ bgcolor: '#6B1F38', '&:hover': { bgcolor: '#521427' }, fontSize: 11 }}>
              Close Dossier
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
