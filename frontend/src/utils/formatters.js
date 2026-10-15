export function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return '₹' + val.toLocaleString('en-IN');
}

export function formatWeight(weight) {
  const val = Number(weight) || 0;
  return val.toFixed(3) + ' g';
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

export default {
  formatCurrency,
  formatWeight,
  formatDate,
  formatDateTime
};
