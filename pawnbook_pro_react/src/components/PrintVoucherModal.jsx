import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Button
} from '@mui/material';

import { db } from '../services/database';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';

const currencyFormat = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default function PrintVoucherModal({ loan, payment, onClose }) {
  const cust = db.customers.find(c => c.id === loan.customerId) || { name: 'Unknown Client', mobile: '-' };

  const handleWhatsAppShare = () => {
    let msg = `*${db.settings.shopName}*\n`;
    if (payment === null) {
      msg += `*GOLD PAWN TICKET CONFIRMATION*\n\n`;
      msg += `Dear *${cust.name}*,\n`;
      msg += `Your gold loan ticket has been created successfully.\n\n`;
      msg += `- Ticket No: *${loan.ticket}*\n`;
      msg += `- Net Wt: *${loan.totalNetWt.toFixed(2)} gm*\n`;
      msg += `- Collateral Value: *${currencyFormat(loan.collateralValue)}*\n`;
      msg += `- Disbursed Principal: *${currencyFormat(loan.principal)}*\n\n`;
      msg += `Thank you for choosing us.`;
    } else {
      msg += `*REPAYMENT TRANSACTION RECEIPT*\n\n`;
      msg += `Dear *${cust.name}*,\n`;
      msg += `We have received your payment successfully.\n\n`;
      msg += `- Ticket No: *${loan.ticket}*\n`;
      msg += `- Receipt Date: *${payment.date}*\n`;
      msg += `- Settlement Scope: *${payment.type}*\n`;
      msg += `- Total Paid: *${currencyFormat(payment.totalAmount)}*\n`;
      
      const splitsText = payment.splits?.map(s => `${s.mode}: ${currencyFormat(s.amount)}`).join(', ');
      if (splitsText) {
        msg += `- Split Breakdown: *${splitsText}*\n`;
      }
      
      msg += `- Reference No: *${payment.refNo}*\n\n`;
      msg += `*Allocations:*\n`;
      msg += `- Interest: ${currencyFormat(payment.interest)}\n`;
      msg += `- CGST/SGST (18%): ${currencyFormat(payment.gst)}\n`;
      msg += `- Penalty: ${currencyFormat(payment.penalty)}\n`;
      msg += `- Principal Reduced: ${currencyFormat(payment.principal)}\n\n`;
      msg += `Remaining Principal Balance: *${currencyFormat(loan.principal)}*\n\n`;
      msg += `Thank you for your payment.`;
    }

    const waUrl = `https://wa.me/91${cust.mobile}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    let contentsHtml = '';
    if (payment === null) {
      contentsHtml = `
        <div class="row"><span class="label">Asset Category:</span><span class="value">${loan.ornaments[0]?.type || 'Ornament'}</span></div>
        <div class="row"><span class="label">Net Valuation Wt:</span><span class="value">${loan.totalNetWt.toFixed(2)} gm</span></div>
        <div class="row"><span class="label">Collateral Worth:</span><span class="value">${currencyFormat(loan.collateralValue)}</span></div>
        <div class="divider" style="border-top: 1px dashed #8A8A8A; margin: 10px 0;"></div>
        <div class="row bold"><span class="label">Disbursed Principal:</span><span class="value">${currencyFormat(loan.principal)}</span></div>
        <div class="row"><span class="label">Vault storage box:</span><span class="value">${loan.vaultRef || 'Branch Locker'}</span></div>
      `;
    } else {
      contentsHtml = `
        <div class="row bold"><span class="label">Repayment Action:</span><span class="value">${payment.type}</span></div>
        <div class="row"><span class="label">Principal Paid:</span><span class="value">${currencyFormat(payment.principal)}</span></div>
        <div class="row"><span class="label">Interest Collected:</span><span class="value">${currencyFormat(payment.interest)}</span></div>
        <div class="row"><span class="label">CGST/SGST Tax (18%):</span><span class="value">${currencyFormat(payment.gst)}</span></div>
        <div class="row"><span class="label">Overdue Penalty Clear:</span><span class="value">${currencyFormat(payment.penalty)}</span></div>
        <div class="divider" style="border-top: 1px dashed #8A8A8A; margin: 10px 0;"></div>
        <div class="row bold"><span class="label">Net Cash Collected:</span><span class="value">${currencyFormat(payment.totalAmount)}</span></div>
        <div class="row"><span class="label">Remaining Principal:</span><span class="value">${currencyFormat(loan.principal)}</span></div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>${payment === null ? 'Pawn Ticket' : 'Repayment Receipt'}</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              width: 320px;
              color: #000;
              background-color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .shop-name {
              font-weight: bold;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .shop-meta {
              font-size: 10px;
              color: #4A4A4A;
              margin-top: 2px;
              line-height: 1.3;
            }
            .badge-container {
              margin: 12px 0;
            }
            .badge {
              border: 1.5px solid #000000;
              display: inline-block;
              padding: 4px 10px;
              font-size: 11px;
              font-weight: bold;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 12px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 6px;
            }
            .label {
              color: #4A4A4A;
            }
            .value {
              font-weight: normal;
              text-align: right;
            }
            .bold {
              font-weight: bold;
            }
            .bold .value {
              font-weight: bold;
            }
            .footer-meta {
              font-size: 9px;
              color: #4A4A4A;
              text-align: center;
              line-height: 1.4;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${db.settings.shopName}</div>
            <div class="shop-meta">
              ${db.settings.address}<br/>
              LIC: ${db.settings.rbiLicenseNo} | GSTIN: ${db.settings.gstinNo}
            </div>
            <div class="badge-container">
              <div class="badge">${payment === null ? 'GOLD LOAN TICKET' : 'REPAYMENT RECEIPT'}</div>
            </div>
          </div>
          <div class="divider"></div>
          
          <div class="row"><span class="label">Ticket Number:</span><span class="value bold">${loan.ticket}</span></div>
          <div class="row"><span class="label">Client Name:</span><span class="value">${cust.name}</span></div>
          <div class="row"><span class="label">Contact Phone:</span><span class="value">${cust.mobile}</span></div>
          
          <div class="divider" style="border-top: 1px dashed #000;"></div>
          
          ${contentsHtml}
          
          <div class="divider"></div>
          
          <div class="footer-meta">
            Assayed and locked securely under safe branch custody.<br/>
            Rates capped under RBI 24% p.a. guidelines.
          </div>
          
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
    db.logAuditEvent('Pawn Ticket Printed', `Generated thermal print slip for ticket ${loan.ticket}`);
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} PaperProps={{ sx: { width: '100%', maxWidth: 440, bgcolor: '#FFFFFF', color: '#000000', p: 1 } }}>
      <DialogContent sx={{ p: 4, fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="subtitle1" sx={{ color: '#000000', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }}>
            {db.settings.shopName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#4A4A4A', display: 'block', fontSize: 10 }}>
            {db.settings.address}
          </Typography>
          <Typography variant="caption" sx={{ color: '#4A4A4A', display: 'block', fontSize: 9 }}>
            LIC: {db.settings.rbiLicenseNo} | GSTIN: {db.settings.gstinNo}
          </Typography>
          <Box sx={{ border: '1.5px solid #000000', display: 'inline-block', px: 1.5, py: 0.5, mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#000000', fontSize: 10 }}>
              {payment === null ? 'GOLD LOAN TICKET' : 'REPAYMENT RECEIPT'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#000000', mb: 3 }} />

        <ReceiptRow label="Ticket Number:" value={loan.ticket} />
        <ReceiptRow label="Client Name:" value={cust.name} />
        <ReceiptRow label="Contact Phone:" value={cust.mobile} />

        {payment === null ? (
          <Box>
            <ReceiptRow label="Asset Category:" value={loan.ornaments[0]?.type || 'Ornament'} />
            <ReceiptRow label="Net Valuation Wt:" value={`${loan.totalNetWt.toFixed(2)} gm`} />
            <ReceiptRow label="Collateral Worth:" value={currencyFormat(loan.collateralValue)} />
            <Divider sx={{ borderColor: '#8A8A8A', my: 1.5 }} />
            <ReceiptRow label="Disbursed Principal:" value={currencyFormat(loan.principal)} isBold />
            <ReceiptRow label="Vault storage box:" value={loan.vaultRef} />
          </Box>
        ) : (
          <Box>
            <ReceiptRow label="Repayment Action:" value={payment.type} isBold />
            <ReceiptRow label="Principal Paid:" value={currencyFormat(payment.principal)} />
            <ReceiptRow label="Interest Collected:" value={currencyFormat(payment.interest)} />
            <ReceiptRow label="CGST/SGST Tax (18%):" value={currencyFormat(payment.gst)} />
            <ReceiptRow label="Overdue Penalty Clear:" value={currencyFormat(payment.penalty)} />
            <Divider sx={{ borderColor: '#8A8A8A', my: 1.5 }} />
            <ReceiptRow label="Net Cash Collected:" value={currencyFormat(payment.totalAmount)} isBold />
            <ReceiptRow label="Remaining Principal:" value={currencyFormat(loan.principal)} />
          </Box>
        )}

        <Divider sx={{ borderColor: '#000000', mt: 3, mb: 1.5 }} />

        <Typography variant="caption" sx={{ color: '#4A4A4A', display: 'block', textAlign: 'center', fontSize: 9, lineHeight: 1.4 }}>
          Assayed and locked securely under safe branch custody.<br />
          Rates capped under RBI 24% p.a. guidelines.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderColor: '#000000', color: '#000000', mr: 'auto' }}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={handleWhatsAppShare}
          sx={{ bgcolor: '#25D366', color: '#FFFFFF', '&:hover': { bgcolor: '#1ebe57' } }}
        >
          WhatsApp Share
        </Button>
        <Button variant="contained" onClick={handlePrint} sx={{ bgcolor: '#000000', color: '#FFFFFF', '&:hover': { bgcolor: '#222222' } }}>
          Print Voucher
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReceiptRow({ label, value, isBold = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="caption" sx={{ color: '#4A4A4A', fontSize: 11 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: isBold ? 'bold' : 'normal', color: '#000000', fontSize: 11 }}>{value}</Typography>
    </Box>
  );
}
