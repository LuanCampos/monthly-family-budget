import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/budget';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseList = ({ expenses, onRemove, onEdit }: ExpenseListProps) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum gasto cadastrado neste mês.</p>
        <p className="text-sm mt-1">Use os botões acima para adicionar gastos.</p>
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const catIndexA = CATEGORIES.findIndex(c => c.key === a.category);
    const catIndexB = CATEGORIES.findIndex(c => c.key === b.category);
    if (catIndexA !== catIndexB) return catIndexA - catIndexB;

    if (a.isRecurring !== b.isRecurring) return a.isRecurring ? -1 : 1;

    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-2">
      {sortedExpenses.map((expense) => {
        const cat = getCategoryByKey(expense.category);

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />

              <span className="text-sm text-foreground font-medium">
                {expense.title}
              </span>

              <span className="text-xs text-muted-foreground">
                ({cat.name})
              </span>

              {expense.isRecurring && (
                <span className="text-xs text-muted-foreground">
                  (Recorrente)
                </span>
              )}
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
      })}
    </div>
  );
};
