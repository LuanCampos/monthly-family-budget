/**
 * Goal Form Dialog
 * 
 * Dialog for creating or editing a goal.
 * Controls its own internal state to avoid flash on close.
 */

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YearSelector } from '@/components/common';
import { Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/lib/utils/formatters';
import type { Goal, GoalStatus, Subcategory } from '@/types';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  subcategories: Subcategory[];
  onSave: (data: {
    name: string;
    targetValue: number;
    targetMonth?: number;
    targetYear?: number;
    currentValue?: number;
    targetDate?: string;
    account?: string;
    linkedSubcategoryId?: string;
    linkedCategoryKey?: string;
    status?: GoalStatus;
  }) => Promise<void>;
  saving: boolean;
}

// ID especial apenas para UI (não é enviado ao backend)
const LIBERDADE_UI_ID = '__category_liberdade__';

export const GoalFormDialog = ({
  open,
  onOpenChange,
  goal,
  subcategories,
  onSave,
  saving,
}: GoalFormDialogProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();

  // Internal state - all form values controlled here
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetMonth, setTargetMonth] = useState<number | undefined>(undefined);
  const [targetYear, setTargetYear] = useState<number | undefined>(undefined);
  const [account, setAccount] = useState('');
  const [linkedSubcategoryId, setLinkedSubcategoryId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<GoalStatus>('active');
  const [isEditing, setIsEditing] = useState(false);

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

  // Sync internal open state with external open prop - only when OPENING
  useEffect(() => {
    if (open) {
      // Opening the dialog - populate form
      if (goal) {
        setName(goal.name ?? '');
        setTargetValue(goal.targetValue ? formatCurrencyInput(goal.targetValue) : '');
        setTargetMonth(goal.targetMonth);
        setTargetYear(goal.targetYear);
        setAccount(goal.account ?? '');
        setLinkedSubcategoryId(
          goal.linkedCategoryKey === 'liberdade' ? LIBERDADE_UI_ID : goal.linkedSubcategoryId
        );
        setStatus(goal.status ?? 'active');
        setIsEditing(true);
      } else {
        setName('');
        setTargetValue('');
        setTargetMonth(undefined);
        setTargetYear(undefined);
        setAccount('');
        setLinkedSubcategoryId(undefined);
        setStatus('active');
        setIsEditing(false);
      }
      setIsOpen(true);
    }
  }, [open, goal]);

  const resetAndClose = () => {
    // Reset form and close at the same time - this prevents flash
    setName('');
    setTargetValue('');
    setTargetMonth(undefined);
    setTargetYear(undefined);
    setAccount('');
    setLinkedSubcategoryId(undefined);
    setStatus('active');
    setIsEditing(false);
    setIsOpen(false);
    // Notify parent that we closed
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericValue = parseCurrencyInput(targetValue);
    if (!name.trim() || numericValue <= 0) return;

    // Se selecionou a pseudo-subcategoria Liberdade, enviar linkedCategoryKey
    const isLiberdade = linkedSubcategoryId === LIBERDADE_UI_ID;

    await onSave({ 
      name: name.trim(), 
      targetValue: numericValue, 
      targetMonth,
      targetYear,
      account: account || undefined,
      linkedSubcategoryId: isLiberdade ? undefined : linkedSubcategoryId,
      linkedCategoryKey: isLiberdade ? 'liberdade' : undefined,
      status,
    });

    // Close after save completes
    resetAndClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetAndClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-primary" />
            {isEditing ? (t('editGoal') || 'Editar Meta') : (t('addGoal') || 'Nova Meta')}
          </DialogTitle>
        </DialogHeader>
        <form id="goal-form" onSubmit={handleSubmit}>
          <div className="px-6 py-4 overflow-y-auto space-y-4">
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
              <Label className="text-sm font-medium">
                {t('goalStatus') || 'Status'}
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                <SelectTrigger className="h-10 bg-secondary/50 border-border">
                  <SelectValue placeholder={t('goalStatus')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">{t('goalStatusActive') || 'Ativa'}</SelectItem>
                  <SelectItem value="archived">{t('goalStatusArchived') || 'Concluída/Inativa'}</SelectItem>
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
                  value={targetYear ? targetYear.toString() : '__EMPTY__'}
                  onValueChange={(v) => setTargetYear(v && v !== '__EMPTY__' ? Number(v) : undefined)}
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
          </div>
        </form>
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button variant="outline" onClick={resetAndClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="goal-form" disabled={saving}>
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
