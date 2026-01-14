import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { Goal } from '@/types';
import { useGoals } from '@/hooks/useGoals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GoalProgressProps {
  goal: Goal;
}

export const GoalProgress = ({ goal }: GoalProgressProps) => {
  const { getMonthlySuggestion } = useGoals();
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const isActive = (goal.status ?? 'active') === 'active';
  const [suggestion, setSuggestion] = useState<{ 
    remainingValue: number
    monthsRemaining: number | null
    suggestedMonthly: number | null
    monthlyContributed: number | null
    monthlyRemaining: number | null
  } | null>(null);
  const hasTargetDate = goal.targetMonth && goal.targetYear;

  useEffect(() => {
    const loadSuggestion = async () => {
      if (!hasTargetDate || !isActive) {
        setSuggestion(null);
        return;
      }
      const result = await getMonthlySuggestion(goal.id);
      setSuggestion(result);
    };
    loadSuggestion();
  }, [goal.id, hasTargetDate, goal.currentValue, getMonthlySuggestion, isActive]);

  const pct = goal.targetValue > 0 ? Math.min(100, Math.max(0, ((goal.currentValue || 0) / goal.targetValue) * 100)) : 0;
  const remaining = goal.targetValue - (goal.currentValue || 0);
  const progressIsComplete = pct >= 100;

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 
    'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 
    'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatTargetDate = () => {
    if (!goal.targetMonth || !goal.targetYear) return '';
    return `${MONTH_NAMES[goal.targetMonth - 1]} ${goal.targetYear}`;
  };

  return (
    <div className="space-y-2 mt-2 sm:mt-0 sm:-mt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-green-600 dark:text-green-400">
          <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
          {formatCurrency(goal.currentValue || 0)}
        </span>
        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
        {remaining > 0 && (
          <span className="text-muted-foreground">
            {t('goalRemaining') || 'Faltam'} {formatCurrency(remaining)}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressIsComplete ? 'bg-green-500 dark:bg-green-400' : ''}`}
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: progressIsComplete ? undefined : 'hsl(var(--primary) / 0.7)',
          }}
        />
      </div>

      {!isActive && (
        <p className="text-xs text-muted-foreground pt-1">
          {t('goalArchivedInfo') || 'Meta arquivada. Novos gastos não serão vinculados automaticamente.'}
        </p>
      )}

      {hasTargetDate && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Calendar className="h-3 w-3" />
            {formatTargetDate()}
          </Badge>
          
          {suggestion && suggestion.suggestedMonthly !== null && suggestion.suggestedMonthly > 0 && (
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <TrendingUp className="h-3 w-3" />
                    {formatCurrency(suggestion.suggestedMonthly)}/{t('perMonth') || 'mês'}
            </Badge>
          )}

          {suggestion && suggestion.monthlyRemaining !== null && suggestion.monthlyRemaining > 0 && (
            <Badge variant="secondary" className="gap-1.5 text-xs bg-red-500/10 dark:bg-red-500/15 border-red-200/30 dark:border-red-900/30">
              {t('thisMonthRemaining') || 'Faltam este mês'}:{' '}
              {formatCurrency(suggestion.monthlyRemaining)}
            </Badge>
          )}

          {suggestion && suggestion.monthlyContributed !== null && suggestion.monthlyContributed > 0 && (
            <Badge variant="secondary" className="gap-1.5 text-xs bg-green-500/10 dark:bg-green-500/15 border-green-200/30 dark:border-green-900/30">
              {t('thisMonth') || 'Este mês'}: {formatCurrency(suggestion.monthlyContributed)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
