import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
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
  const [suggestion, setSuggestion] = useState<{ remainingValue: number; monthsRemaining: number | null; suggestedMonthly: number | null } | null>(null);
  const hasTargetDate = goal.targetMonth && goal.targetYear;

  useEffect(() => {
    const loadSuggestion = async () => {
      if (hasTargetDate) {
        const result = await getMonthlySuggestion(goal.id);
        setSuggestion(result);
      }
    };
    loadSuggestion();
  }, [goal.id, hasTargetDate, getMonthlySuggestion]);

  const pct = goal.targetValue > 0 ? Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100)) : 0;
  const remaining = goal.targetValue - goal.currentValue;

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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{pct.toFixed(1)}%</span>
        <span>
          {formatCurrency(goal.currentValue)}
          {' / '}
          {formatCurrency(goal.targetValue)}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      
      {remaining > 0 && (
        <div className="text-sm text-muted-foreground">
                {(t('goalRemaining') || 'Faltam')}{' '}
                <span className="font-semibold text-foreground">{formatCurrency(remaining)}</span>
        </div>
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
        </div>
      )}
    </div>
  );
};
