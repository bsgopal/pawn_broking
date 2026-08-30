import React, { useState, useEffect } from 'react';
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
  Avatar,
  FormHelperText,
  Alert,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  Cached as LoaderIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

// Safe base64 defaults to prevent broken image cards
const DEFAULT_PURCHASER_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><circle cx="12" cy="8" r="4" fill="%236B1F38"/><path d="M12 14c-6.1 0-10 4-10 10h20c0-6-3.9-10-10-10z" fill="%236B1F38"/></svg>';
const DEFAULT_JEWELRY_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><circle cx="12" cy="12" r="8" stroke="%23C5A059" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="5" fill="%23C5A059"/></svg>';

export default function NewPawnView({ onStateChange, setPrintableLoan }) {
  // Existing Customers Lookup Cache
  const [existingCust, setExistingCust] = useState(null);
  const [applyLoyaltyOffer, setApplyLoyaltyOffer] = useState(false);

  // Customer dossier inputs
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAadhaar, setCustAadhaar] = useState('');
  const [custPan, setCustPan] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custNominee, setCustNominee] = useState('');
  const [custNomineeRelation, setCustNomineeRelation] = useState('');
  const [custNomineeMobile, setCustNomineeMobile] = useState('');

  // Media proofs (Base64)
  const [purchaserPhoto, setPurchaserPhoto] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState('');
  const [panPhoto, setPanPhoto] = useState('');
  const [jewelryPhotos, setJewelryPhotos] = useState([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('purchaser'); // 'purchaser' or 'jewelry' or 'aadhaar' or 'pan'

  // Ornament specifications
  const [ornamentCategory, setOrnamentCategory] = useState('Chain');
  const [ornamentName, setOrnamentName] = useState('22K Gold Rope Chain');
  const [ornamentPcs, setOrnamentPcs] = useState('1');
  const [purityKarat, setPurityKarat] = useState('22K');
  const [grossWt, setGrossWt] = useState('');
  const [stoneWt, setStoneWt] = useState('');
  const [goldRate, setGoldRate] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  
  // Scheme parameters
  const [selectedScheme, setSelectedScheme] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('3');
  const [interestPctPerMonth, setInterestPctPerMonth] = useState('2.5');
  const [loanAmount, setLoanAmount] = useState('');

  // Initialize dropdowns & default rate
  useEffect(() => {
    if (db.floors.length > 0) {
      setSelectedStorage(`FLOOR:${db.floors[0].id}`);
    } else if (db.vaults.length > 0) {
      setSelectedStorage(`VAULT:${db.vaults[0].id}`);
    }

    if (db.paymentTypes.length > 0) {
      setSelectedScheme(db.paymentTypes[0].id);
    }

    setGoldRate(db.currentRates.gold22K.toString());
  }, []);

  // Update appraisal rate based on purity
  useEffect(() => {
    if (purityKarat === '24K') setGoldRate(db.currentRates.gold24K.toString());
    else if (purityKarat === '22K') setGoldRate(db.currentRates.gold22K.toString());
    else if (purityKarat === '20K') setGoldRate(Math.round(db.currentRates.gold24K * 0.83).toString());
    else if (purityKarat === '18K') setGoldRate(Math.round(db.currentRates.gold24K * 0.75).toString());
  }, [purityKarat]);

  // Live Repeat Customer Deduplication Lookup by Phone
  useEffect(() => {
    if (custMobile.length === 10 && /^\d+$/.test(custMobile)) {
      const match = db.customers.find(c => c.mobile === custMobile);
      if (match) {
        setExistingCust(match);
        setCustName(match.name);
        setCustAadhaar(match.aadhaarNo !== 'Not Provided' ? match.aadhaarNo : '');
        setCustPan(match.panNo !== 'Not Provided' ? match.panNo : '');
        setCustAddress(match.address || '');
        setCustCity(match.city || '');
        setCustNominee(match.nominee || '');
        setCustNomineeRelation(match.relation || '');
        setCustNomineeMobile(match.nomineeMob || '');
        setPurchaserPhoto(match.photo || '');
        setAadhaarPhoto(match.aadhaarPhoto || '');
        setPanPhoto(match.panPhoto || '');
        setApplyLoyaltyOffer(true);
      } else {
        setExistingCust(null);
        setApplyLoyaltyOffer(false);
      }
    } else {
      setExistingCust(null);
      setApplyLoyaltyOffer(false);
    }
  }, [custMobile]);

  // Live input validations
  const isPhoneValid = custMobile === '' || (custMobile.length === 10 && /^\d+$/.test(custMobile));
  const isAadhaarValid = custAadhaar === '' || (custAadhaar.length === 12 && /^\d+$/.test(custAadhaar));
  const isNomineePhoneValid = custNomineeMobile === '' || (custNomineeMobile.length === 10 && /^\d+$/.test(custNomineeMobile));
  const isPanValid = custPan === '' || custPan.length < 10 || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(custPan);

  // Dynamic metal calculations
  const gross = parseFloat(grossWt) || 0;
  const stone = parseFloat(stoneWt) || 0;
  const netWt = Math.max(0, gross - stone);
  const ratePerGm = parseFloat(goldRate) || 0;
  const appraisedCollateralValue = netWt * ratePerGm;
  const maxLtvCap = appraisedCollateralValue * 0.75;

  // Scheme dynamics
  const activeScheme = db.paymentTypes.find(t => t.id === selectedScheme) || { name: '' };
  const isEmiScheme = activeScheme.name.toLowerCase().includes('monthly') || activeScheme.name.toLowerCase().includes('emi');
  
  // Calculate dynamic pricing
  const baseRate = parseFloat(interestPctPerMonth) || 0;
  const applicableRate = applyLoyaltyOffer ? Math.max(0.5, baseRate - 0.5) : baseRate;
  
  const totalAccruedTermInterest = Math.round(
    (parseFloat(loanAmount) || 0) * (applicableRate / 100) * (parseInt(loanTermMonths) || 3)
  );

  const monthlyInstallmentEMI = isEmiScheme
    ? Math.round(((parseFloat(loanAmount) || 0) / (parseInt(loanTermMonths) || 3)) + ((parseFloat(loanAmount) || 0) * (applicableRate / 100)))
    : 0;

  const handleOpenCamera = (target) => {
    setCameraTarget(target);
    setCameraModalOpen(true);
  };

  const handleCameraCapture = (base64) => {
    if (cameraTarget === 'purchaser') {
      setPurchaserPhoto(base64);
    } else if (cameraTarget === 'aadhaar') {
      setAadhaarPhoto(base64);
    } else if (cameraTarget === 'pan') {
      setPanPhoto(base64);
    } else {
      setJewelryPhotos(prev => [...prev, base64]);
    }
  };

  const simulatePurchaserCapture = () => {
    const premiumFaceMock = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23FDFCF7"/><circle cx="50" cy="40" r="18" fill="%236B1F38"/><path d="M50 63c-20 0-32 10-32 25h64c0-15-12-25-32-25z" fill="%236B1F38"/><circle cx="50" cy="50" r="45" fill="none" stroke="%23C5A059" stroke-width="3"/></svg>';
    setPurchaserPhoto(premiumFaceMock);
  };

  const simulateJewelryCapture = () => {
    const premiumGoldMock = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23FDFCF7"/><path d="M20 30q30 50 60 0t-60 0" fill="none" stroke="%23C5A059" stroke-width="4"/><circle cx="50" cy="50" r="8" fill="%236B1F38" stroke="%23C5A059" stroke-width="1.5"/><circle cx="35" cy="42" r="3" fill="%23C5A059"/><circle cx="65" cy="42" r="3" fill="%23C5A059"/></svg>';
    setJewelryPhotos(prev => [...prev, premiumGoldMock]);
  };

  // Convert uploaded files to safe base64 strings
  const handlePhotoUpload = (e, setPhoto) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUploadMultiple = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setJewelryPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Form submission & connected sync handler
  const handleEnrollAndDisburse = async (e) => {
    e.preventDefault();

    if (!custName || !custMobile || !grossWt || !loanAmount) {
      alert('Please fill out all mandatory customer and ornament fields.');
      return;
    }

    if (!isPhoneValid || !isAadhaarValid || !isNomineePhoneValid || !isPanValid) {
      alert('Dossier contains live validation errors. Please correct them.');
      return;
    }

    const principal = parseFloat(loanAmount) || 0;
    if (principal > maxLtvCap) {
      alert(`Appraisal LTV Violation! Principal exceeds 75% cap worth ₹${currencyFormat(maxLtvCap)}`);
      return;
    }

    let customerId = '';
    if (existingCust) {
      customerId = existingCust.id;
      // Log loyalty transaction update
      db.logAuditEvent('Repeat Customer Pledged', `Repeat loan mapped to customer dossier for ${custName}`);
    } else {
      // Create new customer dossier automatically
      customerId = `C-${Date.now()}`;
      const newCustomer = {
        id: customerId,
        name: custName,
        mobile: custMobile,
        altMobile: custNomineeMobile,
        email: 'dossier@pawnbook.pro',
        aadhaarNo: custAadhaar || 'Not Provided',
        aadhaarVerified: custAadhaar.length === 12,
        panNo: custPan || 'Not Provided',
        panVerified: custPan.length === 10 && isPanValid,
        aadhaarPhoto: aadhaarPhoto || '',
        panPhoto: panPhoto || '',
        dob: '1992-01-01',
        address: custAddress,
        city: custCity,
        nominee: custNominee,
        relation: custNomineeRelation,
        nomineeMob: custNomineeMobile,
        status: 'Active',
        kycStatus: custAadhaar.length === 12 ? 'Verified' : 'Pending',
        photo: purchaserPhoto || DEFAULT_PURCHASER_BASE64,
        loyaltyPoints: 10,
        totalLoansCount: 1,
        creditScore: 4.0
      };
      await db.addCustomer(newCustomer);
    }

    // Storage bindings
    const isFloorStorage = selectedStorage.startsWith('FLOOR:');
    const storageId = selectedStorage.split(':')[1];
    
    // Auto-disburse Pawn ticket
    const ticketNo = `PWN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + parseInt(loanTermMonths));

    const newLoan = {
      id: `L-${Date.now()}`,
      ticket: ticketNo,
      customerId,
      branchId: db.currentBranch.id,
      loanDate: today,
      maturityDate: maturity.toISOString().split('T')[0],
      duration: parseInt(loanTermMonths),
      daysOverdue: 0,
      renewalCount: 0,
      principal,
      interestType: activeScheme.name,
      interestPct: applicableRate,
      gstPercent: 18,
      totalGrossWt: gross,
      totalNetWt: netWt,
      totalStoneWt: stone,
      eligiblePct: 0.75,
      marketValue: appraisedCollateralValue,
      collateralValue: appraisedCollateralValue,
      status: 'Active',
      vaultRef: isFloorStorage ? '' : storageId,
      floorRef: isFloorStorage ? storageId : '',
      lockedBox: `BOX-${Math.floor(10 + Math.random() * 90)}`,
      insured: true,
      insuranceRefNo: `INS-${Date.now().toString().slice(-6)}`,
      amountPaid: 0,
      interestDue: totalAccruedTermInterest,
      penalty: 0,
      balancePayable: Math.round(principal + totalAccruedTermInterest * 1.18),
      condition: 'Good',
      notes: 'New Malabar Gold Standard Loan',
      ornaments: [
        {
          id: `ORN-${Date.now()}`,
          type: ornamentCategory,
          category: ornamentCategory,
          name: ornamentName,
          pcs: parseInt(ornamentPcs) || 1,
          metal: 'Gold',
          purity: purityKarat,
          grossWt: gross,
          stone,
          net: netWt,
          rate: ratePerGm,
          rateDate: today,
          value: appraisedCollateralValue,
          photo: jewelryPhotos[0] || DEFAULT_JEWELRY_BASE64,
          photos: jewelryPhotos.length > 0 ? jewelryPhotos : [DEFAULT_JEWELRY_BASE64],
          tested: true,
          testDate: today,
          verifiedBy: db.currentUser.name,
          certNo: `CERT-${Date.now().toString().slice(-6)}`,
        }
      ],
      payments: []
    };

    // Update storage rooms
    if (isFloorStorage) {
      const fl = db.floors.find(f => f.id === storageId);
      if (fl) {
        fl.itemsCount++;
        fl.loanIds.push(newLoan.id);
        fl.photoProof = jewelryPhotos[0] || DEFAULT_JEWELRY_BASE64;
      }
    } else {
      const v = db.vaults.find(vault => vault.id === storageId);
      if (v) {
        v.currentItems = Math.min(v.capacity, v.currentItems + 1);
        v.loanIds.push(newLoan.id);
      }
    }

    await db.addNewLoan(newLoan);
    setPrintableLoan(newLoan);
    onStateChange();

    // Reset Form
    setCustName('');
    setCustMobile('');
    setCustAadhaar('');
    setCustPan('');
    setAadhaarPhoto('');
    setPanPhoto('');
    setCustAddress('');
    setCustCity('');
    setCustNominee('');
    setCustNomineeRelation('');
    setCustNomineeMobile('');
    setPurchaserPhoto('');
    setJewelryPhotos([]);
    setGrossWt('');
    setStoneWt('');
    setLoanAmount('');
    setExistingCust(null);
    setApplyLoyaltyOffer(false);

    alert(`Pawn Ticket ${ticketNo} successfully disbursed!`);
  };

  return (
    <Box>
      {/* Dynamic WhatsApp Banner Alert Mock */}
      {applyLoyaltyOffer && (
        <Alert
          severity="success"
          icon={<StarIcon sx={{ color: '#C5A059' }} />}
          sx={{
            mb: 3,
            bgcolor: 'rgba(107, 31, 56, 0.05)',
            border: '1px solid #6B1F38',
            color: '#6B1F38',
            fontWeight: 'bold',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'black' }}>
              REPEAT CUSTOMER DETECTED!
            </Typography>
            <Typography variant="caption">
              Loyalty appraisal discount of 0.5% applied. Customer profile dossier synced successfully.
            </Typography>
          </Box>
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>💎 Gold Collateral Pawn Ticket</Typography>
        <Typography variant="caption" color="textSecondary">Create instant, high-fidelity customer profiles and verify ornaments appraisal details inspired by Malabar standards.</Typography>
      </Box>

      <form onSubmit={handleEnrollAndDisburse}>
        <Grid container spacing={3}>
          {/* Customer dossier */}
          <Grid xs={12} md={6}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  👤 Borrower Dossier Profile
                </Typography>
                <Divider sx={{ mb: 2.5 }} />

                {/* Purchaser Portrait Capture */}
                <Box sx={{ display: 'flex', gap: 2.5, mb: 3, alignItems: 'center' }}>
                  <Avatar
                    src={purchaserPhoto || DEFAULT_PURCHASER_BASE64}
                    sx={{
                      width: 76,
                      height: 76,
                      border: '2px solid #C5A059',
                      bgcolor: '#FDFCF7'
                    }}
                  />
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                      PURCHASER PORTRAIT (REQUIRED)
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={<CameraIcon />}
                          onClick={() => handleOpenCamera('purchaser')}
                          sx={{ fontSize: 10, py: 0.5 }}
                        >
                          Capture Face
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          color="inherit"
                          startIcon={<UploadIcon />}
                          sx={{ fontSize: 10, py: 0.5 }}
                        >
                          Upload File
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, setPurchaserPhoto)}
                          />
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mobile Contact (10-Digit)*"
                      value={custMobile}
                      onChange={(e) => setCustMobile(e.target.value)}
                      error={!isPhoneValid}
                      helperText={!isPhoneValid ? "Must be exactly 10 numeric digits" : ""}
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
                      label="Customer Full Name*"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      disabled={!!existingCust}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Aadhaar 12-Digit No"
                      value={custAadhaar}
                      onChange={(e) => setCustAadhaar(e.target.value)}
                      error={!isAadhaarValid}
                      helperText={!isAadhaarValid ? "Must be exactly 12 numeric digits" : ""}
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
                      label="PAN Card Number (Uppercase)"
                      value={custPan}
                      autoComplete="off"
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        
                        // Prevent WebView keyboard buffer flushes from clearing the field during layout swaps
                        if (val === '') {
                          if (custPan.length === 1) {
                            setCustPan('');
                          }
                          return;
                        }

                        if (val.length <= 10) {
                          let isValid = true;
                          for (let i = 0; i < val.length; i++) {
                            const char = val[i];
                            if (i < 5) {
                              if (!/[A-Z]/.test(char)) isValid = false;
                            } else if (i < 9) {
                              if (!/[0-9]/.test(char)) isValid = false;
                            } else if (i === 9) {
                              if (!/[A-Z]/.test(char)) isValid = false;
                            }
                          }
                          if (isValid) {
                            setCustPan(val);
                          }
                        }
                      }}
                      error={!isPanValid}
                      helperText={!isPanValid ? "Must match Indian PAN format: ABCDE1234F" : ""}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } },
                        htmlInput: {
                          inputMode: custPan.length < 5 ? 'text' : (custPan.length < 9 ? 'numeric' : 'text')
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Residential Location Address"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
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
                      label="City"
                      value={custCity}
                      onChange={(e) => setCustCity(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3, mb: 1.5, fontWeight: 'bold' }}>
                  🆔 KYC DOCUMENTS PROOFS (AADHAAR & PAN CARD)
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Aadhaar Photo Card */}
                  <Grid xs={6}>
                    <Box sx={{ border: '1px dashed rgba(197, 160, 89, 0.4)', borderRadius: 2, p: 1.5, textAlign: 'center', bgcolor: '#FDFCF7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#6B1F38', fontSize: 10 }}>Aadhaar Card Photo</Typography>
                      {aadhaarPhoto ? (
                        <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                          <img src={aadhaarPhoto} alt="Aadhaar Preview" style={{ width: '100%', maxHeight: 85, borderRadius: 4, objectFit: 'contain' }} />
                          <IconButton
                            size="small"
                            onClick={() => setAadhaarPhoto('')}
                            sx={{ position: 'absolute', top: -5, right: -5, bgcolor: '#EF4444', color: '#FFFFFF', width: 16, height: 16, p: 0, '&:hover': { bgcolor: '#DC2626' } }}
                          >
                            <CloseIcon sx={{ fontSize: 8 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                          <Button variant="outlined" size="small" startIcon={<CameraIcon />} onClick={() => handleOpenCamera('aadhaar')} sx={{ fontSize: 9, py: 0.3 }}>
                            Snap Document
                          </Button>
                          <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ fontSize: 9, py: 0.3 }}>
                            Upload File
                            <input type="file" hidden accept="image/*" onChange={(e) => handlePhotoUpload(e, setAadhaarPhoto)} />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* PAN Photo Card */}
                  <Grid xs={6}>
                    <Box sx={{ border: '1px dashed rgba(197, 160, 89, 0.4)', borderRadius: 2, p: 1.5, textAlign: 'center', bgcolor: '#FDFCF7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#6B1F38', fontSize: 10 }}>PAN Card Photo</Typography>
                      {panPhoto ? (
                        <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                          <img src={panPhoto} alt="PAN Preview" style={{ width: '100%', maxHeight: 85, borderRadius: 4, objectFit: 'contain' }} />
                          <IconButton
                            size="small"
                            onClick={() => setPanPhoto('')}
                            sx={{ position: 'absolute', top: -5, right: -5, bgcolor: '#EF4444', color: '#FFFFFF', width: 16, height: 16, p: 0, '&:hover': { bgcolor: '#DC2626' } }}
                          >
                            <CloseIcon sx={{ fontSize: 8 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                          <Button variant="outlined" size="small" startIcon={<CameraIcon />} onClick={() => handleOpenCamera('pan')} sx={{ fontSize: 9, py: 0.3 }}>
                            Snap Document
                          </Button>
                          <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ fontSize: 9, py: 0.3 }}>
                            Upload File
                            <input type="file" hidden accept="image/*" onChange={(e) => handlePhotoUpload(e, setPanPhoto)} />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>
                  📌 NOMINEE & EMERGENCY ASSIGNMENT
                </Typography>

                <Grid container spacing={2}>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nominee Name"
                      value={custNominee}
                      onChange={(e) => setCustNominee(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Relation"
                      value={custNomineeRelation}
                      onChange={(e) => setCustNomineeRelation(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nominee Mobile"
                      value={custNomineeMobile}
                      onChange={(e) => setCustNomineeMobile(e.target.value)}
                      error={!isNomineePhoneValid}
                      helperText={!isNomineePhoneValid ? "10 digits required" : ""}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Jewelry Appraisal Specifications */}
          <Grid xs={12} md={6}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  💍 Ornaments Appraisal & Storage
                </Typography>
                <Divider sx={{ mb: 2.5 }} />

                {/* Jewelry Ornament Picture Upload - Multiple Proofs Support */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                    JEWELRY PLEDGE PROOFS (UP TO 5 PHOTOS)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    {jewelryPhotos.length === 0 ? (
                      <Avatar
                        src={DEFAULT_JEWELRY_BASE64}
                        variant="rounded"
                        sx={{
                          width: 76,
                          height: 76,
                          border: '2px dashed #C5A059',
                          bgcolor: '#FDFCF7'
                        }}
                      />
                    ) : (
                      jewelryPhotos.map((img, idx) => (
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
                            onClick={() => setJewelryPhotos(prev => prev.filter((_, i) => i !== idx))}
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
                        <Grid>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<CameraIcon />}
                            onClick={() => handleOpenCamera('jewelry')}
                            sx={{ fontSize: 10, py: 0.5, minWidth: 120 }}
                          >
                            Snap Photo
                          </Button>
                        </Grid>
                        <Grid>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            color="inherit"
                            startIcon={<UploadIcon />}
                            sx={{ fontSize: 10, py: 0.5, minWidth: 120 }}
                          >
                            Upload Photo
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

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="orn-cat-label" sx={{ fontSize: 12 }}>Ornament Category</InputLabel>
                      <Select
                        labelId="orn-cat-label"
                        value={ornamentCategory}
                        label="Ornament Category"
                        onChange={(e) => setOrnamentCategory(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        <MenuItem value="Chain" sx={{ fontSize: 12 }}>Gold Chain</MenuItem>
                        <MenuItem value="Ring" sx={{ fontSize: 12 }}>Ring</MenuItem>
                        <MenuItem value="Bangles" sx={{ fontSize: 12 }}>Bangles</MenuItem>
                        <MenuItem value="Necklace" sx={{ fontSize: 12 }}>Necklace</MenuItem>
                        <MenuItem value="Bracelet" sx={{ fontSize: 12 }}>Bracelet</MenuItem>
                        <MenuItem value="Other" sx={{ fontSize: 12 }}>Other Precious Asset</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Specific Description / Model"
                      value={ornamentName}
                      onChange={(e) => setOrnamentName(e.target.value)}
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
                      label="Quantity (Pcs)*"
                      type="number"
                      value={ornamentPcs}
                      onChange={(e) => setOrnamentPcs(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="purity-label" sx={{ fontSize: 12 }}>Gold Purity Karat*</InputLabel>
                      <Select
                        labelId="purity-label"
                        value={purityKarat}
                        label="Gold Purity Karat*"
                        onChange={(e) => setPurityKarat(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        <MenuItem value="24K" sx={{ fontSize: 12 }}>24K (99.9% Purity Ratio)</MenuItem>
                        <MenuItem value="22K" sx={{ fontSize: 12 }}>22K (91.6% Purity Ratio)</MenuItem>
                        <MenuItem value="20K" sx={{ fontSize: 12 }}>20K (83.3% Purity Ratio)</MenuItem>
                        <MenuItem value="18K" sx={{ fontSize: 12 }}>18K (75.0% Purity Ratio)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Gold Valuation Rate (₹/g)*"
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

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Gross Weight (grams)*"
                      type="number"
                      value={grossWt}
                      onChange={(e) => setGrossWt(e.target.value)}
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
                      label="Stone Deductions (grams)"
                      type="number"
                      value={stoneWt}
                      onChange={(e) => setStoneWt(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="storage-label" sx={{ fontSize: 12 }}>Assign Locker Room / Floor Location*</InputLabel>
                      <Select
                        labelId="storage-label"
                        value={selectedStorage}
                        label="Assign Locker Room / Floor Location*"
                        onChange={(e) => setSelectedStorage(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        {db.floors.map(f => (
                          <MenuItem key={f.id} value={`FLOOR:${f.id}`} sx={{ fontSize: 12 }}>🏢 Storage {f.name} (Pledges: {f.itemsCount})</MenuItem>
                        ))}
                        {db.vaults.filter(v => v.branchId === db.currentBranch?.id).map(v => (
                          <MenuItem key={v.id} value={`VAULT:${v.id}`} sx={{ fontSize: 12 }}>🔒 Locker Vault COMP-{v.compartmentNo} ({v.currentItems}/{v.capacity} box)</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Appraisal calculations summary */}
                <Box sx={{ bgcolor: 'rgba(197, 160, 89, 0.06)', border: '1px solid rgba(197, 160, 89, 0.25)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Grid container spacing={1}>
                    <Grid xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Net Gold Weight:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1A0D11' }}>{netWt.toFixed(2)} grams</Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Appraised Collateral Worth:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981' }}>{currencyFormat(appraisedCollateralValue)}</Typography>
                    </Grid>
                    <Grid xs={12}>
                      <Divider sx={{ my: 1, borderColor: 'rgba(197,160,89,0.15)' }} />
                    </Grid>
                    <Grid xs={12}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Legal Gold Loan LTV Maximum Limit (75%):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>{currencyFormat(maxLtvCap)}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Terms Options */}
          <Grid xs={12}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>
                  💵 Payment Scheme & Disburse Parameters
                </Typography>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="scheme-label" sx={{ fontSize: 12 }}>Accrual Interest Scheme*</InputLabel>
                      <Select
                        labelId="scheme-label"
                        value={selectedScheme}
                        label="Accrual Interest Scheme*"
                        onChange={(e) => setSelectedScheme(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        {db.paymentTypes.map(t => (
                          <MenuItem key={t.id} value={t.id} sx={{ fontSize: 12 }}>{t.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="term-label" sx={{ fontSize: 12 }}>Accrual Term (Months)*</InputLabel>
                      <Select
                        labelId="term-label"
                        value={loanTermMonths}
                        label="Accrual Term (Months)*"
                        onChange={(e) => setLoanTermMonths(e.target.value)}
                        sx={{ fontSize: 12 }}
                      >
                        <MenuItem value="3" sx={{ fontSize: 12 }}>3 Months</MenuItem>
                        <MenuItem value="6" sx={{ fontSize: 12 }}>6 Months</MenuItem>
                        <MenuItem value="12" sx={{ fontSize: 12 }}>12 Months</MenuItem>
                        <MenuItem value="24" sx={{ fontSize: 12 }}>24 Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Monthly Interest Rate (%)*"
                      type="number"
                      value={interestPctPerMonth}
                      onChange={(e) => setInterestPctPerMonth(e.target.value)}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                  <Grid xs={12} sm={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Required Principal Amount (₹)*"
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      error={parseFloat(loanAmount) > maxLtvCap}
                      helperText={parseFloat(loanAmount) > maxLtvCap ? `Breaches 75% LTV Cap! Max allowed: ₹${maxLtvCap.toFixed(0)}` : ""}
                      slotProps={{
                        input: { style: { fontSize: 12 } },
                        inputLabel: { style: { fontSize: 12 } }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Scheme Calculation Preview Panels */}
                <Grid container spacing={3} sx={{ mb: 2 }}>
                  <Grid xs={12} md={4}>
                    <Box sx={{ border: '1px solid rgba(107,31,56,0.15)', p: 2, borderRadius: 2, height: '100%', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>Applicable Interest Rate:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>
                        {applicableRate}% / Month
                      </Typography>
                      {applyLoyaltyOffer && (
                        <Typography variant="caption" sx={{ color: '#10B981', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                          Includes 0.5% Repeat Customer loyalty discount!
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid xs={12} md={4}>
                    <Box sx={{ border: '1px solid rgba(107,31,56,0.15)', p: 2, borderRadius: 2, height: '100%', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>Interest Scheme Mode:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#C5A059' }}>
                        {isEmiScheme ? 'Monthly Installment (EMI)' : 'Bullet Settlement'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        Calculated based on selected payment type scheme parameters.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid xs={12} md={4}>
                    <Box sx={{ border: '1px solid rgba(107,31,56,0.25)', p: 2, borderRadius: 2, height: '100%', bgcolor: 'rgba(107,31,56,0.02)' }}>
                      {isEmiScheme ? (
                        <>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>Calculated Monthly EMI Due:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'black', color: '#6B1F38' }}>
                            {currencyFormat(monthlyInstallmentEMI)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                            ₹{Math.round((parseFloat(loanAmount) || 0) / parseInt(loanTermMonths))} Principal + ₹{Math.round((parseFloat(loanAmount) || 0) * (applicableRate / 100))} Interest per month.
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>Payable at Maturity Term:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'black', color: '#6B1F38' }}>
                            {currencyFormat((parseFloat(loanAmount) || 0) + totalAccruedTermInterest)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                            Total Term Accrued Interest: {currencyFormat(totalAccruedTermInterest)} (due at end of {loanTermMonths} months).
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    fontWeight: 'black',
                    fontSize: 14,
                    letterSpacing: 0.8,
                    bgcolor: '#6B1F38',
                    '&:hover': { bgcolor: '#521427' }
                  }}
                >
                  DISBURSE GOLD LOAN VOUCHER (PRINT SLIP)
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {/* Live Camera Preview Dialog */}
      <CameraCaptureDialog
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </Box>
  );
}

// ==================== LIVE CAMERA VIEWPORT CAPTURE MODAL SUB-COMPONENT ==================== //
function CameraCaptureDialog({ open, onClose, onCapture }) {
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [devices, setDevices] = React.useState([]);
  const [selectedDevice, setSelectedDevice] = React.useState('');
  const [error, setError] = React.useState('');

  const startCamera = async () => {
    try {
      setError('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : { facingMode: 'user' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (err) {
      console.error(err);
      setError('Unable to access camera device. Please check permissions or switch to file upload.');
    }
  };

  React.useEffect(() => {
    if (open) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open, selectedDevice]);

  const handleCaptureClick = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg');
      onCapture(base64);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#6B1F38', color: '#FFFFFF', py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Live Camera Capture Viewport</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#FFFFFF' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, bgcolor: '#FDFCF7', textAlign: 'center' }}>
        {error ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
            <Typography variant="caption" color="textSecondary">Ensure your browser or device permissions allow camera hardware access, then try again.</Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', width: '100%', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', maxWidth: 480, height: 'auto', borderRadius: 8, border: '2px solid #C5A059', backgroundColor: '#000000' }} 
            />
            {devices.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                <InputLabel id="camera-select-label" sx={{ fontSize: 11 }}>Switch Camera Input</InputLabel>
                <Select
                  labelId="camera-select-label"
                  value={selectedDevice}
                  label="Switch Camera Input"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  sx={{ fontSize: 11 }}
                >
                  {devices.map((dev, idx) => (
                    <MenuItem key={dev.deviceId} value={dev.deviceId} sx={{ fontSize: 11 }}>
                      {dev.label || `Camera Device ${idx + 1}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FDFCF7' }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small">
          Cancel
        </Button>
        {!error && (
          <Button onClick={handleCaptureClick} variant="contained" color="primary" size="small" startIcon={<CameraIcon />}>
            Capture Photo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
