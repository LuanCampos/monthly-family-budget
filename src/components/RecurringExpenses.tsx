import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil, Calendar, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CategoryKey, Subcategory, RecurringExpense, Expense } from '@/types/budget';
import { getCategoryByKey, DEFAULT_CATEGORY, CATEGORIES } from '@/constants/categories';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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

type SortType = 'category' | 'value' | 'dueDate';
type SortDirection = 'asc' | 'desc';

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
  onRemove: (id: string) => void | Promise<void>;
  onApply: (id: string) => boolean | Promise<boolean>;
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
  const { formatCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [sortType, setSortType] = useState<SortType>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (type: SortType) => {
    if (sortType !== type) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    let result = 0;
    
    if (sortType === 'category') {
      const catIndexA = CATEGORIES.findIndex(c => c.key === a.category);
      const catIndexB = CATEGORIES.findIndex(c => c.key === b.category);
      result = catIndexA - catIndexB;
      
      if (result === 0) {
        const subA = subcategories.find(s => s.id === a.subcategoryId)?.name ?? 'ZZZ';
        const subB = subcategories.find(s => s.id === b.subcategoryId)?.name ?? 'ZZZ';
        result = subA.localeCompare(subB);
      }
      
      if (result === 0) {
        result = a.title.localeCompare(b.title);
      }
    } else if (sortType === 'value') {
      result = a.value - b.value;
    } else if (sortType === 'dueDate') {
      const dueDayA = a.dueDay ?? 31;
      const dueDayB = b.dueDay ?? 31;
      result = dueDayA - dueDayB;
    }
    
    return sortDirection === 'asc' ? result : -result;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onRemove(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-border hover:bg-secondary text-xs h-8 px-2 xs:px-2.5 sm:h-9 sm:px-3 sm:text-sm"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="h-3.5 w-3.5 xs:mr-1.5" />
        <span className="hidden xs:inline">{t('recurringExpenses')}</span>
        <span className="hidden xs:inline ml-1 text-muted-foreground">({expenses.length})</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsOpen(true);
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle>
              {view === 'list'
                ? t('recurringExpenses')
                : view === 'add'
                ? t('newRecurringExpense')
                : t('editRecurringExpense')}
            </DialogTitle>
            {view === 'list' && (
              <DialogDescription className="text-sm text-muted-foreground">
                {t('recurringExpensesDescription')}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {view === 'list' && (
              <div className="space-y-3">
                {expenses.length > 0 && (
                  <div className="flex items-center gap-1 pb-2 border-b border-border">
                    <span className="text-xs text-muted-foreground mr-2">{t('sortBy')}:</span>
                    <Button
                      variant={sortType === 'category' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('category')}
                      className="h-7 text-xs gap-1"
                    >
                      {t('sortCategory')}
                      {getSortIcon('category')}
                    </Button>
                    <Button
                      variant={sortType === 'value' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('value')}
                      className="h-7 text-xs gap-1"
                    >
                      {t('sortValue')}
                      {getSortIcon('value')}
                    </Button>
                    <Button
                      variant={sortType === 'dueDate' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('dueDate')}
                      className="h-7 text-xs gap-1"
                    >
                      {t('sortDueDate')}
                      {getSortIcon('dueDate')}
                    </Button>
                  </div>
                )}
                
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {t('noRecurringExpenses')}
                  </p>
                ) : (
                  <div className="space-y-2">
                  {sortedExpenses.map((exp) => {
                    const cat = getCategoryByKey(exp.category);
                    const subName = getSubcategoryName(exp.subcategoryId);
                    const isInCurrentMonth = currentMonthExpenses.some(
                      e => e.recurringExpenseId === exp.id
                    );

                    const handleApply = async () => {
                      const success = await onApply(exp.id);
                      if (success) {
                        toast.success(t('applyToCurrentMonth'));
                      } else {
                        toast.info(t('alreadyInCurrentMonth'));
                      }
                    };

                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg gap-3 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-foreground text-sm font-medium">
                                {exp.title}
                              </p>
                              {exp.hasInstallments && exp.totalInstallments && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                  {exp.totalInstallments}x
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                              <span>{t(cat.name as TranslationKey)}</span>
                              {subName && <span>• {subName}</span>}
                              {exp.dueDay && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Calendar className="h-3 w-3" />
                                  {t('day')} {exp.dueDay}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-foreground text-sm font-semibold tabular-nums mr-1">
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
                                : 'text-muted-foreground hover:text-success hover:bg-success/10'
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
                            onClick={() => setDeleteId(exp.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            {view === 'list' ? (
              <Button
                onClick={openAdd}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addRecurringExpense')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {view === 'add' ? t('add') : t('save')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('updateRecurringTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('updateRecurringDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-9" onClick={() => setShowUpdateDialog(false)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUpdate(true)}
              className="h-9 bg-secondary text-foreground hover:bg-secondary/80"
            >
              {t('updateAll')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => confirmUpdate(false)}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('updateFutureOnly')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRecurringExpense')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteRecurringExpenseConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};