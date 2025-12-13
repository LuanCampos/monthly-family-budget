import { formatCurrency, formatPercentage, CategoryKey } from '@/types/budget';

interface CategorySummary {
  key: CategoryKey;
  name: string;
  percentage: number;
  budget: number;
  spent: number;
  remaining: number;
  usedPercentage: number;
}

interface SummaryTableProps {
  categories: CategorySummary[];
  totalSpent: number;
  totalBudget: number;
  usedPercentage: number;
}

export const SummaryTable = ({ 
  categories, 
  totalSpent, 
  totalBudget, 
  usedPercentage 
}: SummaryTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-3 font-semibold">Budget</th>
            <th className="text-right py-3 font-semibold">Valor Gasto</th>
            <th className="text-right py-3 font-semibold">Devo gastar</th>
            <th className="text-right py-3 font-semibold">Utilizado</th>
            <th className="text-right py-3 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.key} className="border-b border-border/50">
              <td className="py-3 text-foreground font-medium">{cat.name}</td>
              <td className="py-3 text-right text-foreground">
                {formatCurrency(cat.spent)}
              </td>
              <td className="py-3 text-right text-foreground">
                {formatCurrency(cat.budget)}
              </td>
              <td className={`py-3 text-right font-medium ${cat.usedPercentage > 100 ? 'text-destructive' : cat.usedPercentage > 80 ? 'text-warning' : 'text-success'}`}>
                {formatPercentage(cat.usedPercentage)}
              </td>
              <td className="py-3 text-right text-muted-foreground">
                {formatPercentage(cat.percentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
        <div>
          <span className="text-destructive text-2xl font-bold">
            {formatCurrency(totalSpent)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Total gastos</p>
        </div>
        <div>
          <span className="text-destructive text-2xl font-bold">
            {formatCurrency(Math.max(0, totalBudget - totalSpent))}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Total a gastar</p>
        </div>
        <div>
          <span className="text-foreground text-2xl font-bold">
            {formatPercentage(usedPercentage)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Utilizado</p>
        </div>
      </div>
    </div>
  );
};
