import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import type { Goal } from '@/types';

interface GoalMonthlySuggestionProps {
  goal: Goal;
  calculateSuggestion: (goalId: string) => Promise<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
  } | null>;
}

export const GoalMonthlySuggestion = ({ goal, calculateSuggestion }: GoalMonthlySuggestionProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [suggestion, setSuggestion] = useState<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await calculateSuggestion(goal.id);
        setSuggestion(result);
      } catch (error) {
        console.error('Failed to calculate suggestion:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goal.id, calculateSuggestion]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  if (!suggestion || suggestion.remainingValue <= 0) {
    return null;
  }

  const hasDeadline = suggestion.monthsRemaining !== null;

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Sugestão de Aporte</h4>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Faltam</p>
          <p className="font-semibold">{formatCurrency(suggestion.remainingValue)}</p>
        </div>

        {hasDeadline && suggestion.monthsRemaining !== null && (
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Prazo
            </p>
            <p className="font-semibold">
              {suggestion.monthsRemaining} {suggestion.monthsRemaining === 1 ? 'mês' : 'meses'}
            </p>
          </div>
        )}
      </div>

      {hasDeadline && suggestion.suggestedMonthly !== null && suggestion.suggestedMonthly > 0 ? (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-muted-foreground">Aporte mensal sugerido</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(suggestion.suggestedMonthly)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        !hasDeadline && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Defina uma data objetivo para ver a sugestão de aporte mensal
          </p>
        )
      )}
    </div>
  );
};
