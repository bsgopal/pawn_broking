import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function DailyRatesView({ onStateChange }) {
  const [gold22, setGold22] = useState('');
  const [gold24, setGold24] = useState('');
  const [silver, setSilver] = useState('');
  const [platinum, setPlatinum] = useState('');

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    if (!gold22 || !gold24 || !silver || !platinum) {
      alert('Please fill out all pricing counter inputs.');
      return;
    }

    await db.updateRates(parseFloat(gold22), parseFloat(gold24), parseFloat(silver), parseFloat(platinum));
    onStateChange();
    setGold22('');
    setGold24('');
    setSilver('');
    setPlatinum('');
  };

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={7}>
        <Card sx={{ p: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Operational Metal Rates Board</Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleUpdateRates}>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Gold 22K (₹/gm)"
                    type="number"
                    value={gold22}
                    onChange={(e) => setGold22(e.target.value)}
                    slotProps={{
                      inputLabel: { style: { fontSize: 12 } },
                      input: { style: { fontSize: 12 } }
                    }}
                  />
                </Grid>
                <Grid xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Gold 24K (₹/gm)"
                    type="number"
                    value={gold24}
                    onChange={(e) => setGold24(e.target.value)}
                    slotProps={{
                      inputLabel: { style: { fontSize: 12 } },
                      input: { style: { fontSize: 12 } }
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Silver (₹/gm)"
                    type="number"
                    value={silver}
                    onChange={(e) => setSilver(e.target.value)}
                    slotProps={{
                      inputLabel: { style: { fontSize: 12 } },
                      input: { style: { fontSize: 12 } }
                    }}
                  />
                </Grid>
                <Grid xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Platinum (₹/gm)"
                    type="number"
                    value={platinum}
                    onChange={(e) => setPlatinum(e.target.value)}
                    slotProps={{
                      inputLabel: { style: { fontSize: 12 } },
                      input: { style: { fontSize: 12 } }
                    }}
                  />
                </Grid>
              </Grid>

              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1 }}>
                Altered Counter Board Prices
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} md={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Counter Alteration Audit Log</Typography>
            <Divider sx={{ mb: 2.5 }} />

            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Gold 22K</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Silver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {db.ratesHistory.slice().reverse().map((r, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: 12 }}>{r.date}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{currencyFormat(r.gold22K)}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{currencyFormat(r.silver)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
