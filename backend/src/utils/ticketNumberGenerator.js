/**
 * Pawn Ticket Number Formatter & Validator Utility
 * Generates custom structured ticket numbers conforming to shopConfig.ticketConfig settings.
 */

export function generateTicketNumber(ticketConfig = {}, count = 0, branchCode = '') {
  if (!ticketConfig || ticketConfig.enabled === false) {
    return {
      isValid: false,
      error: 'Pawn Ticket Number format is disabled or not configured in Settings.'
    };
  }

  const prefix = (ticketConfig.prefix !== undefined ? ticketConfig.prefix : 'PWN').trim();
  const suffix = (ticketConfig.suffix || '').trim();
  const separator = ticketConfig.separator !== undefined ? ticketConfig.separator : '-';
  const paddingDigits = Math.max(2, Math.min(8, Number(ticketConfig.paddingDigits) || 4));
  const startSeq = Number(ticketConfig.nextSequence) || 1;
  const seqNum = startSeq + count;
  const formattedSeq = String(seqNum).padStart(paddingDigits, '0');

  const now = new Date();
  const yearFull = String(now.getFullYear());
  const yearShort = yearFull.slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const pattern = (ticketConfig.patternTemplate || '').trim();

  if (!pattern) {
    // Standard structured builder
    const parts = [];
    if (prefix) parts.push(prefix);
    if (branchCode) parts.push(branchCode);
    if (ticketConfig.yearFormat === 'YYYY') parts.push(yearFull);
    else if (ticketConfig.yearFormat === 'YY') parts.push(yearShort);
    if (ticketConfig.monthFormat === 'MM') parts.push(month);
    parts.push(formattedSeq);
    if (suffix) parts.push(suffix);

    const ticketNumber = parts.join(separator);
    return { isValid: true, ticketNumber };
  } else {
    // Template pattern replacement
    let result = pattern
      .replace(/\{PREFIX\}/gi, prefix)
      .replace(/\{SUFFIX\}/gi, suffix)
      .replace(/\{YEAR\}/gi, ticketConfig.yearFormat === 'YY' ? yearShort : yearFull)
      .replace(/\{YYYY\}/gi, yearFull)
      .replace(/\{YY\}/gi, yearShort)
      .replace(/\{MONTH\}/gi, month)
      .replace(/\{MM\}/gi, month)
      .replace(/\{BRANCH\}/gi, branchCode || '')
      .replace(/\{SEQ\}/gi, formattedSeq)
      .replace(/\{0+\}/g, (match) => String(seqNum).padStart(match.length, '0'));

    return { isValid: true, ticketNumber: result };
  }
}

export function validateTicketConfig(ticketConfig) {
  if (!ticketConfig) {
    return { isValid: false, message: 'Ticket configuration is missing in Settings.' };
  }
  if (ticketConfig.enabled === false) {
    return { isValid: false, message: 'Ticket number generation is disabled in Settings.' };
  }
  if (!ticketConfig.prefix && !ticketConfig.patternTemplate) {
    return { isValid: false, message: 'Ticket number Prefix or Pattern Template must be set in Settings.' };
  }
  return { isValid: true };
}
