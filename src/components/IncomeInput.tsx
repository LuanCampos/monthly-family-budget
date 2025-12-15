import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput, formatCurrency } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { DollarSign } from 'lucide-react';

interface IncomeInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const IncomeInput = ({ value, onChange, disabled }: IncomeInputProps) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(formatCurrencyInput(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(sanitizeCurrencyInput(e.target.value));
  };

  const handleBlur = () => {
    onChange(parseCurrencyInput(inputValue));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
        <DollarSign className="h-4 w-4" />
        {t('monthlyIncome')}
      </label>
      
      <div className="relative flex-1 max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0,00"
          className="pl-10 h-14 bg-secondary/50 border-border text-primary text-2xl font-bold placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};