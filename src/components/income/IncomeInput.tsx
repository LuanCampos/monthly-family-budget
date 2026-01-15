import { useEffect, useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrencyInput } from '@/lib/utils/formatters';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncomeInputProps {
  value: number;
  onEditClick?: () => void;
  disabled?: boolean;
}

export const IncomeInput = ({ value, onEditClick, disabled }: IncomeInputProps) => {
  const [displayValue, setDisplayValue] = useState('');
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    setDisplayValue(formatCurrencyInput(value));
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {currencySymbol}
        </span>
        <div className="pl-12 h-10 py-0 bg-secondary/50 border border-border text-primary !text-base font-bold text-muted-foreground rounded-md flex items-center w-36 sm:w-48">
          {displayValue}
        </div>
      </div>
      {onEditClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditClick}
          disabled={disabled}
          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar fontes de renda"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
