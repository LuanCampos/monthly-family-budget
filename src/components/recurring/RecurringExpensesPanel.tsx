import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil, Calendar, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryKey, Subcategory, RecurringExpense, Expense } from '@/types';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
import { RecurringExpenseFormDialog } from './RecurringExpenseFormDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';
import { ConfirmDialog } from '@/components/common';

type SortType = 'category' | 'value' | 'dueDate';
type SortDirection = 'asc' | 'desc';

interface RecurringExpensesPanelProps {
  expenses: RecurringExpense[];
  subcategories: Subcategory[];
  currentMonthExpenses: Expense[];
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
  onRemove: (id: string) => void | Promise<void>;
  onApply: (id: string) => boolean | Promise<boolean>;
}

export const RecurringExpensesPanel = ({
  expenses,
  subcategories,
  currentMonthExpenses,
  defaultMonth,
  defaultYear,
  onAdd,
  onUpdate,
  onRemove,
  onApply,
}: RecurringExpensesPanelProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  const [sortType, setSortType] = useState<SortType>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const openAddForm = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const openEditForm = (exp: RecurringExpense) => {
    setEditingExpense(exp);
    setIsFormOpen(true);
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

  const handleDeleteConfirm = async () => {
    if (deleteId && !isDeleting) {
      setIsDeleting(true);
      try {
        await onRemove(deleteId);
        setDeleteId(null);
      } finally {
        setIsDeleting(false);
      }
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
        <span className="hidden xs:inline">{t('recurring')}</span>
        <span className="hidden xs:inline ml-1 text-muted-foreground">({expenses.length})</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="h-5 w-5 text-primary" />
              {t('recurringExpenses')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
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
                    if (applyingId === exp.id) return;
                    setApplyingId(exp.id);
                    try {
                      const success = await onApply(exp.id);
                      if (success) {
                        toast.success(t('applyToCurrentMonth'));
                      } else {
                        toast.info(t('alreadyInCurrentMonth'));
                      }
                    } finally {
                      setApplyingId(null);
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
                          aria-label={isInCurrentMonth ? t('alreadyInCurrentMonth') : t('applyToCurrentMonth')}
                          disabled={isInCurrentMonth || applyingId === exp.id}
                          title={isInCurrentMonth ? t('alreadyInCurrentMonth') : t('applyToCurrentMonth')}
                          className={`h-9 w-9 ${
                            isInCurrentMonth || applyingId === exp.id
                              ? 'text-muted-foreground/40 cursor-not-allowed' 
                              : 'text-muted-foreground hover:text-success hover:bg-success/10'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(exp)}
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          aria-label={t('edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(exp.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label={t('delete')}
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            <Button
              onClick={openAddForm}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addRecurringExpense')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RecurringExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={editingExpense}
        subcategories={subcategories}
        defaultMonth={defaultMonth}
        defaultYear={defaultYear}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteRecurringExpense')}
        description={t('deleteRecurringExpenseConfirm')}
        variant="destructive"
        icon={Trash2}
        loading={isDeleting}
      />
    </>
  );
};