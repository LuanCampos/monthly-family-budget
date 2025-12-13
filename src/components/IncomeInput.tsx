import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/types/budget';

interface IncomeInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const IncomeInput = ({ value, onChange, disabled }: IncomeInputProps) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (value > 0) {
      setInputValue(value.toFixed(2).replace('.', ','));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, '');
    setInputValue(raw);
  };

  const handleBlur = () => {
    const numericValue = parseFloat(inputValue.replace(',', '.')) || 0;
    onChange(numericValue);
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm text-primary mb-1 font-medium">Renda do mês</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0,00"
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};
