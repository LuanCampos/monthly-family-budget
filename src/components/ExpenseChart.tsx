import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryKey, Expense, Subcategory } from '@/types/budget';
import { formatCurrency } from '@/utils/formatters';
import { getCategoryByKey } from '@/constants/categories';

interface CategorySummary {
  key: CategoryKey;
  name: string;
  spent: number;
  color: string;
}

interface ExpenseChartProps {
  data: CategorySummary[];
  hasExpenses: boolean;
  expenses: Expense[];
  subcategories: Subcategory[];
}

const generateSubcategoryColor = (baseColor: string, index: number, total: number): string => {
  // Parse HSL from the base color
  const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return baseColor;

  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);

  // Vary lightness for each subcategory
  const step = total > 1 ? 30 / (total - 1) : 0;
  const newL = Math.max(25, Math.min(75, l - 15 + step * index));

  return `hsl(${h}, ${s}%, ${newL}%)`;
};

export const ExpenseChart = ({ data, hasExpenses, expenses, subcategories }: ExpenseChartProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  if (!hasExpenses) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-center px-4">
        Você não possui gastos cadastrados
      </div>
    );
  }

  const chartData = data
    .filter(d => d.spent > 0)
    .map(d => ({
      key: d.key,
      name: d.name,
      value: d.spent,
      color: d.color,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-center px-4">
        Você não possui gastos cadastrados
      </div>
    );
  }

  // When a category is selected, show subcategory breakdown
  if (selectedCategory) {
    const category = getCategoryByKey(selectedCategory);
    const categoryExpenses = expenses.filter(e => e.category === selectedCategory);
    
    // Group by subcategory
    const subcategoryTotals: Record<string, { name: string; value: number }> = {};
    let uncategorizedTotal = 0;

    categoryExpenses.forEach(exp => {
      if (exp.subcategoryId) {
        const sub = subcategories.find(s => s.id === exp.subcategoryId);
        if (sub) {
          if (!subcategoryTotals[sub.id]) {
            subcategoryTotals[sub.id] = { name: sub.name, value: 0 };
          }
          subcategoryTotals[sub.id].value += exp.value;
        } else {
          uncategorizedTotal += exp.value;
        }
      } else {
        uncategorizedTotal += exp.value;
      }
    });

    const subcategoryData = Object.entries(subcategoryTotals).map(([id, data], index, arr) => ({
      id,
      name: data.name,
      value: data.value,
      color: generateSubcategoryColor(category.color, index, arr.length + (uncategorizedTotal > 0 ? 1 : 0)),
    }));

    if (uncategorizedTotal > 0) {
      subcategoryData.push({
        id: 'uncategorized',
        name: 'Sem sub-categoria',
        value: uncategorizedTotal,
        color: generateSubcategoryColor(category.color, subcategoryData.length, subcategoryData.length + 1),
      });
    }

    const filteredExpenses = categoryExpenses;
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.value, 0);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedCategory(null)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium text-foreground">{category.name}</span>
          </div>
        </div>

        {subcategoryData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-center px-4 text-sm">
            Nenhuma sub-categoria com gastos
          </div>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subcategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subcategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = ((data.value / totalSpent) * 100).toFixed(1);
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{data.name}</p>
                            <p className="text-sm text-primary">{formatCurrency(data.value)}</p>
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

            {/* Subcategory legend */}
            <div className="space-y-1">
              {subcategoryData.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="text-muted-foreground">{sub.name}</span>
                  </div>
                  <span className="text-foreground">{formatCurrency(sub.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Main category chart
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            style={{ cursor: 'pointer' }}
            onClick={(_, index) => {
              const clicked = chartData[index];
              if (clicked) {
                setSelectedCategory(clicked.key);
              }
            }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{data.name}</p>
                    <p className="text-sm text-primary">{formatCurrency(data.value)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
