import type { Goal, GoalEntry } from '@/types';
import { GoalCard } from './GoalCard';

interface GoalListProps {
  goals: Goal[];
  entriesByGoal: Record<string, GoalEntry[]>;
  onAddEntry: (goal: Goal) => void;
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

export const GoalList = ({ goals, entriesByGoal, onAddEntry, onViewHistory, onEdit, onDelete, onFetchEntries, calculateSuggestion }: GoalListProps) => {
  if (!goals.length) {
    return (
      <div className="text-center py-10 border rounded-lg">
        <p className="text-lg font-semibold">Crie sua primeira meta</p>
        <p className="text-sm text-muted-foreground">Conecte uma subcategoria de metas para acompanhar o progresso.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          entries={entriesByGoal[goal.id] || []}
          onAddEntry={() => onAddEntry(goal)}
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
