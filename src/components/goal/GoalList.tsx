import type { Goal, GoalEntry } from '@/types';
import { GoalCard } from './GoalCard';
import { Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalListProps {
  goals: Goal[];
  entriesByGoal: Record<string, GoalEntry[]>;
  onViewHistory: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onFetchEntries: (goalId: string) => Promise<GoalEntry[]>;
  calculateSuggestion: (goalId: string) => Promise<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
  } | null>;
}

export const GoalList = ({ goals, entriesByGoal, onViewHistory, onEdit, onDelete, onFetchEntries, calculateSuggestion }: GoalListProps) => {
  const { t } = useLanguage();

  if (!goals.length) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{t('createFirstGoal') || 'Crie sua primeira meta'}</p>
            <p className="text-sm text-muted-foreground">{t('createFirstGoalDescription') || 'Conecte uma subcategoria de metas para acompanhar o progresso.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          entries={entriesByGoal[goal.id] || []}
          onViewHistory={() => onViewHistory(goal)}
          onEdit={() => onEdit(goal)}
          onDelete={() => onDelete(goal)}
          onFetchEntries={() => onFetchEntries(goal.id)}
          calculateSuggestion={calculateSuggestion}
        />
      ))}
    </div>
  );
};
