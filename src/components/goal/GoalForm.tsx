import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YearSelector } from '@/components/ui/year-selector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import type { Goal, Subcategory } from '@/types';

interface GoalFormProps {
  initial?: Partial<Goal>;
  subcategories: Subcategory[];
  onSubmit: (data: { 
    name: string; 
    targetValue: number; 
    targetMonth?: number; 
    targetYear?: number; 
    account?: string; 
    linkedSubcategoryId?: string;
    linkedCategoryKey?: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

// ID especial apenas para UI (não é enviado ao backend)
const LIBERDADE_UI_ID = '__category_liberdade__';

export const GoalForm = ({ initial, subcategories, onSubmit, onCancel, submitting }: GoalFormProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [name, setName] = useState(initial?.name ?? '');
  const [targetValue, setTargetValue] = useState(
    initial?.targetValue ? formatCurrencyInput(initial.targetValue) : ''
  );
  const [targetMonth, setTargetMonth] = useState<number | undefined>(initial?.targetMonth);
  const [targetYear, setTargetYear] = useState<number | undefined>(initial?.targetYear);
  const [account, setAccount] = useState(initial?.account ?? '');
  const [linkedSubcategoryId, setLinkedSubcategoryId] = useState<string | undefined>(
    initial?.linkedCategoryKey === 'liberdade' ? LIBERDADE_UI_ID : initial?.linkedSubcategoryId
  );

  const monthOptions = useMemo(
    () => [
      { value: 1, label: t('month-0') },
      { value: 2, label: t('month-1') },
      { value: 3, label: t('month-2') },
      { value: 4, label: t('month-3') },
      { value: 5, label: t('month-4') },
      { value: 6, label: t('month-5') },
      { value: 7, label: t('month-6') },
      { value: 8, label: t('month-7') },
      { value: 9, label: t('month-8') },
      { value: 10, label: t('month-9') },
      { value: 11, label: t('month-10') },
      { value: 12, label: t('month-11') },
    ],
    [t]
  );

  // Filtrar subcategorias de 'metas' e adicionar pseudo-subcategoria 'Liberdade Financeira'
  const metasSubcategories = subcategories.filter(sub => sub.categoryKey === 'metas');
  const allOptions = [
    { id: LIBERDADE_UI_ID, name: t('liberdade') || 'Liberdade Financeira', categoryKey: 'liberdade' as const },
    ...metasSubcategories,
  ];

  useEffect(() => {
    setName(initial?.name ?? '');
    setTargetValue(initial?.targetValue ? formatCurrencyInput(initial.targetValue) : '');
    setTargetMonth(initial?.targetMonth);
    setTargetYear(initial?.targetYear);
    setAccount(initial?.account ?? '');
    setLinkedSubcategoryId(
      initial?.linkedCategoryKey === 'liberdade' ? LIBERDADE_UI_ID : initial?.linkedSubcategoryId
    );
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericValue = parseCurrencyInput(targetValue);
    if (!name.trim() || numericValue <= 0) return;

    // Se selecionou a pseudo-subcategoria Liberdade, enviar linkedCategoryKey
    const isLiberdade = linkedSubcategoryId === LIBERDADE_UI_ID;

    await onSubmit({ 
      name: name.trim(), 
      targetValue: numericValue, 
      targetMonth,
      targetYear,
      account: account || undefined,
      linkedSubcategoryId: isLiberdade ? undefined : linkedSubcategoryId,
      linkedCategoryKey: isLiberdade ? 'liberdade' : undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="goalName" className="text-sm font-medium">
          {t('goalName')}
        </Label>
        <Input 
          id="goalName"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder={t('goalNamePlaceholder')} 
          required 
          className="h-10 bg-secondary/50 border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t('linkedSubcategory')}
        </Label>
        <Select
          value={linkedSubcategoryId || 'none'}
          onValueChange={(v) => setLinkedSubcategoryId(v === 'none' ? undefined : v)}
        >
          <SelectTrigger className="h-10 bg-secondary/50 border-border">
            <SelectValue placeholder={t('selectSubcategory')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="none">-</SelectItem>
            {allOptions.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetValue" className="text-sm font-medium">
          {t('targetValue')}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {currencySymbol}
          </span>
          <Input
            id="targetValue"
            type="text"
            inputMode="decimal"
            value={targetValue}
            onChange={(e) => setTargetValue(sanitizeCurrencyInput(e.target.value))}
            placeholder={t('targetValuePlaceholder')}
            required
            className="h-10 pl-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('targetMonthOptional')}
          </Label>
          <Select
            value={targetMonth?.toString() || 'none'}
            onValueChange={(v) => setTargetMonth(v === 'none' ? undefined : Number(v))}
          >
            <SelectTrigger className="h-10 bg-secondary/50 border-border">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="none">-</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('targetYearOptional')}
          </Label>
          <YearSelector
            value={targetYear ? targetYear.toString() : ''}
            onValueChange={(v) => setTargetYear(v ? Number(v) : undefined)}
            allowEmpty
            emptyLabel="-"
            placeholder="-"
            className="h-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account" className="text-sm font-medium">
          {t('account')}
        </Label>
        <Input 
          id="account"
          value={account} 
          onChange={(e) => setAccount(e.target.value)} 
          placeholder={t('accountPlaceholder')} 
          className="h-10 bg-secondary/50 border-border"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
};
