import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  // Legend imported for future use; keep to avoid UI regressions
} from 'recharts';
import { Month } from '@/types/budget';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface AnnualViewChartProps {
  months: Month[];
  currentYear: number;
}

export const AnnualViewChart = ({ months, currentYear }: AnnualViewChartProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  const chartData = useMemo(() => {
    const monthNames = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthData = months.find(m => m.year === currentYear && m.month === monthNum);
      
      const categoryTotals: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        categoryTotals[cat.key] = 0;
      });

      if (monthData) {
        monthData.expenses.forEach(expense => {
          categoryTotals[expense.category] += expense.value;
        });
      }

      return {
        month: monthNames[i],
        monthNum,
        ...categoryTotals,
      };
    });
  }, [months, currentYear]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1 capitalize">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.value > 0 && (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">
                  {t(entry.dataKey as TranslationKey)}:
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            )
          ))}
          {total > 0 && (
            <div className="border-t border-border mt-1 pt-1">
              <span className="text-xs font-medium text-foreground">
                Total: {formatCurrency(total)}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const hasAnyData = chartData.some(d => 
    CATEGORIES.some(cat => d[cat.key] > 0)
  );

  if (!hasAnyData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-center px-4">
        {t('noExpenses')}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={{ className: 'stroke-border' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={{ className: 'stroke-border' }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            {CATEGORIES.map((cat) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                stackId="a"
                fill={cat.color}
                name={t(cat.key as TranslationKey)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-xs text-muted-foreground">
              {t(cat.key as TranslationKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
