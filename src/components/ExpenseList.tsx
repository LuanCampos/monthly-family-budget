import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, getCategoryByKey, formatCurrency, CATEGORIES } from '@/types/budget';

interface ExpenseListProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
}

export const ExpenseList = ({ expenses, onRemove }: ExpenseListProps) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum gasto cadastrado neste mês.</p>
        <p className="text-sm mt-1">Use os botões acima para adicionar gastos.</p>
      </div>
    );
  }

  // Sort by: Category order, then recurring first, then alphabetically by title
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
              <span className="text-sm text-foreground font-medium">{expense.title}</span>
              <span className="text-xs text-muted-foreground">({cat.name})</span>
              {expense.isRecurring && (
                <span className="text-xs text-muted-foreground">(recorrente)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground font-medium">
                {formatCurrency(expense.value)}
              </span>
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
