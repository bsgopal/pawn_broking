import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import { db } from '../services/database';

export default function LoginScreen({ onLoginSuccess }) {
  const [mobile, setMobile] = useState('9345578103');
  const [password, setPassword] = useState('123456');
  const [selectedBranch, setSelectedBranch] = useState('B001');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!mobile || !password) {
      setErrorMsg('Please complete all counter fields.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await db.authenticate(mobile, password, selectedBranch);
    setLoading(false);
    if (success) {
      onLoginSuccess();
    } else {
      setErrorMsg('Invalid security credentials or signature mismatch.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', p: 2 }}>
      <Paper elevation={4} sx={{ width: '100%', maxWidth: 390, p: 4, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid rgba(212,175,55,0.18)' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'black', letterSpacing: 1.5 }}>
            PAWNBOOK PRO
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ letterSpacing: 0.5 }}>
            Enterprise Jewelry Broking System
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, fontSize: 11, py: 0.5 }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel id="branch-select-label" sx={{ color: '#D4AF37', fontSize: 12 }}>Operational Counter Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              value={selectedBranch}
              label="Operational Counter Branch"
              onChange={(e) => setSelectedBranch(e.target.value)}
              sx={{ fontSize: 12 }}
            >
              <MenuItem value="B001" sx={{ fontSize: 12 }}>Chennai Main</MenuItem>
              <MenuItem value="B002" sx={{ fontSize: 12 }}>Bangalore Main</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Operator Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            sx={{ mb: 2.5 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ fontSize: 16, color: '#D4AF37' }} />
                  </InputAdornment>
                ),
                style: { fontSize: 12 }
              },
              inputLabel: { style: { fontSize: 12, color: '#D4AF37' } }
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Security Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3.5 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 16, color: '#D4AF37' }} />
                  </InputAdornment>
                ),
                style: { fontSize: 12 }
              },
              inputLabel: { style: { fontSize: 12, color: '#D4AF37' } }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ py: 1.2, fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9, lineHeight: 1.4, display: 'block' }}>
            Demo: 9345578103 / pass: 123456<br />
            {db.isServerActive ? '🟢 Cloud Database Connected' : '⚡ Secured under offline JWT parameters'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
