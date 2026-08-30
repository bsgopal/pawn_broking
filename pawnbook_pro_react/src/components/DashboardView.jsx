import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import {
  MonetizationOn as RatesIcon,
  PieChart as ReportsIcon,
  Security as SecurityIcon,
  Bolt as BoltIcon,
  Description as DescriptionIcon,
  ListAlt as ListIcon,
  NotificationsActive as AlertIcon,
  HourglassEmpty as DueIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

import { db } from '../services/database';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function DashboardView({ setActivePage, setPrintableLoan, setLedgerFilter }) {
  const activeLoans = db.loans.filter(l => l.branchId === db.currentBranch?.id);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const dueLoans = activeLoans.filter(l => l.status === 'Active' && l.maturityDate === todayStr);
  const overdueLoans = activeLoans.filter(l => l.status === 'Overdue');
  const upcomingLoans = activeLoans.filter(l => l.status === 'Active' && l.maturityDate > todayStr);

  // Today's Collections: Due Today + Overdue
  const todayCollectionsCount = dueLoans.length + overdueLoans.length;
  let todayCollectionsAmount = 0;
  activeLoans.forEach(l => {
    if (l.status === 'Overdue') {
      todayCollectionsAmount += (l.principal + l.interestDue + l.penalty + (l.interestDue * 0.18));
    } else if (l.status === 'Active' && l.maturityDate === todayStr) {
      todayCollectionsAmount += (l.principal + l.interestDue + (l.interestDue * 0.18));
    }
  });

  // Upcoming Payments
  const upcomingCount = upcomingLoans.length;
  const upcomingAmount = upcomingLoans.reduce((acc, l) => {
    const gst = l.interestDue * 0.18;
    return acc + (l.principal + l.interestDue + gst);
  }, 0);

  // Overdue Payments
  const overdueCount = overdueLoans.length;
  const overdueAmount = overdueLoans.reduce((acc, l) => {
    const gst = l.interestDue * 0.18;
    return acc + (l.principal + l.interestDue + l.penalty + gst);
  }, 0);

  const recentTxns = [];
  activeLoans.forEach(l => {
    const cust = db.customers.find(c => c.id === l.customerId) || { name: 'Unknown' };
    l.payments.forEach(p => {
      recentTxns.push({
        ticket: l.ticket,
        customer: cust.name,
        date: p.date,
        type: p.type,
        amount: p.totalAmount,
        mode: p.mode,
      });
    });
  });
  recentTxns.sort((a, b) => b.date.localeCompare(a.date));
  const latestTxns = recentTxns.slice(0, 5);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dashboard Summary</Typography>
          <Typography variant="caption" color="textSecondary">Branch counter operations overview, expected collections and due alerts.</Typography>
        </Box>
        <Chip label={`Today: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`} variant="outlined" sx={{ fontWeight: 'bold' }} />
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <KpiCard
            label="Today's Collections"
            value={currencyFormat(todayCollectionsAmount)}
            desc={`${todayCollectionsCount} payments pending due/overdue today`}
            icon={<RatesIcon />}
            color="#D4AF37"
            onClick={() => {
              setLedgerFilter('Today');
              setActivePage('pawn-list');
            }}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <KpiCard
            label="Upcoming Payments"
            value={currencyFormat(upcomingAmount)}
            desc={`${upcomingCount} upcoming active loan payouts`}
            icon={<ReportsIcon />}
            color="#10B981"
            onClick={() => {
              setLedgerFilter('Upcoming');
              setActivePage('pawn-list');
            }}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <KpiCard
            label="Overdue Payments"
            value={currencyFormat(overdueAmount)}
            desc={`${overdueCount} critical defaulted loans`}
            icon={<SecurityIcon />}
            color="#EF4444"
            onClick={() => {
              setLedgerFilter('Overdue');
              setActivePage('pawn-list');
            }}
          />
        </Grid>
      </Grid>

      {/* Alerts & Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Active Branch Alerts</Typography>
              <Divider sx={{ mb: 2 }} />

              {dueLoans.length === 0 && overdueLoans.length === 0 ? (
                <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', py: 3, fontWeight: 'bold' }}>
                  ✅ Branch portfolio healthy. No critical collections pending today.
                </Typography>
              ) : (
                <Box>
                  {overdueLoans.map(l => {
                    const cust = db.customers.find(c => c.id === l.customerId) || { name: 'Unknown' };
                    const totalDue = l.principal + l.interestDue + l.penalty + (l.interestDue * 0.18);
                    return (
                      <AlertItem
                        key={l.id}
                        badge={`OVERDUE (${l.daysOverdue} Days)`}
                        ticket={l.ticket}
                        name={cust.name}
                        amount={currencyFormat(totalDue)}
                        isOverdue={true}
                        onClick={() => {
                          setPrintableLoan(l);
                          setActivePage('payment-screen');
                        }}
                      />
                    );
                  })}
                  {dueLoans.map(l => {
                    const cust = db.customers.find(c => c.id === l.customerId) || { name: 'Unknown' };
                    const totalDue = l.principal + l.interestDue + (l.interestDue * 0.18);
                    return (
                      <AlertItem
                        key={l.id}
                        badge="DUE TODAY"
                        ticket={l.ticket}
                        name={cust.name}
                        amount={currencyFormat(totalDue)}
                        isOverdue={false}
                        onClick={() => {
                          setPrintableLoan(l);
                          setActivePage('payment-screen');
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Quick Access</Typography>
              <Divider sx={{ mb: 2 }} />
              <QuickActionTile title="Release Pledged Gold" icon={<SecurityIcon />} onClick={() => setActivePage('redemption-hub')} />
              <QuickActionTile title="New Pawn Ticket" icon={<DescriptionIcon />} onClick={() => setActivePage('new-pawn')} />
              <QuickActionTile title="Pawn Ledger" icon={<ListIcon />} onClick={() => setActivePage('pawn-list')} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Ledger Transactions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Recent Transactions</Typography>
          <Divider sx={{ mb: 2 }} />

          {latestTxns.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
              No transaction logs recorded today.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Ticket</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>Channel</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {latestTxns.map((t, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: 12, fontWeight: 'bold' }}>{t.ticket}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.customer}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.type}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#D4AF37', fontWeight: 'bold' }}>{currencyFormat(t.amount)}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{t.mode}</TableCell>
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

function KpiCard({ label, value, desc, icon, color, onClick }) {
  return (
    <Card 
      onClick={onClick}
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1, 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px 0 rgba(107, 31, 56, 0.08)',
          borderColor: '#C5A059', // Gilded Gold border on hover
          bgcolor: 'rgba(197, 160, 89, 0.02)'
        } : {}
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mt: 0.5, mb: 0.5 }}>{value}</Typography>
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>{desc}</Typography>
      </CardContent>
      <Box sx={{ mr: 2, p: 1.5, borderRadius: 1.5, bgcolor: `${color}1A`, border: `1px solid ${color}4D` }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Box>
    </Card>
  );
}

function AlertItem({ badge, ticket, name, amount, isOverdue, onClick }) {
  const themeCol = isOverdue ? 'error' : 'warning';
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid rgba(${isOverdue ? '239,68,68' : '245,158,11'}, 0.25)`, bgcolor: `rgba(${isOverdue ? '239,68,68' : '245,158,11'}, 0.04)`, p: 1.5, borderRadius: 1, mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip label={badge} size="small" color={themeCol} sx={{ fontWeight: 'bold', fontSize: 9 }} />
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{ticket}</Typography>
          <Typography variant="caption" color="textSecondary">{name}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color={themeCol} sx={{ fontWeight: 'bold' }}>{amount}</Typography>
        <Button variant="contained" color="primary" size="small" onClick={onClick} sx={{ height: 26, fontSize: 10, fontWeight: 'bold' }}>
          Collect
        </Button>
      </Box>
    </Box>
  );
}

function QuickActionTile({ title, icon, onClick }) {
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        border: '1px solid rgba(212,175,55,0.2)',
        bgcolor: 'rgba(0,0,0,0.2)',
        py: 1.5,
        px: 2,
        borderRadius: 1,
        mb: 1.5,
        color: 'text.primary',
        '&:hover': {
          border: '1px solid #D4AF37',
        }
      }}
    >
      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
        {React.cloneElement(icon, { sx: { color: '#D4AF37', mr: 2, fontSize: 20 } })}
        <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'left', flex: 1 }}>{title}</Typography>
        <ArrowForwardIcon sx={{ color: '#D4AF37', fontSize: 16 }} />
      </Box>
    </Button>
  );
}
