/**
 * Entry Form Dialog
 * 
 * Dialog for creating or editing a goal entry.
 * Controls its own internal state to avoid flash on close.
 */

import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { YearSelector } from '@/components/common';
import { Plus, Pencil, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseCurrencyInput, sanitizeCurrencyInput } from '@/lib/utils/formatters';
import type { Goal, GoalEntry } from '@/types';

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  entry: GoalEntry | null;
  onSave: (payload: { value: number; description: string; month: number; year: number }) => Promise<void>;
  saving: boolean;
  defaultMonth?: number;
  defaultYear?: number;
}

export const EntryFormDialog = ({
  open,
  onOpenChange,
  goal,
  entry,
  onSave,
  saving,
  defaultMonth,
  defaultYear,
}: EntryFormDialogProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  
  // Use app's current month/year as default, fallback to system date
  const getDefaultMonth = useCallback(() => String(defaultMonth ?? new Date().getMonth() + 1), [defaultMonth]);
  const getDefaultYear = useCallback(() => String(defaultYear ?? new Date().getFullYear()), [defaultYear]);
  
  // Internal state - all form values are controlled here
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(getDefaultMonth);
  const [year, setYear] = useState(getDefaultYear);
  const [isEditing, setIsEditing] = useState(false);

  // Sync internal open state with external open prop - only when OPENING
  useEffect(() => {
    if (open && goal) {
      // Opening the dialog - populate form
      if (entry) {
        setValue(entry.value.toFixed(2).replace('.', ','));
        setDescription(entry.description || '');
        setMonth(String(entry.month));
        setYear(String(entry.year));
        setIsEditing(true);
      } else {
        setValue('');
        setDescription('');
        setMonth(getDefaultMonth());
        setYear(getDefaultYear());
        setIsEditing(false);
      }
      setIsOpen(true);
    }
  }, [open, goal, entry, defaultMonth, defaultYear, getDefaultMonth, getDefaultYear]);

  const resetAndClose = () => {
    // Reset form and close at the same time - this prevents flash
    setValue('');
    setDescription('');
    setMonth(getDefaultMonth());
    setYear(getDefaultYear());
    setIsEditing(false);
    setIsOpen(false);
    // Notify parent that we closed
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseCurrencyInput(value);
    if (numericValue === 0 || !description.trim()) return;
    
    await onSave({ 
      value: numericValue, 
      description: description.trim(), 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    // Close after save completes
    resetAndClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetAndClose();
    }
  };

  const MONTHS = [
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
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {isEditing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {isEditing ? (t('editEntry') || 'Editar lançamento') : (t('addEntry') || 'Adicionar Lançamento')}
          </DialogTitle>
        </DialogHeader>
        <form id="entry-form" onSubmit={handleSubmit}>
          <div className="px-6 py-4 overflow-y-auto space-y-4">
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
          </div>
        </form>
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button variant="outline" onClick={resetAndClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="entry-form" disabled={saving}>
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
