export function calculateInterestClientSide({
  principal = 0,
  interestScheme = 'MONTHLY_SIMPLE',
  monthlyRatePct = 2.0,
  annualRatePct = 24.0,
  loanDate,
  asOfDate = new Date(),
  gracePeriodDays = 7,
  penaltyMonthlyPct = 1.0,
  durationMonths = 3
}) {
  const p = Number(principal) || 0;
  if (p <= 0) return { principal: 0, totalInterest: 0, totalPayable: 0, overdueDays: 0, isOverdue: false };

  const start = new Date(loanDate || new Date());
  const current = new Date(asOfDate);
  const diffTime = Math.max(0, current.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const elapsedMonths = diffDays / 30.0;
  const standardDurationDays = durationMonths * 30;
  const isOverdue = diffDays > (standardDurationDays + gracePeriodDays);
  const overdueDays = isOverdue ? diffDays - standardDurationDays : 0;
  const overdueMonths = overdueDays / 30.0;
  
  const effectiveMonthlyRate = monthlyRatePct > 0 ? (monthlyRatePct / 100) : (annualRatePct / 1200);
  let baseInterest = 0;
  let penaltyInterest = 0;

  switch (interestScheme) {
    case 'MONTHLY_COMPOUND': {
      const compoundMonths = Math.ceil(elapsedMonths);
      baseInterest = p * (Math.pow(1 + effectiveMonthlyRate, compoundMonths) - 1);
      break;
    }
    case 'DAILY_SLAB': {
      const dailyRate = (annualRatePct / 100) / 365.0;
      baseInterest = p * dailyRate * diffDays;
      break;
    }
    case 'REDUCING_BALANCE':
    case 'MONTHLY_SIMPLE':
    default: {
      const billedMonths = Math.max(1, elapsedMonths);
      baseInterest = p * effectiveMonthlyRate * billedMonths;
      break;
    }
  }

  if (isOverdue && overdueMonths > 0) {
    penaltyInterest = p * (penaltyMonthlyPct / 100) * overdueMonths;
  }

  return {
    principal: p,
    elapsedDays: diffDays,
    elapsedMonths: Number(elapsedMonths.toFixed(2)),
    isOverdue,
    overdueDays,
    baseInterest: Math.round(baseInterest),
    penaltyInterest: Math.round(penaltyInterest),
    totalInterest: Math.round(baseInterest + penaltyInterest),
    totalPayable: Math.round(p + baseInterest + penaltyInterest)
  };
}

export default {
  calculateInterestClientSide
};
