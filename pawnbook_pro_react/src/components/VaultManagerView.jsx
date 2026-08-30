import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  Button,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  TextField,
  LinearProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  Security as SecurityIcon,
  Thermostat as TempIcon,
  Verified as AuditIcon,
  ImportExport as MoveIcon,
  LocalPrintshop as PrintIcon,
  SaveAlt as ExportIcon,
  AddBox as CreateIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function VaultManagerView({ onStateChange }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Storage Floor lists
  const [selectedFloor, setSelectedFloor] = useState(db.floors[0] || null);

  // New Floor Form states
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorCapacity, setNewFloorCapacity] = useState('100');
  const [newFloorSecurity, setNewFloorSecurity] = useState('High Security');
  const [newFloorBlueprint, setNewFloorBlueprint] = useState('');

  // Night-time Audits count checklist
  const [manualChains, setManualChains] = useState('');
  const [manualRings, setManualRings] = useState('');
  const [manualBangles, setManualBangles] = useState('');
  const [manualNecklaces, setManualNecklaces] = useState('');
  const [manualOthers, setManualOthers] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [latestAuditResult, setLatestAuditResult] = useState(null);

  // Vault/Compartments grid mapping
  const branchVaults = db.vaults.filter(v => v.branchId === db.currentBranch?.id);
  const [selectedVault, setSelectedVault] = useState(branchVaults[0] || null);
  const [relocatingLoan, setRelocatingLoan] = useState(null);
  const [targetLocation, setTargetLocation] = useState('');

  // Auto count dynamic active pledge items in storage
  const activeLoans = db.loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const activePledgesCount = activeLoans.reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);

  // Calculations for selected vault/floor
  const storedFloorLoans = db.loans.filter(l => l.floorRef === selectedFloor?.id && (l.status === 'Active' || l.status === 'Overdue'));
  const storedVaultLoans = db.loans.filter(l => l.vaultRef === selectedVault?.id && (l.status === 'Active' || l.status === 'Overdue'));

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
    setSuccessMsg('');
  };

  // Convert uploaded floor blueprint blueprint picture to base64
  const handleBlueprintUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewFloorBlueprint(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const simulateBlueprintCapture = () => {
    // Beautiful gilded blueprint canvas base64 template
    const blueprintSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><rect width="100%" height="100%" fill="%236B1F38" opacity="0.05"/><rect x="5" y="5" width="110" height="70" stroke="%23C5A059" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/><line x1="40" y1="5" x2="40" y2="75" stroke="%23C5A059" opacity="0.3"/><line x1="80" y1="5" x2="80" y2="75" stroke="%23C5A059" opacity="0.3"/><text x="10" y="20" fill="%236B1F38" font-size="6" font-weight="bold">SECURE AREA</text></svg>';
    setNewFloorBlueprint(blueprintSvg);
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    if (!newFloorName) {
      alert('Floor Name is required.');
      return;
    }

    const newFloorObj = {
      id: `FLOOR-${Date.now()}`,
      branchId: db.currentBranch.id,
      name: newFloorName,
      capacity: parseInt(newFloorCapacity) || 100,
      securityLevel: newFloorSecurity,
      itemsCount: 0,
      loanIds: [],
      photoProof: newFloorBlueprint || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><rect width="100%" height="100%" fill="%23C5A059" opacity="0.1"/><text x="35" y="45" fill="%236B1F38" font-size="8">Locker blueprint</text></svg>'
    };

    await db.addNewFloor(newFloorObj);
    setNewFloorName('');
    setNewFloorBlueprint('');
    setSelectedFloor(newFloorObj);
    setSuccessMsg(`Storage Floor Room ${newFloorName} created successfully!`);
    setCreateModalOpen(false);
    onStateChange();
  };

  // Perform Daily Verification Audit
  const handleExecuteVerificationAudit = async (e) => {
    e.preventDefault();

    const chCount = parseInt(manualChains) || 0;
    const riCount = parseInt(manualRings) || 0;
    const baCount = parseInt(manualBangles) || 0;
    const neCount = parseInt(manualNecklaces) || 0;
    const otCount = parseInt(manualOthers) || 0;
    const totalPhysicalItemsCount = chCount + riCount + baCount + neCount + otCount;

    // Database items count breakdown by category
    const dbChains = activeLoans.filter(l => l.ornaments?.[0]?.category === 'Chain').reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);
    const dbRings = activeLoans.filter(l => l.ornaments?.[0]?.category === 'Ring').reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);
    const dbBangles = activeLoans.filter(l => l.ornaments?.[0]?.category === 'Bangles').reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);
    const dbNecklaces = activeLoans.filter(l => l.ornaments?.[0]?.category === 'Necklace').reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);
    const dbOthers = activeLoans.filter(l => l.ornaments?.[0]?.category !== 'Chain' && l.ornaments?.[0]?.category !== 'Ring' && l.ornaments?.[0]?.category !== 'Bangles' && l.ornaments?.[0]?.category !== 'Necklace').reduce((sum, l) => sum + (l.ornaments?.[0]?.pcs || 1), 0);

    const isMatch = totalPhysicalItemsCount === activePledgesCount;

    const newAuditLog = {
      id: `AUD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      operator: db.currentUser.name,
      physicalChains: chCount,
      dbChains,
      physicalRings: riCount,
      dbRings,
      physicalBangles: baCount,
      dbBangles,
      physicalNecklaces: neCount,
      dbNecklaces,
      physicalOthers: otCount,
      dbOthers,
      totalPhysical: totalPhysicalItemsCount,
      totalDb: activePledgesCount,
      isMatch,
      notes: auditNotes || 'Daily night verification count audit checklist'
    };

    await db.addDailyAudit(newAuditLog);
    setLatestAuditResult(newAuditLog);
    setManualChains('');
    setManualRings('');
    setManualBangles('');
    setManualNecklaces('');
    setManualOthers('');
    setAuditNotes('');
    setSuccessMsg('Inventory physical count audit sheet recorded.');
    onStateChange();
  };

  // Relocate Collateral Gold Assets
  const handleExecuteRelocation = async () => {
    if (!relocatingLoan || !targetLocation) return;

    try {
      const isTargetFloor = targetLocation.startsWith('FLOOR:');
      const targetId = targetLocation.split(':')[1];

      // Remove from source location
      if (relocatingLoan.floorRef) {
        const srcFl = db.floors.find(f => f.id === relocatingLoan.floorRef);
        if (srcFl) {
          srcFl.itemsCount = Math.max(0, srcFl.itemsCount - 1);
          srcFl.loanIds = srcFl.loanIds.filter(id => id !== relocatingLoan.id);
        }
      } else {
        const srcV = db.vaults.find(v => v.id === relocatingLoan.vaultRef);
        if (srcV) {
          srcV.currentItems = Math.max(0, srcV.currentItems - 1);
          srcV.loanIds = srcV.loanIds.filter(id => id !== relocatingLoan.id);
        }
      }

      // Add to target location
      if (isTargetFloor) {
        const destFl = db.floors.find(f => f.id === targetId);
        if (destFl) {
          destFl.itemsCount++;
          destFl.loanIds.push(relocatingLoan.id);
          relocatingLoan.floorRef = destFl.id;
          relocatingLoan.vaultRef = '';
        }
      } else {
        const destV = db.vaults.find(v => v.id === targetId);
        if (destV) {
          destV.currentItems = Math.min(destV.capacity, destV.currentItems + 1);
          destV.loanIds.push(relocatingLoan.id);
          relocatingLoan.vaultRef = destV.id;
          relocatingLoan.floorRef = '';
        }
      }

      await db.persist();
      db.logAuditEvent('Pledge Relocated', `Transferred collateral for Ticket ${relocatingLoan.ticket} to ${targetLocation}`);
      setSuccessMsg(`Pledge asset ${relocatingLoan.ticket} successfully relocated!`);
      setRelocatingLoan(null);
      onStateChange();
    } catch (e) {
      alert('Relocation execution error.');
    }
  };

  const getCustName = (custId) => {
    const c = db.customers.find(cust => cust.id === custId);
    return c ? c.name : 'Unknown borrower';
  };

  const exportAuditCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Operator,Physical Count,System Count,Status\n" + 
      db.dailyAudits.map(e => `${e.date},${e.operator},${e.totalPhysical},${e.totalDb},${e.isMatch ? 'MATCH' : 'MISMATCH'}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_gold_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🏢 Strong Room Locker Rooms</Typography>
        <Typography variant="caption" color="textSecondary">Configure dynamic secure storage floors, perform climate inspections, and execute daily nighttime inventory audits.</Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, border: '1px solid #10B981', bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}

      {/* Tabs Selector */}
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3.5, borderBottom: '1px solid rgba(197,160,89,0.2)' }} textColor="primary" indicatorColor="primary">
        <Tab label={<Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>🏢 Safe Floors & Rooms</Typography>} />
        <Tab label={<Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>🔒 Compartments Climate Grid</Typography>} />
        <Tab label={<Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>🚨 Night-time Counts verification</Typography>} />
      </Tabs>

      {/* TAB 0: Dynamic Floors & Rooms */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Left Side: Create & View Floors */}
          <Grid xs={12} md={7}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold' }}>Active Strong Rooms & Floors</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<CreateIcon />}
                    onClick={() => setCreateModalOpen(true)}
                    sx={{ fontSize: 11, height: 28 }}
                  >
                    + Construct Strong Room
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2.5}>
                  {db.floors.map(f => {
                    const activePledges = db.loans.filter(l => l.floorRef === f.id && (l.status === 'Active' || l.status === 'Overdue'));
                    f.itemsCount = activePledges.length; // sync counts
                    
                    const isSelected = selectedFloor?.id === f.id;
                    const percent = Math.round((f.itemsCount / f.capacity) * 100);

                    return (
                      <Grid xs={12} sm={6} key={f.id}>
                        <Paper
                          onClick={() => setSelectedFloor(f)}
                          sx={{
                            p: 2.5,
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'rgba(107,31,56,0.02)' : '#FFFFFF',
                            border: isSelected ? '2px solid #6B1F38' : '1px solid rgba(197,160,89,0.25)',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#6B1F38',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>{f.name}</Typography>
                            <Chip size="small" label={f.securityLevel} color="primary" sx={{ fontSize: 8, height: 16 }} />
                          </Box>
                          <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                            Capacity Load: {f.itemsCount} / {f.capacity} locked gold ornaments ({percent}%)
                          </Typography>
                          <LinearProgress variant="determinate" value={percent} color={percent >= 80 ? 'error' : 'primary'} sx={{ height: 6, borderRadius: 3 }} />
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side: Floor Details & Items */}
          <Grid xs={12} md={5}>
            {selectedFloor ? (
              <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>🏢 Storage {selectedFloor.name} Details</Typography>
                  <Divider sx={{ mb: 2.5 }} />

                  {/* Blueprint Display */}
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>SAFE ROOM BLUEPRINT BLUEPRINT</Typography>
                  <Box
                    sx={{
                      height: 120,
                      borderRadius: 2,
                      border: '1px solid rgba(197,160,89,0.3)',
                      bgcolor: '#FDFCF7',
                      backgroundImage: `url(${selectedFloor.photoProof || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23C5A059" opacity="0.1"/></svg>'})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      mb: 3
                    }}
                  />

                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>🔒 STORED GOLD IN THIS ROOM ({storedFloorLoans.length} items)</Typography>
                  {storedFloorLoans.length === 0 ? (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', py: 2 }}>
                      No collateral gold currently mapped to this Safe Room.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5} sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
                      {storedFloorLoans.map(l => {
                        const o = l.ornaments?.[0] || { type: 'Jewel', net: 0 };
                        return (
                          <Box key={l.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#FDFCF7' }}>
                            <Avatar src={o.photo || DEFAULT_JEWELRY_BASE64} variant="rounded" sx={{ width: 44, height: 44, border: '1px solid #C5A059' }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{l.ticket} - {getCustName(l.customerId)}</Typography>
                              <Typography variant="caption" color="textSecondary">{o.pcs || 1} pcs {o.type} ({o.net}g)</Typography>
                            </Box>
                            <Button size="small" variant="outlined" onClick={() => setRelocatingLoan(l)} sx={{ fontSize: 9, minWidth: 0, px: 1 }}>
                              Relocate
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="textSecondary">Select a Floor storage room to view details.</Typography>
            )}
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Vault Compartments Climate Grid */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid xs={12} md={7}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>Vault Safety Lockers Grid Layout</Typography>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  {branchVaults.map(v => {
                    const itemsInside = db.loans.filter(l => l.vaultRef === v.id && (l.status === 'Active' || l.status === 'Overdue')).length;
                    v.currentItems = itemsInside;
                    const percent = Math.round((itemsInside / v.capacity) * 100);
                    const isSelected = selectedVault?.id === v.id;
                    const capColor = percent >= 80 ? '#EF4444' : (percent > 0 ? '#C5A059' : '#5C5255');

                    return (
                      <Grid xs={4} sm={3} key={v.id}>
                        <Paper
                          onClick={() => setSelectedVault(v)}
                          sx={{
                            p: 2.5,
                            cursor: 'pointer',
                            textAlign: 'center',
                            bgcolor: isSelected ? 'rgba(107,31,56,0.02)' : '#FFFFFF',
                            border: isSelected ? '2px solid #6B1F38' : '1px solid rgba(197,160,89,0.25)',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#6B1F38',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <SecurityIcon sx={{ color: capColor, fontSize: 24, mb: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 11, color: isSelected ? '#6B1F38' : '#1A0D11' }}>
                            COMP-{v.compartmentNo}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9, display: 'block', mt: 0.5 }}>
                            {percent}% Occupancy ({itemsInside}/{v.capacity} box)
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={5}>
            {selectedVault ? (
              <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>🔒 Locker Vault COMP-{selectedVault.compartmentNo} Climate</Typography>
                  <Divider sx={{ mb: 2.5 }} />

                  <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: 1, p: 2, border: '1px solid rgba(197,160,89,0.25)', borderRadius: 2, textAlign: 'center', bgcolor: '#FDFCF7' }}>
                      <TempIcon sx={{ color: '#EF4444', mb: 0.5 }} />
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Locker Temp:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedVault.temperature?.toFixed(1) || '18.2'}°C</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, border: '1px solid rgba(197,160,89,0.25)', borderRadius: 2, textAlign: 'center', bgcolor: '#FDFCF7' }}>
                      <AuditIcon sx={{ color: '#10B981', mb: 0.5 }} />
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Last Audited:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>{selectedVault.lastAudited || 'Today'}</Typography>
                    </Box>
                  </Box>

                  <Button variant="outlined" color="primary" fullWidth onClick={() => handleAudit(selectedVault.id)} sx={{ mb: 3 }}>
                    Calibrate Temperature Sensors
                  </Button>

                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>🔒 STORED GOLD IN COMP-{selectedVault.compartmentNo} ({storedVaultLoans.length} items)</Typography>
                  {storedVaultLoans.length === 0 ? (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      No gold currently stored in this locker compartment.
                    </Typography>
                  ) : (
                    <Stack spacing={1.2}>
                      {storedVaultLoans.map(l => {
                        const o = l.ornaments?.[0] || { type: 'Jewel', net: 0 };
                        return (
                          <Box key={l.id} sx={{ p: 1, borderRadius: 1.5, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FDFCF7' }}>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{l.ticket} - {getCustName(l.customerId)}</Typography>
                              <Typography variant="caption" color="textSecondary">{o.pcs || 1} pcs {o.type} ({o.net}g)</Typography>
                            </Box>
                            <Button size="small" variant="outlined" onClick={() => setRelocatingLoan(l)} sx={{ fontSize: 9, px: 1, py: 0.1 }}>
                              Move
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="textSecondary">Select a locker compartment cell from layout.</Typography>
            )}
          </Grid>
        </Grid>
      )}

      {/* TAB 2: Night-time Counts verification */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          {/* Night-time count checklist form */}
          <Grid xs={12} md={6}>
            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>🚨 Night-time Physical Counting Checklist</Typography>
                <Divider sx={{ mb: 2.5 }} />

                <form onSubmit={handleExecuteVerificationAudit}>
                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Physical Chains (Pcs)*"
                        type="number"
                        value={manualChains}
                        onChange={(e) => setManualChains(e.target.value)}
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
                        label="Physical Rings (Pcs)*"
                        type="number"
                        value={manualRings}
                        onChange={(e) => setManualRings(e.target.value)}
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
                        label="Physical Bangles (Pcs)*"
                        type="number"
                        value={manualBangles}
                        onChange={(e) => setManualBangles(e.target.value)}
                        slotProps={{
                          input: { style: { fontSize: 12 } },
                          inputLabel: { style: { fontSize: 12 } }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Physical Necklaces (Pcs)*"
                        type="number"
                        value={manualNecklaces}
                        onChange={(e) => setManualNecklaces(e.target.value)}
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
                        label="Physical Others (Pcs)*"
                        type="number"
                        value={manualOthers}
                        onChange={(e) => setManualOthers(e.target.value)}
                        slotProps={{
                          input: { style: { fontSize: 12 } },
                          inputLabel: { style: { fontSize: 12 } }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    size="small"
                    label="Inspection Observations / Notes"
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    sx={{ mb: 3.5 }}
                    slotProps={{
                      input: { style: { fontSize: 12 } },
                      inputLabel: { style: { fontSize: 12 } }
                    }}
                  />

                  <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ py: 1.2 }}>
                    Record Daily Night-time Inventory Count
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Audit Verification Log results */}
          <Grid xs={12} md={6}>
            {/* Show Mismatch Warning Alert instantly */}
            {latestAuditResult && (
              <Alert
                severity={latestAuditResult.isMatch ? 'success' : 'error'}
                icon={latestAuditResult.isMatch ? <AuditIcon /> : <WarningIcon />}
                sx={{ mb: 3, border: latestAuditResult.isMatch ? '1px solid #10B981' : '1px solid #EF4444', borderRadius: 2 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {latestAuditResult.isMatch ? 'INVENTORY VERIFIED MATCH: SUCCESS' : 'INVENTORY AUDIT WARNING MISMATCH!'}
                </Typography>
                <Typography variant="caption">
                  {latestAuditResult.isMatch
                    ? `Manual physical items count (${latestAuditResult.totalPhysical} pcs) exactly matches active database index (${latestAuditResult.totalDb} pcs). Safe lockers verified secure.`
                    : `CRITICAL GAP! Manual counted gold items (${latestAuditResult.totalPhysical} pcs) DOES NOT MATCH system active pledges entered (${latestAuditResult.totalDb} pcs). Verify locker room blueprint allocations immediately!`}
                </Typography>
              </Alert>
            )}

            <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold' }}>📁 Dynamic Nightly Inventory Audit Sheets</Typography>
                    <Typography variant="caption" color="textSecondary">Daily verification count comparisons log sheets registry.</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" onClick={exportAuditCsv} sx={{ fontSize: 9, minWidth: 0, px: 1, py: 0.2 }}>
                      Export CSV
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => window.print()} sx={{ fontSize: 9, minWidth: 0, px: 1, py: 0.2 }}>
                      Print PDF
                    </Button>
                  </Stack>
                </Box>
                <Divider />

                {db.dailyAudits.length === 0 ? (
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 5 }}>
                    No inventory counts logged yet. Settle counts at counter close.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>Audit Date</TableCell>
                          <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>Auditor</TableCell>
                          <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>Physical vs DB</TableCell>
                          <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>Verification Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {db.dailyAudits.map((a, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: 10 }}>{a.date}</TableCell>
                            <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>{a.operator}</TableCell>
                            <TableCell sx={{ fontSize: 10 }}>
                              {a.totalPhysical} / {a.totalDb} pcs
                            </TableCell>
                            <TableCell sx={{ fontSize: 10 }}>
                              <Chip
                                size="small"
                                label={a.isMatch ? 'VERIFIED MATCH' : 'MISMATCH WARNING'}
                                color={a.isMatch ? 'success' : 'error'}
                                sx={{ fontSize: 8, height: 16, fontWeight: 'bold' }}
                              />
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
      )}

      {/* Relocation Storage Dialog Selector */}
      {relocatingLoan && (
        <Dialog open={true} onClose={() => setRelocatingLoan(null)} PaperProps={{ sx: { p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🔄 Relocate Pledge {relocatingLoan.ticket}</DialogTitle>
          <DialogContent>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 3 }}>
              Select target storage locker room or safe storage floor to transfer gold collateral.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="target-loc-label" sx={{ fontSize: 12 }}>Target Locker Floor / Room Room*</InputLabel>
              <Select
                labelId="target-loc-label"
                value={targetLocation}
                label="Target Locker Floor / Room Room*"
                onChange={(e) => setTargetLocation(e.target.value)}
                sx={{ fontSize: 12 }}
              >
                {db.floors.map(f => (
                  <MenuItem key={f.id} value={`FLOOR:${f.id}`} sx={{ fontSize: 12 }}>🏢 Storage Floors: {f.name}</MenuItem>
                ))}
                {db.vaults.filter(v => v.branchId === db.currentBranch?.id).map(v => (
                  <MenuItem key={v.id} value={`VAULT:${v.id}`} sx={{ fontSize: 12 }}>🔒 Locker Vault COMP-{v.compartmentNo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRelocatingLoan(null)} variant="outlined">Cancel</Button>
            <Button onClick={handleExecuteRelocation} variant="contained" disabled={!targetLocation}>Confirm Relocation</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Simplify Safe Floor Room Constructor Dialogue */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} PaperProps={{ sx: { p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#6B1F38' }}>🆕 Construct New Strong Room</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 3 }}>
            Create a secure storage locker room or strong room floor to warehouse gold assets.
          </Typography>

          <form onSubmit={handleCreateFloor}>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Strong Room / Locker Name*"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Storage Capacity (No. of items)*"
                  type="number"
                  value={newFloorCapacity}
                  onChange={(e) => setNewFloorCapacity(e.target.value)}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="sec-label" sx={{ fontSize: 11 }}>Safety Guard Level*</InputLabel>
                  <Select
                    labelId="sec-label"
                    value={newFloorSecurity}
                    label="Safety Guard Level*"
                    onChange={(e) => setNewFloorSecurity(e.target.value)}
                    sx={{ fontSize: 11 }}
                  >
                    <MenuItem value="Maximum Guard" sx={{ fontSize: 11 }}>Maximum Security Guard</MenuItem>
                    <MenuItem value="High Security" sx={{ fontSize: 11 }}>High Electronics Security</MenuItem>
                    <MenuItem value="Standard Locker" sx={{ fontSize: 11 }}>Standard Vault Locker</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, p: 1.5, border: '1px dashed rgba(197, 160, 89, 0.3)', borderRadius: 2 }}>
              <Avatar
                src={newFloorBlueprint || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="48" height="48"><rect width="100" height="100" fill="%23C5A059" opacity="0.1"/><path d="M10 20h80v60h-80z" fill="none" stroke="%236B1F38"/></svg>'}
                variant="rounded"
                sx={{ width: 48, height: 48, border: '1px solid #C5A059' }}
              />
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Strong Room Blueprint / Layout</Typography>
                <Grid container spacing={1}>
                  <Grid item>
                    <Button size="small" variant="outlined" startIcon={<CreateIcon />} onClick={simulateBlueprintCapture} sx={{ fontSize: 9, py: 0.2 }}>
                      Simulate Setup
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button component="label" size="small" variant="outlined" color="inherit" sx={{ fontSize: 9, py: 0.2 }}>
                      Upload Blueprint
                      <input type="file" hidden accept="image/*" onChange={handleBlueprintUpload} />
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>

            <DialogActions sx={{ px: 0, pb: 0 }}>
              <Button onClick={() => setCreateModalOpen(false)} variant="outlined">Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={!newFloorName}>Construct Room</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
