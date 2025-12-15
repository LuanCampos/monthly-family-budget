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
    <div className="flex items-center gap-2 sm:gap-4">
      <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">{t('monthlyIncome')}</span>
        <span className="xs:hidden">Renda</span>
      </label>
      
      <div className="relative flex-1 max-w-[160px] sm:max-w-xs">
        <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
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
          className="pl-8 sm:pl-10 h-9 sm:h-10 py-0 bg-secondary/50 border-border text-primary text-sm sm:text-base font-bold placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};