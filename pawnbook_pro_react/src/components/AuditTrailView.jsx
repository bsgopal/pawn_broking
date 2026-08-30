import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';

import { db } from '../services/database';

export default function AuditTrailView() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Counter Audit Trail Diary</Typography>
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 3 }}>Historical records of operator auth logins, rate updates, and safety checks.</Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {db.audits.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
              No audit logs captured under this operational shift yet.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Timestamp</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Operator</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Action Scope</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Transaction Info</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {db.audits.map((a, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: 12 }}>{new Date(a.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{a.username}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{a.action}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{a.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
