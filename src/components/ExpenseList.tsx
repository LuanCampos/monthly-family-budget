import { Trash2, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, Subcategory } from '@/types/budget';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  subcategories: Subcategory[];
  onRemove: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

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

export const ExpenseList = ({ expenses, subcategories, onRemove, onEdit }: ExpenseListProps) => {
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
    
    return { name: sub.name, color };
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    const catIndexA = CATEGORIES.findIndex(c => c.key === a.category);
    const catIndexB = CATEGORIES.findIndex(c => c.key === b.category);

    if (catIndexA !== catIndexB) return catIndexA - catIndexB;

    if (a.isRecurring !== b.isRecurring) return a.isRecurring ? -1 : 1;
  
    const subA =
      subcategories.find(s => s.id === a.subcategoryId)?.name ?? 'ZZZ';
    const subB =
      subcategories.find(s => s.id === b.subcategoryId)?.name ?? 'ZZZ';
  
    if (subA !== subB) return subA.localeCompare(subB);
  
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-2">
      {sortedExpenses.map((expense) => {
        const cat = getCategoryByKey(expense.category);
        const subInfo = getSubcategoryInfo(expense.subcategoryId);

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium">
                {expense.title}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </span>

              {subInfo && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subInfo.color }}
                  />
                  {subInfo.name}
                </span>
              )}

              {expense.isRecurring && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
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
