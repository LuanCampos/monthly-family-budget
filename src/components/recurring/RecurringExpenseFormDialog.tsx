import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw } from 'lucide-react';
import { CategoryKey, Subcategory, RecurringExpense } from '@/types';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/lib/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecurringExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: RecurringExpense | null;
  subcategories: Subcategory[];
  defaultMonth?: number;
  defaultYear?: number;
  onAdd: (
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    dueDay?: number,
    hasInstallments?: boolean,
    totalInstallments?: number,
    startYear?: number,
    startMonth?: number
  ) => void | Promise<void>;
  onUpdate: (
    id: string,
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    dueDay?: number,
    hasInstallments?: boolean,
    totalInstallments?: number,
    startYear?: number,
    startMonth?: number,
    updatePastExpenses?: boolean
  ) => void | Promise<void>;
}

export const RecurringExpenseFormDialog = ({
  open,
  onOpenChange,
  expense,
  subcategories,
  defaultMonth,
  defaultYear,
  onAdd,
  onUpdate,
}: RecurringExpenseFormDialogProps) => {
  const { t } = useLanguage();
  
  const getDefaultMonth = () => String(defaultMonth ?? new Date().getMonth() + 1);
  const getDefaultYear = () => String(defaultYear ?? new Date().getFullYear());
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [value, setValue] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [hasInstallments, setHasInstallments] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [startYear, setStartYear] = useState(getDefaultYear);
  const [startMonth, setStartMonth] = useState(getDefaultMonth);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const isEditing = !!expense;

  useEffect(() => {
    if (open) {
      if (expense) {
        setTitle(expense.title);
        setCategory(expense.category);
        setSubcategoryId(expense.subcategoryId || '');
        setValue(formatCurrencyInput(expense.value));
        setDueDay(expense.dueDay?.toString() || '');
        setHasInstallments(expense.hasInstallments || false);
        setTotalInstallments(expense.totalInstallments?.toString() || '');
        setStartYear(expense.startYear?.toString() || '');
        setStartMonth(expense.startMonth?.toString() || '');
      } else {
        setTitle('');
        setCategory(DEFAULT_CATEGORY);
        setSubcategoryId('');
        setValue('');
        setDueDay('');
        setHasInstallments(false);
        setTotalInstallments('');
        setStartYear(String(defaultYear ?? new Date().getFullYear()));
        setStartMonth(String(defaultMonth ?? new Date().getMonth() + 1));
      }
    }
  }, [open, expense, defaultMonth, defaultYear]);

  const handleSubmit = async () => {
    if (isSaving) return;
    
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return;

    const finalSubcategoryId = subcategoryId || undefined;
    const finalDueDay = dueDay ? parseInt(dueDay) : undefined;
    const finalTotalInstallments = hasInstallments && totalInstallments ? parseInt(totalInstallments) : undefined;
    const finalStartYear = hasInstallments && startYear ? parseInt(startYear) : undefined;
    const finalStartMonth = hasInstallments && startMonth ? parseInt(startMonth) : undefined;

    if (isEditing) {
      setShowUpdateDialog(true);
    } else {
      setIsSaving(true);
      try {
        await onAdd(
          title.trim(), 
          category, 
          finalSubcategoryId, 
          numericValue,
          finalDueDay,
          hasInstallments,
          finalTotalInstallments,
          finalStartYear,
          finalStartMonth
        );
        onOpenChange(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const confirmUpdate = async (updatePast: boolean) => {
    if (!expense || isSaving) return;

    const numericValue = parseCurrencyInput(value);
    const finalSubcategoryId = subcategoryId || undefined;
    const finalDueDay = dueDay ? parseInt(dueDay) : undefined;
    const finalTotalInstallments = hasInstallments && totalInstallments ? parseInt(totalInstallments) : undefined;
    const finalStartYear = hasInstallments && startYear ? parseInt(startYear) : undefined;
    const finalStartMonth = hasInstallments && startMonth ? parseInt(startMonth) : undefined;

    setIsSaving(true);
    try {
      await onUpdate(
        expense.id,
        title.trim(),
        category,
        finalSubcategoryId,
        numericValue,
        finalDueDay,
        hasInstallments,
        finalTotalInstallments,
        finalStartYear,
        finalStartMonth,
        updatePast
      );
      setShowUpdateDialog(false);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border sm:max-w-xl flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="h-5 w-5 text-primary" />
              {isEditing ? t('editRecurringExpense') : t('newRecurringExpense')}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto">
            <RecurringExpenseFormFields
              title={title}
              category={category}
              subcategoryId={subcategoryId}
              value={value}
              dueDay={dueDay}
              hasInstallments={hasInstallments}
              totalInstallments={totalInstallments}
              startYear={startYear}
              startMonth={startMonth}
              subcategories={subcategories}
              onTitleChange={setTitle}
              onCategoryChange={setCategory}
              onSubcategoryChange={setSubcategoryId}
              onValueChange={(v) => setValue(sanitizeCurrencyInput(v))}
              onDueDayChange={setDueDay}
              onHasInstallmentsChange={setHasInstallments}
              onTotalInstallmentsChange={setTotalInstallments}
              onStartYearChange={setStartYear}
              onStartMonthChange={setStartMonth}
            />
          </div>

          <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !title.trim() || parseCurrencyInput(value) <= 0}
            >
              {isSaving ? t('saving') : isEditing ? t('save') : t('add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="h-5 w-5 text-primary" />
              {t('updateRecurringTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('updateRecurringDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUpdateDialog(false)} disabled={isSaving}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUpdate(true)}
              disabled={isSaving}
              className="bg-secondary text-foreground hover:bg-secondary/80"
            >
              {t('updateAll')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => confirmUpdate(false)}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('updateFutureOnly')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
