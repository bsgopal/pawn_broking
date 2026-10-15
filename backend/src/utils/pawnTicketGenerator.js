/**
 * Thermal and A4 Pawn Ticket HTML Generator
 */

export function generatePawnTicketHtml(loan, shopConfig = {}) {
  const shopName = shopConfig.shopName || 'Sri Lakshmi Pawn Brokers';
  const address = shopConfig.address || 'Commercial Center, Main Road';
  const phone = shopConfig.mobile || shopConfig.phone || '9876543210';
  const licenseNo = shopConfig.rbiLicenseNo || 'RB/PB/2026/01';

  const itemsRows = (loan.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 4px 2px; border-bottom: 1px dashed #ccc;">${idx + 1}. ${it.ornamentType} (${it.purity})</td>
      <td style="padding: 4px 2px; border-bottom: 1px dashed #ccc; text-align: right;">${it.grossWeight}g / ${it.netWeight}g</td>
      <td style="padding: 4px 2px; border-bottom: 1px dashed #ccc; text-align: right;">₹${it.valuationAmount.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pawn Ticket - ${loan.ticketNumber}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      font-size: 13px;
      line-height: 1.3;
      margin: 0;
      padding: 10px;
      color: #000;
      max-width: 320px;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .barcode { font-size: 18px; font-weight: bold; letter-spacing: 3px; }
    @media print {
      body { width: 80mm; padding: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 16px;">${shopName}</div>
  <div class="center" style="font-size: 11px;">${address}</div>
  <div class="center" style="font-size: 11px;">Ph: ${phone} | Lic: ${licenseNo}</div>
  
  <div class="double-divider"></div>
  <div class="center bold" style="font-size: 14px;">PAWN PLEDGE RECEIPT</div>
  <div class="center barcode">*${loan.ticketNumber}*</div>
  <div class="divider"></div>
  
  <div class="row"><span class="bold">Ticket No:</span><span>${loan.ticketNumber}</span></div>
  <div class="row"><span>Date:</span><span>${new Date(loan.loanDate).toLocaleDateString('en-IN')}</span></div>
  <div class="row"><span>Maturity:</span><span>${new Date(loan.maturityDate).toLocaleDateString('en-IN')} (${loan.durationMonths} Mon)</span></div>
  <div class="divider"></div>
  
  <div class="row"><span class="bold">Customer:</span><span class="bold">${loan.customerName}</span></div>
  <div class="row"><span>Mobile:</span><span>${loan.customerMobile}</span></div>
  <div class="divider"></div>
  
  <div class="bold" style="margin-bottom: 4px;">PLEDGED ORNAMENTS:</div>
  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000;">
        <th style="text-align: left;">Item</th>
        <th style="text-align: right;">Gross/Net</th>
        <th style="text-align: right;">Valuation</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>
  
  <div class="divider"></div>
  <div class="row"><span>Total Gross Weight:</span><span class="bold">${loan.totalGrossWt} g</span></div>
  <div class="row"><span>Total Net Weight:</span><span class="bold">${loan.totalNetWt} g</span></div>
  <div class="row"><span>Appraised Market Value:</span><span>₹${loan.marketValuationTotal.toLocaleString('en-IN')}</span></div>
  <div class="row" style="font-size: 15px; margin-top: 4px;"><span class="bold">LOAN PRINCIPAL:</span><span class="bold">₹${loan.principal.toLocaleString('en-IN')}</span></div>
  <div class="row"><span>Monthly Interest Rate:</span><span>${loan.interestPctPerMonth}% / Month</span></div>
  
  <div class="divider"></div>
  <div class="row"><span>Locker / Vault:</span><span>${loan.vaultId} [Box #${loan.boxNo}]</span></div>
  <div class="row"><span>Disbursed By:</span><span>${loan.disbursedBy || 'Cashier'}</span></div>
  
  <div class="divider"></div>
  <div style="font-size: 10px; text-align: justify; margin: 4px 0;">
    * Articles pledged are insured and safely preserved in vault. Interest must be settled before maturity. In default of payment after statutory legal notices, articles are liable to be auctioned as per State Pawn Brokers Act.
  </div>
  
  <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px;">
    <div style="text-align: center; min-width: 120px;">
      ${loan.digitalSignatureUrl ? `<img src="${loan.digitalSignatureUrl}" style="max-height: 42px; max-width: 130px; display: block; margin: 0 auto 3px auto;" alt="Customer Signature" />` : '<div style="height: 35px;"></div>'}
      <div style="border-top: 1px dashed #000; padding-top: 3px;">Customer Signature</div>
    </div>
    <div style="text-align: center; min-width: 120px;">
      <div style="height: 35px;"></div>
      <div style="border-top: 1px dashed #000; padding-top: 3px;">For ${shopName}</div>
    </div>
  </div>
  <div class="divider" style="margin-top: 12px;"></div>
  <div class="center" style="font-size: 10px;">Powered by PawnBook Pro ERP</div>
</body>
</html>
  `;
}

export function generateRepaymentVoucherHtml(repayment, shopConfig = {}) {
  const shopName = shopConfig.shopName || 'Sri Lakshmi Pawn Brokers';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${repayment.receiptNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 13px; padding: 10px; max-width: 320px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 16px;">${shopName}</div>
  <div class="center bold">INTEREST / PAYMENT RECEIPT</div>
  <div class="divider"></div>
  <div class="row"><span>Receipt No:</span><span class="bold">${repayment.receiptNumber}</span></div>
  <div class="row"><span>Ticket No:</span><span class="bold">${repayment.ticketNumber}</span></div>
  <div class="row"><span>Date:</span><span>${new Date(repayment.paymentDate).toLocaleDateString('en-IN')}</span></div>
  <div class="row"><span>Customer:</span><span>${repayment.customerName}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Payment Type:</span><span class="bold">${repayment.paymentType}</span></div>
  <div class="row"><span>Principal Paid:</span><span>₹${repayment.principalPaid.toLocaleString('en-IN')}</span></div>
  <div class="row"><span>Interest Paid:</span><span>₹${repayment.interestPaid.toLocaleString('en-IN')}</span></div>
  <div class="row"><span>Penalty / Charges:</span><span>₹${repayment.penaltyPaid.toLocaleString('en-IN')}</span></div>
  <div class="divider"></div>
  <div class="row" style="font-size: 15px;"><span class="bold">TOTAL PAID:</span><span class="bold">₹${repayment.totalPaid.toLocaleString('en-IN')}</span></div>
  <div class="row"><span>Payment Mode:</span><span>${repayment.paymentMode}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Principal Balance:</span><span class="bold">₹${repayment.principalBalanceRemaining.toLocaleString('en-IN')}</span></div>
  <div class="row"><span>Received By:</span><span>${repayment.receivedBy}</span></div>
  <div class="divider" style="margin-top: 20px;"></div>
  <div class="center" style="font-size: 10px;">Thank You!</div>
</body>
</html>
  `;
}

export default {
  generatePawnTicketHtml,
  generateRepaymentVoucherHtml
};
