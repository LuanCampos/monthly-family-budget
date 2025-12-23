import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryKey } from '@/types/budget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface CategorySummary {
  key: CategoryKey;
  name: string;
  spent: number;
  color: string;
}

interface ExpenseChartProps {
  data: CategorySummary[];
  hasExpenses: boolean;
  onSelectCategory?: (category: CategoryKey) => void;
}

export const ExpenseChart = ({
  data,
  hasExpenses,
  onSelectCategory,
}: ExpenseChartProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  if (!hasExpenses) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-center px-4">
        {t('noExpenses')}
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
        {t('noExpenses')}
      </div>
    );
  }

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
            style={{ cursor: onSelectCategory ? 'pointer' : 'default' }}
            onClick={(_, index) => {
              if (!onSelectCategory) return;
              const clicked = chartData[index];
              if (clicked) {
                onSelectCategory(clicked.key);
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
                    <p className="text-sm font-medium text-foreground">
                      {t(data.key as TranslationKey)}
                    </p>
                    <p className="text-sm text-primary">
                      {formatCurrency(data.value)}
                    </p>
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
