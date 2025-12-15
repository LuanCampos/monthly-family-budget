import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryKey, Subcategory, RecurringExpense, Expense } from '@/types/budget';
import { getCategoryByKey, DEFAULT_CATEGORY } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';
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

type ViewMode = 'list' | 'add' | 'edit';

interface RecurringExpensesProps {
  expenses: RecurringExpense[];
  subcategories: Subcategory[];
  currentMonthExpenses: Expense[];
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
  ) => void;
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
  ) => void;
  onRemove: (id: string) => void;
  onApply: (id: string) => boolean;
}

export const RecurringExpenses = ({
  expenses,
  subcategories,
  currentMonthExpenses,
  onAdd,
  onUpdate,
  onRemove,
  onApply,
}: RecurringExpensesProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [value, setValue] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [hasInstallments, setHasInstallments] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setSubcategoryId('');
    setValue('');
    setDueDay('');
    setHasInstallments(false);
    setTotalInstallments('');
    setStartYear('');
    setStartMonth('');
    setEditingId(null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setView('list');
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setView('add');
  };

  const openEdit = (exp: RecurringExpense) => {
    setTitle(exp.title);
    setCategory(exp.category);
    setSubcategoryId(exp.subcategoryId || '');
    setValue(formatCurrencyInput(exp.value));
    setDueDay(exp.dueDay?.toString() || '');
    setHasInstallments(exp.hasInstallments || false);
    setTotalInstallments(exp.totalInstallments?.toString() || '');
    setStartYear(exp.startYear?.toString() || '');
    setStartMonth(exp.startMonth?.toString() || '');
    setEditingId(exp.id);
    setView('edit');
  };

  const handleSubmit = () => {
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return;

    const finalSubcategoryId = subcategoryId || undefined;
    const finalDueDay = dueDay ? parseInt(dueDay) : undefined;
    const finalTotalInstallments = hasInstallments && totalInstallments ? parseInt(totalInstallments) : undefined;
    const finalStartYear = hasInstallments && startYear ? parseInt(startYear) : undefined;
    const finalStartMonth = hasInstallments && startMonth ? parseInt(startMonth) : undefined;

    if (view === 'add') {
      onAdd(
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
      setView('list');
      resetForm();
    }

    if (view === 'edit' && editingId !== null) {
      setShowUpdateDialog(true);
    }
  };

  const confirmUpdate = (updatePast: boolean) => {
    if (!editingId) return;

    const numericValue = parseCurrencyInput(value);
    const finalSubcategoryId = subcategoryId || undefined;
    const finalDueDay = dueDay ? parseInt(dueDay) : undefined;
    const finalTotalInstallments = hasInstallments && totalInstallments ? parseInt(totalInstallments) : undefined;
    const finalStartYear = hasInstallments && startYear ? parseInt(startYear) : undefined;
    const finalStartMonth = hasInstallments && startMonth ? parseInt(startMonth) : undefined;

    onUpdate(
      editingId,
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
    setView('list');
    resetForm();
  };

  const getSubcategoryName = (subId?: string) => {
    if (!subId) return null;
    const sub = subcategories.find((s) => s.id === subId);
    return sub?.name || null;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-border hover:bg-secondary text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden xs:inline">{t('recurringExpenses')}</span>
        <span className="xs:hidden">Rec.</span>
        <span className="ml-1">({expenses.length})</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsOpen(true);
        }}
      >
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {view === 'list'
                ? t('recurringExpenses')
                : view === 'add'
                ? t('newRecurringExpense')
                : t('editRecurringExpense')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 pr-4">
            {view === 'list' && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('recurringExpensesDescription')}
                </p>

                <div className="space-y-4 mt-3 pt-2">
                  {expenses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('noRecurringExpenses')}
                    </p>
                  ) : (
                    expenses.map((exp) => {
                      const cat = getCategoryByKey(exp.category);
                      const subName = getSubcategoryName(exp.subcategoryId);
                      const isInCurrentMonth = currentMonthExpenses.some(
                        e => e.recurringExpenseId === exp.id
                      );

                      const handleApply = () => {
                        const success = onApply(exp.id);
                        if (success) {
                          toast.success(t('applyToCurrentMonth'));
                        } else {
                          toast.info(t('alreadyInCurrentMonth'));
                        }
                      };

                      return (
                        <div
                          key={exp.id}
                          className="flex items-start justify-between p-4 bg-secondary rounded-lg gap-3"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-foreground font-medium">
                                  {exp.title}
                                </p>
                                {exp.hasInstallments && exp.totalInstallments && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                    {exp.totalInstallments}x
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                <span>{t(cat.name as TranslationKey)}</span>
                                {subName && <span>• {subName}</span>}
                                {exp.dueDay && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {t('day')} {exp.dueDay}
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground font-medium mt-2 sm:hidden">
                                {formatCurrency(exp.value)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <span className="text-foreground font-medium hidden sm:block">
                              {formatCurrency(exp.value)}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleApply}
                              disabled={isInCurrentMonth}
                              title={isInCurrentMonth ? t('alreadyInCurrentMonth') : t('applyToCurrentMonth')}
                              className={`h-8 w-8 ${
                                isInCurrentMonth 
                                  ? 'text-muted-foreground/40 cursor-not-allowed' 
                                  : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(exp)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemove(exp.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {(view === 'add' || view === 'edit') && (
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
            )}
          </div>

          {(view === 'add' || view === 'edit') && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {view === 'add' ? t('add') : t('save')}
              </Button>
              <Button variant="outline" onClick={() => setView('list')}>
                {t('cancel')}
              </Button>
            </div>
          )}

          {view === 'list' && (
            <Button
              onClick={openAdd}
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addRecurringExpense')}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('updateRecurringTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('updateRecurringDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowUpdateDialog(false)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUpdate(false)}
              className="bg-secondary text-foreground hover:bg-secondary/80"
            >
              {t('updateFutureOnly')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => confirmUpdate(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('updateAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
