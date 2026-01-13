import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';
import type { Goal } from '@/types';

interface GoalMonthlySuggestionProps {
  goal: Goal;
  calculateSuggestion: (goalId: string) => Promise<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
    monthlyContributed: number | null;
    monthlyRemaining: number | null;
  } | null>;
}

export const GoalMonthlySuggestion = ({ goal, calculateSuggestion }: GoalMonthlySuggestionProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [suggestion, setSuggestion] = useState<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
    monthlyContributed: number | null;
    monthlyRemaining: number | null;
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
  }, [goal.id, goal.currentValue, calculateSuggestion]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  if (!suggestion || suggestion.remainingValue <= 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          {t('goalCompleted') || 'Meta concluída!'}
        </p>
      </div>
    );
  }

  const hasDeadline = suggestion.monthsRemaining !== null;

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 text-card-foreground space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h4 className="text-base font-semibold">{t('monthlyContributionSuggestion') || 'Sugestão de aporte'}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground mb-1">{t('goalRemaining') || 'Faltam'}</p>
          <p className="text-lg font-semibold">{formatCurrency(suggestion.remainingValue)}</p>
        </div>

        {hasDeadline && suggestion.monthsRemaining !== null && (
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-muted-foreground mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t('deadline') || 'Prazo'}
            </p>
            <p className="text-lg font-semibold">
              {suggestion.monthsRemaining} {suggestion.monthsRemaining === 1 ? (t('month') || 'mês') : (t('months') || 'meses')}
            </p>
          </div>
        )}
      </div>

      {hasDeadline && suggestion.suggestedMonthly !== null && suggestion.suggestedMonthly > 0 ? (
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">{t('suggestedMonthlyContribution') || 'Aporte mensal sugerido'}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(suggestion.suggestedMonthly)}
              </p>
            </div>
          </div>

          {suggestion.monthlyRemaining !== null && suggestion.monthlyRemaining > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-1">{t('thisMonthRemaining') || 'Ainda falta aportar este mês'}</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(suggestion.monthlyRemaining)}
                </p>
                {suggestion.monthlyContributed && suggestion.monthlyContributed > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ({formatCurrency(suggestion.monthlyContributed)} {t('contributed') || 'Logged this month'} · 
                    {formatCurrency(suggestion.suggestedMonthly)} {t('goal') || 'meta'})
                  </p>
                )}
              </div>
            </div>
          )}

          {suggestion.monthlyRemaining !== null && suggestion.monthlyRemaining <= 0 && suggestion.monthlyContributed && suggestion.monthlyContributed > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-1">{t('thisMonthComplete') || 'Meta deste mês atingida!'}</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(suggestion.monthlyContributed)} {t('contributed') || 'Logged this month'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        !hasDeadline && (
          <p className="text-xs text-muted-foreground pt-3 border-t text-center">
            {t('setTargetDateForSuggestion') || 'Defina uma data objetivo para ver a sugestão de aporte mensal'}
          </p>
        )
      )}
    </div>
  );
};
