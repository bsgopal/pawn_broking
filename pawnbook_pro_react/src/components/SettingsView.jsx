import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

import { db } from '../services/database';
import { PermissionHelper } from '../services/permissionHelper';

export default function SettingsView({ onStateChange }) {
  // General settings states
  const [shopName, setShopName] = useState(db.settings.shopName);
  const [rbiLicense, setRbiLicense] = useState(db.settings.rbiLicenseNo);
  const [gstin, setGstin] = useState(db.settings.gstinNo);
  const [address, setAddress] = useState(db.settings.address);
  const [gracePeriod, setGracePeriod] = useState(db.settings.defaultGracePeriodDays.toString());

  // Custom Payment Types states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Hardware Permissions states
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [micPermission, setMicPermission] = useState('prompt');
  const [locationPermission, setLocationPermission] = useState('prompt');

  const checkAllPermissions = async () => {
    const cam = await PermissionHelper.getPermissionStatus('camera');
    const mic = await PermissionHelper.getPermissionStatus('microphone');
    const loc = await PermissionHelper.getPermissionStatus('location');
    setCameraPermission(cam);
    setMicPermission(mic);
    setLocationPermission(loc);
  };

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const handleRequestCamera = async () => {
    try {
      await PermissionHelper.requestCamera();
      alert('Camera access approved!');
    } catch (e) {
      alert(`Camera request skipped or denied: ${e.message}`);
    }
    checkAllPermissions();
  };

  const handleRequestMic = async () => {
    try {
      await PermissionHelper.requestMicrophone();
      alert('Microphone access approved!');
    } catch (e) {
      alert(`Microphone request skipped or denied: ${e.message}`);
    }
    checkAllPermissions();
  };

  const handleRequestLocation = async () => {
    try {
      await PermissionHelper.requestLocation();
      alert('Location access approved!');
    } catch (e) {
      alert(`Location request skipped or denied: ${e.message}`);
    }
    checkAllPermissions();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!shopName || !rbiLicense || !gstin) {
      alert('Please fill out all mandatory compliance settings.');
      return;
    }

    const updated = {
      ...db.settings,
      shopName,
      rbiLicenseNo: rbiLicense,
      gstinNo: gstin,
      address,
      defaultGracePeriodDays: parseInt(gracePeriod) || 5,
    };

    await db.saveSettings(updated);
    onStateChange();
    alert('Compliance parameters updated successfully!');
  };

  const handleCreatePaymentType = async (e) => {
    e.preventDefault();
    if (!newTypeName || !newTypeDesc) {
      alert('Please fill out the scheme name and details description.');
      return;
    }

    const newType = {
      id: `PT-${Date.now()}`,
      name: newTypeName,
      desc: newTypeDesc
    };

    await db.addPaymentType(newType);
    setNewTypeName('');
    setNewTypeDesc('');
    onStateChange();
    alert(`Payment scheme '${newTypeName}' successfully added! Calculations will auto-bind based on the keywords in the name.`);
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6B1F38' }}>⚙️ General Compliance & ERP Settings</Typography>
        <Typography variant="caption" color="textSecondary">Alter corporate parameters, license indexes, grace period constraints, and custom payment schemes.</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: General Shop Settings */}
        <Grid xs={12} md={7}>
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>
                🏢 Shop Compliance Profile
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <form onSubmit={handleSaveSettings}>
                <TextField
                  fullWidth
                  size="small"
                  label="Shop Legal Corporate Name*"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  sx={{ mb: 2.5 }}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="RBI Broking License Reference*"
                      value={rbiLicense}
                      onChange={(e) => setRbiLicense(e.target.value)}
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
                      label="GSTIN Unified Identity No*"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
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
                  label="Counter Corporate Location Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  sx={{ mb: 2.5 }}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Default Overdue Grace Period (Days)"
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  sx={{ mb: 4 }}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />

                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.2 }}>
                  Update Compliance Profiles
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Hardware & Device Permissions Manager Card */}
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>
                🛡️ Device & Hardware Permissions
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2.5 }}>
                Verify and manage native Android and laptop hardware access required for PawnBook Pro operational modules.
              </Typography>

              <List sx={{ p: 0 }}>
                {/* Geolocation/Location */}
                <ListItem sx={{ px: 0, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#6B1F38' }}>📍 Precise Geolocation Access</Typography>}
                    secondary={<Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Required to bind local counter transactions under strict compliance</Typography>}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      size="small"
                      label={locationPermission.toUpperCase()}
                      color={locationPermission === 'granted' ? 'success' : locationPermission === 'denied' ? 'error' : 'warning'}
                      sx={{ fontSize: 9, fontWeight: 'bold', height: 18 }}
                    />
                    <Button size="small" variant="outlined" onClick={handleRequestLocation} disabled={locationPermission === 'granted'} sx={{ fontSize: 10, py: 0.2 }}>
                      {locationPermission === 'granted' ? 'Enabled' : 'Request'}
                    </Button>
                  </Box>
                </ListItem>

                {/* Camera */}
                <ListItem sx={{ px: 0, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#6B1F38' }}>📷 System Camera Capture</Typography>}
                    secondary={<Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Required for gold item collateral photography and audit uploads</Typography>}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      size="small"
                      label={cameraPermission.toUpperCase()}
                      color={cameraPermission === 'granted' ? 'success' : cameraPermission === 'denied' ? 'error' : 'warning'}
                      sx={{ fontSize: 9, fontWeight: 'bold', height: 18 }}
                    />
                    <Button size="small" variant="outlined" onClick={handleRequestCamera} disabled={cameraPermission === 'granted'} sx={{ fontSize: 10, py: 0.2 }}>
                      {cameraPermission === 'granted' ? 'Enabled' : 'Request'}
                    </Button>
                  </Box>
                </ListItem>

                {/* Microphone */}
                <ListItem sx={{ px: 0, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#6B1F38' }}>🎤 Audio Input & Microphone</Typography>}
                    secondary={<Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Required for voice-activated memo logs and daily vault counts</Typography>}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      size="small"
                      label={micPermission.toUpperCase()}
                      color={micPermission === 'granted' ? 'success' : micPermission === 'denied' ? 'error' : 'warning'}
                      sx={{ fontSize: 9, fontWeight: 'bold', height: 18 }}
                    />
                    <Button size="small" variant="outlined" onClick={handleRequestMic} disabled={micPermission === 'granted'} sx={{ fontSize: 10, py: 0.2 }}>
                      {micPermission === 'granted' ? 'Enabled' : 'Request'}
                    </Button>
                  </Box>
                </ListItem>

                {/* Storage */}
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#6B1F38' }}>💾 Sandboxed Local File Storage</Typography>}
                    secondary={<Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Required to read and write database JSON files inside the app space</Typography>}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      size="small"
                      label="ACTIVE"
                      color="success"
                      sx={{ fontSize: 9, fontWeight: 'bold', height: 18 }}
                    />
                    <Button size="small" variant="outlined" disabled sx={{ fontSize: 10, py: 0.2 }}>
                      Granted
                    </Button>
                  </Box>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Manage Payment Types Schemes */}
        <Grid xs={12} md={5}>
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold', mb: 2 }}>
                ⚙️ Custom Payment Schemes
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <form onSubmit={handleCreatePaymentType}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Scheme Name*"
                  placeholder="e.g. Bi-Weekly EMI, Bullet Settlement"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Calculations Description*"
                  placeholder="e.g. Accrues daily interest, settlements at term"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  sx={{ mb: 3 }}
                  slotProps={{
                    input: { style: { fontSize: 12 } },
                    inputLabel: { style: { fontSize: 12 } }
                  }}
                />

                <Button type="submit" variant="outlined" color="primary" fullWidth sx={{ py: 0.8 }}>
                  Construct Custom Scheme
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Payment types lists */}
          <Card sx={{ border: '1px solid rgba(107,31,56,0.18)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6B1F38', fontWeight: 'bold' }}>
                  📁 Active Scheme Keyword Parser
                </Typography>
              </Box>
              <Divider />

              <List sx={{ p: 0 }}>
                {db.paymentTypes.map(t => (
                  <ListItem key={t.id} sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', py: 1.5 }}>
                    <ListItemText
                      primary={<Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#6B1F38' }}>{t.name}</Typography>}
                      secondary={<Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{t.desc}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
