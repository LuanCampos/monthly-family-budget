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
  return parseFloat(value.replace(',', '.')) || 0;
};

export const formatCurrencyInput = (value: number): string => {
  return value > 0 ? value.toFixed(2).replace('.', ',') : '';
};

export const sanitizeCurrencyInput = (value: string): string => {
  return value.replace(/[^\d,]/g, '');
};
