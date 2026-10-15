/**
 * PawnBook Pro Advanced Interest & Overdue Penalty Calculator
 */

export function calculateLoanInterest({
  principal,
  interestScheme = 'MONTHLY_SIMPLE',
  monthlyRatePct = 2.0, // e.g. 2% per month
  annualRatePct = 24.0,
  loanDate,
  asOfDate = new Date(),
  gracePeriodDays = 7,
  penaltyMonthlyPct = 1.0,
  durationMonths = 3
}) {
  const start = new Date(loanDate);
  const current = new Date(asOfDate);
  
  // Calculate total days elapsed
  const diffTime = Math.max(0, current.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate full and fractional months
  const elapsedMonths = diffDays / 30.0;
  const standardDurationDays = durationMonths * 30;
  const isOverdue = diffDays > (standardDurationDays + gracePeriodDays);
  const overdueDays = isOverdue ? diffDays - standardDurationDays : 0;
  const overdueMonths = overdueDays / 30.0;
  
  let baseInterest = 0;
  let penaltyInterest = 0;
  
  const effectiveMonthlyRate = monthlyRatePct > 0 ? (monthlyRatePct / 100) : (annualRatePct / 1200);
  
  switch (interestScheme) {
    case 'MONTHLY_COMPOUND': {
      // A = P(1 + r)^n - P
      const compoundMonths = Math.ceil(elapsedMonths);
      baseInterest = principal * (Math.pow(1 + effectiveMonthlyRate, compoundMonths) - 1);
      break;
    }
    case 'DAILY_SLAB': {
      // Exact day calculation: P * (r_annual / 365) * days
      const dailyRate = (annualRatePct / 100) / 365.0;
      baseInterest = principal * dailyRate * diffDays;
      break;
    }
    case 'REDUCING_BALANCE':
    case 'MONTHLY_SIMPLE':
    case 'FLAT':
    default: {
      // Standard Pawn Broking practice in India: Minimum 1 month interest, or exact pro-rata
      const billedMonths = Math.max(1, elapsedMonths);
      baseInterest = principal * effectiveMonthlyRate * billedMonths;
      break;
    }
  }
  
  // Penalty calculation for overdue period
  if (isOverdue && overdueMonths > 0) {
    const penaltyRate = (penaltyMonthlyPct / 100);
    penaltyInterest = principal * penaltyRate * overdueMonths;
  }
  
  const totalDue = Math.round(principal + baseInterest + penaltyInterest);
  
  return {
    principal,
    elapsedDays: diffDays,
    elapsedMonths: Number(elapsedMonths.toFixed(2)),
    isOverdue,
    overdueDays,
    baseInterest: Math.round(baseInterest),
    penaltyInterest: Math.round(penaltyInterest),
    totalInterest: Math.round(baseInterest + penaltyInterest),
    totalPayable: totalDue
  };
}

export function calculateGoldValuation({
  grossWeight = 0,
  stoneWeight = 0,
  stoneDeductionValue = 0,
  purity = '22K',
  marketRate22K = 6850,
  marketRate24K = 7450,
  marketRate18K = 5600,
  eligibleLtvPct = 75 // RBI Cap 75%
}) {
  const netWeight = Math.max(0, grossWeight - stoneWeight);
  let effectiveRate = marketRate22K;
  
  if (purity === '24K' || purity === '999') effectiveRate = marketRate24K;
  else if (purity === '18K' || purity === '750') effectiveRate = marketRate18K;
  else if (purity === 'Silver' || purity === '925') effectiveRate = 92; // Silver rate
  
  const grossValuation = netWeight * effectiveRate;
  const netValuation = Math.max(0, grossValuation - stoneDeductionValue);
  const maxEligibleLoan = Math.floor((netValuation * (eligibleLtvPct / 100)) / 100) * 100; // Rounded to nearest ₹100
  
  return {
    grossWeight: Number(grossWeight.toFixed(3)),
    stoneWeight: Number(stoneWeight.toFixed(3)),
    netWeight: Number(netWeight.toFixed(3)),
    effectiveRate,
    netValuation: Math.round(netValuation),
    eligibleLtvPct,
    maxEligibleLoan
  };
}

export default {
  calculateLoanInterest,
  calculateGoldValuation
};
