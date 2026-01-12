import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { GoalEntry } from '@/types';

interface GoalTimelineChartProps {
  entries: GoalEntry[];
  targetValue: number;
}

export const GoalTimelineChart = ({ entries, targetValue }: GoalTimelineChartProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  const chartData = useMemo(() => {
    if (!entries.length) return [];

    // Sort entries by date (oldest first)
    const sorted = [...entries].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate cumulative value
    let cumulative = 0;
    const data = sorted.map((entry) => {
      cumulative += entry.value;
      return {
        date: `${String(entry.month).padStart(2, '0')}/${entry.year}`,
        value: cumulative,
        label: entry.description || t('noDescription'),
      };
    });

    return data;
  }, [entries, t]);

  if (!chartData.length) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t('noEntries')}
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => {
              // Format compact: 1K, 1M, etc.
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return formatCurrency(value);
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [formatCurrency(value), t('currentValue')]}
            labelFormatter={(label) => `${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {targetValue > 0 && (
            <Line
              type="monotone"
              dataKey={() => targetValue}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name={t('targetValue')}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
