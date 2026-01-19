export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const parseCurrencyInput = (value: string): number => {
  const parsed = parseFloat(value.replace(',', '.'));
  // Security: Reject Infinity, -Infinity, and NaN
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
};

export const formatCurrencyInput = (value: number): string => {
  return value > 0 ? value.toFixed(2).replace('.', ',') : '';
};

export const sanitizeCurrencyInput = (value: string): string => {
  // Allow digits, comma, and minus sign at the start
  const cleaned = value.replace(/[^\d,-]/g, '');
  // Ensure minus only appears at the start
  const firstMinus = cleaned.indexOf('-');
  if (firstMinus === -1) return cleaned;
  return '-' + cleaned.replace(/-/g, '');
};
