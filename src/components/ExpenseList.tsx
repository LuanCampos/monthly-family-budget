import { useState } from 'react';
import { Trash2, Pencil, RefreshCw, X, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, Subcategory, CategoryKey } from '@/types/budget';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';
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
  onRemove: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onConfirmPayment: (id: string) => void;
}

type FilterType = 
  | { type: 'category'; value: CategoryKey }
  | { type: 'subcategory'; value: string }
  | { type: 'recurring' }
  | { type: 'pending' }
  | null;

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

export const ExpenseList = ({ expenses, subcategories, onRemove, onEdit, onConfirmPayment }: ExpenseListProps) => {
  const [filter, setFilter] = useState<FilterType>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum gasto cadastrado neste mês.</p>
        <p className="text-sm mt-1">Use os botões acima para adicionar gastos.</p>
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
      return expense.isRecurring;
    }
    if (filter.type === 'pending') {
      return expense.isPending;
    }
    return true;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const catIndexA = CATEGORIES.findIndex(c => c.key === a.category);
    const catIndexB = CATEGORIES.findIndex(c => c.key === b.category);

    if (catIndexA !== catIndexB) return catIndexA - catIndexB;
  
    const subA =
      subcategories.find(s => s.id === a.subcategoryId)?.name ?? 'ZZZ';
    const subB =
      subcategories.find(s => s.id === b.subcategoryId)?.name ?? 'ZZZ';
  
    if (subA !== subB) return subA.localeCompare(subB);

    if (a.isRecurring !== b.isRecurring) return a.isRecurring ? -1 : 1;
  
    return a.title.localeCompare(b.title);
  });

  const getFilterLabel = () => {
    if (!filter) return '';
    if (filter.type === 'category') {
      return getCategoryByKey(filter.value).name;
    }
    if (filter.type === 'subcategory') {
      const sub = subcategories.find(s => s.id === filter.value);
      return sub?.name || '';
    }
    if (filter.type === 'recurring') {
      return 'Recorrentes';
    }
    if (filter.type === 'pending') {
      return 'Pendentes';
    }
    return '';
  };

  const handleConfirmPayment = () => {
    if (confirmPaymentId) {
      onConfirmPayment(confirmPaymentId);
      setConfirmPaymentId(null);
    }
  };

  return (
    <div className="space-y-2">
      {filter && (
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Filtro:</span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            {getFilterLabel()}
            <button
              onClick={() => setFilter(null)}
              className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <p>Nenhum gasto encontrado com este filtro.</p>
        </div>
      ) : (
        sortedExpenses.map((expense) => {
          const cat = getCategoryByKey(expense.category);
          const subInfo = getSubcategoryInfo(expense.subcategoryId);

          return (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-foreground font-medium whitespace-nowrap">
                    {expense.title}
                  </span>
              
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => setFilter({ type: 'category', value: expense.category })}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      {cat.name}
                    </button>
              
                    {subInfo && (
                      <button
                        onClick={() =>
                          setFilter({ type: 'subcategory', value: subInfo.id })
                        }
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        {subInfo.name}
                      </button>
                    )}
              
                    {expense.isRecurring && (
                      <button
                        onClick={() => setFilter({ type: 'recurring' })}
                        className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    )}

                    {expense.isPending && (
                      <button
                        onClick={() => setConfirmPaymentId(expense.id)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors cursor-pointer"
                        title="Clique para confirmar pagamento"
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

              <div className="flex items-center gap-1">
                <span className="text-sm text-foreground font-medium mr-2">
                  {formatCurrency(expense.value)}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(expense)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(expense.id)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })
      )}

      <AlertDialog open={!!confirmPaymentId} onOpenChange={(open) => !open && setConfirmPaymentId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar que este pagamento foi realizado? A pendência será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
