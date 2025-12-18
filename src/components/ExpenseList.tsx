import { useState } from 'react';
import { Trash2, Pencil, RefreshCw, X, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, Subcategory, CategoryKey, RecurringExpense } from '@/types';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
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

interface ExpenseListProps {
  expenses: Expense[];
  subcategories: Subcategory[];
  recurringExpenses: RecurringExpense[];
  onRemove: (id: string) => void | Promise<void>;
  onEdit: (expense: Expense) => void;
  onConfirmPayment: (id: string) => void | Promise<void>;
  sortType: SortType;
  sortDirection: SortDirection;
}

type FilterType = 
  | { type: 'category'; value: CategoryKey }
  | { type: 'subcategory'; value: string }
  | { type: 'recurring' }
  | { type: 'pending' }
  | { type: 'installments' }
  | null;

export type SortType = 'category' | 'value' | 'dueDate';
export type SortDirection = 'asc' | 'desc';

const generateSubcategoryColor = (
  baseColor: string,
  index: number,
  total: number
): string => {
  const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return baseColor;

  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);

  const step = total > 1 ? 30 / (total - 1) : 0;
  const newL = Math.max(25, Math.min(75, l - 15 + step * index));

  return `hsl(${h}, ${s}%, ${newL}%)`;
};

export const ExpenseList = ({ expenses, subcategories, recurringExpenses, onRemove, onEdit, onConfirmPayment, sortType, sortDirection }: ExpenseListProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [filter, setFilter] = useState<FilterType>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t('noExpenses')}</p>
      </div>
    );
  }

  const getSubcategoryInfo = (subcategoryId?: string) => {
    if (!subcategoryId) return null;
    const sub = subcategories.find(s => s.id === subcategoryId);
    if (!sub) return null;
    
    const categorySubs = subcategories.filter(s => s.categoryKey === sub.categoryKey);
    const index = categorySubs.findIndex(s => s.id === subcategoryId);
    const category = getCategoryByKey(sub.categoryKey);
    const color = generateSubcategoryColor(category.color, index, categorySubs.length);
    
    return { id: sub.id, name: sub.name, color };
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!filter) return true;
    
    if (filter.type === 'category') {
      return expense.category === filter.value;
    }
    if (filter.type === 'subcategory') {
      return expense.subcategoryId === filter.value;
    }
    if (filter.type === 'recurring') {
      return expense.recurringExpenseId && recurringExpenses.some(r => r.id === expense.recurringExpenseId);
    }
    if (filter.type === 'pending') {
      return expense.isPending;
    }
    if (filter.type === 'installments') {
      return !!expense.installmentInfo;
    }
    return true;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
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
      
      if (result === 0 && a.isRecurring !== b.isRecurring) {
        result = a.isRecurring ? -1 : 1;
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

  const getFilterLabel = () => {
    if (!filter) return '';
    if (filter.type === 'category') {
      return t(filter.value as TranslationKey);
    }
    if (filter.type === 'subcategory') {
      const sub = subcategories.find(s => s.id === filter.value);
      return sub?.name || '';
    }
    if (filter.type === 'recurring') {
      return t('recurring');
    }
    if (filter.type === 'pending') {
      return t('pending');
    }
    if (filter.type === 'installments') {
      return t('installments');
    }
    return '';
  };

  const handleConfirmPayment = () => {
    if (confirmPaymentId) {
      onConfirmPayment(confirmPaymentId);
      setConfirmPaymentId(null);
    }
  };

  const handleDeleteExpense = () => {
    if (deleteExpenseId) {
      onRemove(deleteExpenseId);
      setDeleteExpenseId(null);
    }
  };

  return (
    <div className="space-y-2">
      {filter && (
        <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
          <span className="text-xs text-muted-foreground">{t('all')}:</span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium">
            {getFilterLabel()}
            <button
              onClick={() => setFilter(null)}
              className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{t('noExpenses')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedExpenses.map((expense) => {
            const cat = getCategoryByKey(expense.category);
            const subInfo = getSubcategoryInfo(expense.subcategoryId);

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <span className="text-sm text-foreground font-medium truncate">
                      {expense.title}
                    </span>
                
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        onClick={() => setFilter({ type: 'category', value: expense.category })}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                      >
                        {t(cat.key as TranslationKey)}
                      </button>
                
                      {subInfo && (
                        <button
                          onClick={() => setFilter({ type: 'subcategory', value: subInfo.id })}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          {subInfo.name}
                        </button>
                      )}
                
                      {expense.recurringExpenseId && recurringExpenses.some(r => r.id === expense.recurringExpenseId) && (
                        <button
                          onClick={() => setFilter({ type: 'recurring' })}
                          className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                          title={t('recurring')}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      )}

                      {expense.installmentInfo && (
                        <button
                          onClick={() => setFilter({ type: 'installments' })}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>{expense.installmentInfo.current}/{expense.installmentInfo.total}</span>
                        </button>
                      )}

                      {expense.isPending && (
                        <button
                          onClick={() => setConfirmPaymentId(expense.id)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                          title={t('confirmPayment')}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {expense.dueDay && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {expense.dueDay}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <span className="text-sm text-foreground font-semibold tabular-nums">
                    {formatCurrency(expense.value)}
                  </span>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteExpenseId(expense.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmPaymentId} onOpenChange={(open) => !open && setConfirmPaymentId(null)}>
        <AlertDialogContent className="bg-card border-border max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmPayment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmPaymentMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent className="bg-card border-border max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteExpense')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteExpenseMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};