import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryKey, Expense, Subcategory } from '@/types/budget';
import { formatCurrency } from '@/utils/formatters';
import { getCategoryByKey } from '@/constants/categories';

interface SubcategoryChartProps {
  categoryKey: CategoryKey;
  expenses: Expense[];
  subcategories: Subcategory[];
  onBack: () => void;
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

export const SubcategoryChart = ({
  categoryKey,
  expenses,
  subcategories,
  onBack,
}: SubcategoryChartProps) => {
  const category = getCategoryByKey(categoryKey);
  const categoryExpenses = expenses.filter(e => e.category === categoryKey);

  const totals: Record<string, { name: string; value: number }> = {};
  let uncategorized = 0;

  categoryExpenses.forEach(exp => {
    if (exp.subcategoryId) {
      const sub = subcategories.find(s => s.id === exp.subcategoryId);
      if (sub) {
        if (!totals[sub.id]) {
          totals[sub.id] = { name: sub.name, value: 0 };
        }
        totals[sub.id].value += exp.value;
      } else {
        uncategorized += exp.value;
      }
    } else {
      uncategorized += exp.value;
    }
  });

  const data = Object.entries(totals).map(([id, data], index, arr) => ({
    id,
    name: data.name,
    value: data.value,
    color: generateSubcategoryColor(
      category.color,
      index,
      arr.length + (uncategorized > 0 ? 1 : 0)
    ),
  }));

  if (uncategorized > 0) {
    data.push({
      id: 'uncategorized',
      name: 'Sem sub-categoria',
      value: uncategorized,
      color: generateSubcategoryColor(category.color, data.length, data.length + 1),
    });
  }

  const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="font-medium text-foreground">{category.name}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Nenhuma sub-categoria com gastos
        </div>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percentage = ((d.value / totalSpent) * 100).toFixed(1);
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-sm text-primary">{formatCurrency(d.value)}</p>
                          <p className="text-xs text-muted-foreground">{percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data.map(sub => (
              <div key={sub.id} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                  <span className="text-muted-foreground">{sub.name}</span>
                </div>
                <span>{formatCurrency(sub.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
