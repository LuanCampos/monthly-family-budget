import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil, Calendar, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryKey, Subcategory, RecurringExpense, Expense } from '@/types';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
import { RecurringExpenseFormDialog } from './RecurringExpenseFormDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';
import { ConfirmDialog } from '@/components/common';
import { shouldIncludeRecurringInMonth } from '@/lib/utils/monthUtils';

type SortType = 'createdAt' | 'category' | 'value' | 'dueDate';
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
  
  const [sortType, setSortType] = useState<SortType>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortType(type);
      if (type === 'createdAt') {
        setSortDirection('desc');
      } else if (type === 'category') {
        setSortDirection('asc');
      } else if (type === 'value') {
        setSortDirection('desc');
      } else if (type === 'dueDate') {
        setSortDirection('asc');
      } else {
        setSortDirection('asc');
      }
    }
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
    } else if (sortType === 'createdAt') {
      const aStamp = (a.startYear ?? 0) * 100 + (a.startMonth ?? 0);
      const bStamp = (b.startYear ?? 0) * 100 + (b.startMonth ?? 0);
      result = aStamp - bStamp;
      if (result === 0) {
        result = a.title.localeCompare(b.title);
      }
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
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="h-5 w-5 text-primary" />
              {t('recurringExpenses')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
            <div className="space-y-3">
              {expenses.length > 0 && (
                <div className="flex items-center gap-1 pb-2 border-b border-border">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-secondary text-xs h-8 px-2 xs:px-2.5 sm:h-9 sm:px-3 sm:text-sm"
                        >
                        <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{t('sortBy')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover">
                      <DropdownMenuItem onClick={() => handleSort('createdAt')} className="flex items-center justify-between">
                        {t('sortCreatedAt')}
                        {sortType === 'createdAt' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort('category')} className="flex items-center justify-between">
                        {t('sortCategory')}
                        {sortType === 'category' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort('value')} className="flex items-center justify-between">
                        {t('sortValue')}
                        {sortType === 'value' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort('dueDate')} className="flex items-center justify-between">
                        {t('sortDueDate')}
                        {sortType === 'dueDate' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  
                  // Check if this recurring expense should be included in the current month
                  // (e.g., installments that haven't started yet should not be applicable)
                  const canApplyToCurrentMonth = defaultYear && defaultMonth
                    ? shouldIncludeRecurringInMonth(exp, defaultYear, defaultMonth).include
                    : true;

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
                      className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <span className="text-sm text-foreground font-medium truncate">
                            {exp.title}
                          </span>

                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              onClick={() => { /* visual parity - no filter here */ }}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                            >
                              {t(cat.key as TranslationKey)}
                            </button>

                            {subName && (
                              <button
                                onClick={() => { /* visual parity */ }}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                              >
                                {subName}
                              </button>
                            )}

                            {exp.hasInstallments && exp.totalInstallments && (
                              <button className="text-xs px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors">
                                {exp.totalInstallments}x
                              </button>
                            )}

                            {exp.dueDay && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {t('day')} {exp.dueDay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span className="text-sm text-foreground font-semibold tabular-nums">
                          {formatCurrency(exp.value)}
                        </span>

                        <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleApply}
                            aria-label={isInCurrentMonth ? t('alreadyInCurrentMonth') : !canApplyToCurrentMonth ? t('notApplicableToMonth') : t('applyToCurrentMonth')}
                            disabled={isInCurrentMonth || !canApplyToCurrentMonth || applyingId === exp.id}
                            title={isInCurrentMonth ? t('alreadyInCurrentMonth') : !canApplyToCurrentMonth ? t('notApplicableToMonth') : t('applyToCurrentMonth')}
                            className={`h-9 w-9 ${
                              isInCurrentMonth || !canApplyToCurrentMonth || applyingId === exp.id
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