import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { IncomeSource } from '@/types/budget';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/lib/utils/formatters';

interface IncomeSourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSource?: IncomeSource | null;
  onSave: (name: string, value: number) => void | Promise<void>;
}

export const IncomeSourceFormDialog = ({
  open,
  onOpenChange,
  incomeSource,
  onSave,
}: IncomeSourceFormDialogProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!incomeSource;

  useEffect(() => {
    if (open) {
      if (incomeSource) {
        setName(incomeSource.name);
        setValue(formatCurrencyInput(incomeSource.value));
      } else {
        setName('');
        setValue('');
      }
    }
  }, [open, incomeSource]);

  const handleValueChange = (val: string) => {
    const sanitized = sanitizeCurrencyInput(val.replace(/\./g, ','));
    const [integerPart, decimalPart] = sanitized.split(',');
    if (decimalPart === undefined) {
      setValue(integerPart);
    } else {
      setValue(`${integerPart},${decimalPart.slice(0, 2)}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    
    const numericValue = parseCurrencyInput(value);
    if (numericValue <= 0) return;

    setIsSaving(true);
    try {
      await onSave(name.trim(), numericValue);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim() && parseCurrencyInput(value) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-primary" />
            {isEditing ? t('editIncomeSource') : t('addIncomeSource')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="income-source-name" className="text-sm font-medium">
                {t('name')}
              </Label>
              <Input
                id="income-source-name"
                placeholder={t('incomeSourceNamePlaceholder') || 'Ex: Salário, Freelance...'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-secondary/50 border-border"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValid) handleSave();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="income-source-value" className="text-sm font-medium">
                {t('value')}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  id="income-source-value"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="pl-8 h-10 bg-secondary/50 border-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValid) handleSave();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
