import { Button } from '@/components/ui/button';
import { GoalProgress } from './GoalProgress';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import type { Goal, GoalEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Pencil, Trash2, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GoalCardProps {
  goal: Goal;
  entries: GoalEntry[];
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

export const GoalCard = ({ goal, entries, onViewHistory, onEdit, onDelete, onFetchEntries, calculateSuggestion }: GoalCardProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2.5">
        <CardTitle className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="text-lg font-semibold leading-tight break-words">{goal.name}</div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{goal.account || t('notSpecified') || 'Conta não informada'}</span>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">{t('targetValue') || 'Meta'}</p>
            <p className="text-base font-semibold">{formatCurrency(goal.targetValue)}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-2 pb-3.5">
        <GoalProgress goal={goal} />

        <div className="goal-actions flex flex-wrap items-center gap-2 !mt-4">
          <GoalDetailsDialog 
            goal={goal} 
            entries={entries}
            onFetchEntries={onFetchEntries}
            calculateSuggestion={calculateSuggestion}
          />
          <button
            type="button"
            onClick={onViewHistory}
            className="goal-action-btn"
          >
            <History className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="leading-none">{t('history') || 'Histórico'}</span>
          </button>
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t('edit') || 'Editar'} className="justify-center hover:text-primary !h-8 !w-8">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label={t('delete') || 'Excluir'} className="justify-center text-destructive hover:bg-destructive/10 hover:text-destructive !h-8 !w-8">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
