import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
import type { Goal } from '@/types';
import { useGoals } from '@/hooks/useGoals';

interface GoalProgressProps {
  goal: Goal;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const GoalProgress = ({ goal }: GoalProgressProps) => {
  const { getMonthlySuggestion } = useGoals();
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

  const formatTargetDate = () => {
    if (!goal.targetMonth || !goal.targetYear) return '';
    return `${MONTH_NAMES[goal.targetMonth - 1]} ${goal.targetYear}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{pct.toFixed(1)}%</span>
        <span>
          {goal.currentValue.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}
          {' / '}
          {goal.targetValue.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}
        </span>
      </div>
      <Progress value={pct} />
      
      {remaining > 0 && (
        <div className="text-sm text-muted-foreground">
          Faltam <span className="font-semibold text-foreground">{remaining.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}</span>
        </div>
      )}

      {hasTargetDate && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {formatTargetDate()}
          </Badge>
          
          {suggestion && suggestion.suggestedMonthly !== null && suggestion.suggestedMonthly > 0 && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {suggestion.suggestedMonthly.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}/mês
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
