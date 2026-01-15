import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { YearSelector } from '@/components/ui/year-selector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import { DollarSign, Calendar } from 'lucide-react';

interface EntryFormProps {
  formId?: string;
  onSubmit: (data: { value: number; description: string; month: number; year: number }) => Promise<void> | void;
  submitting?: boolean;
  initial?: { value: number; description: string; month: number; year: number } | null;
}

export const EntryForm = ({ formId, onSubmit, submitting, initial }: EntryFormProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [defaultMonth] = useState(() => String(new Date().getMonth() + 1));
  const [defaultYear] = useState(() => String(new Date().getFullYear()));
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  useEffect(() => {
    if (initial) {
      setValue(initial.value.toFixed(2).replace('.', ','));
      setDescription(initial.description || '');
      setMonth(String(initial.month));
      setYear(String(initial.year));
      return;
    }

    // reset to defaults when closing or switching back to create mode
    setValue('');
    setDescription('');
    setMonth(defaultMonth);
    setYear(defaultYear);
  }, [initial, defaultMonth, defaultYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseCurrencyInput(value);
    if (numericValue === 0 || !description.trim()) return;
    await onSubmit({ 
      value: numericValue, 
      description: description.trim(), 
      month: parseInt(month), 
      year: parseInt(year) 
    });
  };

  const MONTHS = useMemo(
    () => [
      { value: '1', label: t('month-0') },
      { value: '2', label: t('month-1') },
      { value: '3', label: t('month-2') },
      { value: '4', label: t('month-3') },
      { value: '5', label: t('month-4') },
      { value: '6', label: t('month-5') },
      { value: '7', label: t('month-6') },
      { value: '8', label: t('month-7') },
      { value: '9', label: t('month-8') },
      { value: '10', label: t('month-9') },
      { value: '11', label: t('month-10') },
      { value: '12', label: t('month-11') },
    ],
    [t]
  );

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="entryValue" className="text-sm font-medium flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" />
          {t('entryValue') || 'Valor'}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {currencySymbol}
          </span>
          <Input 
            id="entryValue"
            type="text"
            inputMode="decimal"
            value={value} 
            onChange={(e) => setValue(sanitizeCurrencyInput(e.target.value))} 
            placeholder="0,00"
            required
            className="h-10 pl-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entryDescription" className="text-sm font-medium">
          {t('entryDescription') || 'Descrição'}
        </Label>
        <Input 
          id="entryDescription"
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder={t('entryDescriptionPlaceholder') || 'Descreva o lançamento'} 
          required
          className="h-10 bg-secondary/50 border-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {t('entryMonth') || 'Mês'}
          </Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-10 bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('entryYear') || 'Ano'}
          </Label>
          <YearSelector
            value={year}
            onValueChange={setYear}
            className="h-10 bg-secondary/50 border-border"
          />
        </div>
      </div>
    </form>
  );
};
