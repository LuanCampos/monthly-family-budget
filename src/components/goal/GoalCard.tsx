import { Button } from '@/components/ui/button';
import { GoalProgress } from './GoalProgress';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import type { Goal, GoalEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoalCardProps {
  goal: Goal;
  entries: GoalEntry[];
  onAddEntry: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFetchEntries: () => Promise<GoalEntry[]>;
  calculateSuggestion: (goalId: string) => Promise<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
  } | null>;
}

export const GoalCard = ({ goal, entries, onAddEntry, onViewHistory, onEdit, onDelete, onFetchEntries, calculateSuggestion }: GoalCardProps) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="text-lg font-semibold leading-tight">{goal.name}</div>
            <p className="text-sm text-muted-foreground">{goal.account || 'Conta não informada'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Meta</p>
            <p className="text-base font-semibold">{goal.targetValue.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalProgress goal={goal} />
        <div className="flex flex-wrap gap-2">
          <GoalDetailsDialog 
            goal={goal} 
            entries={entries}
            onFetchEntries={onFetchEntries}
            calculateSuggestion={calculateSuggestion}
          />
          <Button size="sm" onClick={onAddEntry}>
            + Lançamento
          </Button>
          <Button size="sm" variant="outline" onClick={onViewHistory}>
            Histórico
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
