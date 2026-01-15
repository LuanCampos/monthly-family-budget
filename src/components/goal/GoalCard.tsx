import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoalProgress } from './GoalProgress';
import { GoalTimelineChart } from './GoalTimelineChart';
import type { Goal, GoalEntry } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { List, Pencil, Trash2, Wallet, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useState } from 'react';
import { logger } from '@/lib/logger';

interface GoalCardProps {
  goal: Goal;
  entries: GoalEntry[];
  onViewHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFetchEntries: () => Promise<GoalEntry[]>;
  onCompleteGoal?: () => void;
}

export const GoalCard = ({ goal, entries, onViewHistory, onEdit, onDelete, onFetchEntries, onCompleteGoal }: GoalCardProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [currentEntries, setCurrentEntries] = useState<GoalEntry[]>(entries);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const isActive = (goal.status ?? 'active') === 'active';
  const isCompleted = goal.targetValue > 0 && (goal.currentValue || 0) >= goal.targetValue;

  const handleEvolutionClick = async () => {
    setEvolutionOpen(true);
    setLoadingEntries(true);
    try {
      const freshEntries = await onFetchEntries();
      setCurrentEntries(freshEntries);
    } catch (error) {
      logger.error('goal.loadEntries.failed', { goalId: goal.id, error });
    } finally {
      setLoadingEntries(false);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 sm:pb-1 space-y-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold leading-tight break-words">{goal.name}</h3>
              {goal.status && goal.status !== 'active' && (
                <Badge variant="outline" className="text-[11px] h-5 px-2">
                  {t('goalStatusArchived') || 'Concluída/Inativa'}
                </Badge>
              )}
              {isActive && isCompleted && onCompleteGoal && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 gap-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                  onClick={onCompleteGoal}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('goalMarkComplete') || 'Concluir meta'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="truncate">{goal.account || t('notSpecified') || 'Conta não informada'}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">{t('targetValue') || 'Objetivo'}</p>
            <p className="text-sm sm:text-base font-bold">{formatCurrency(goal.targetValue)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <GoalProgress goal={goal} />

        <div className="goal-actions flex flex-wrap items-center gap-0.5 sm:gap-2 mt-4 sm:mt-5">
          <button
            type="button"
            onClick={onViewHistory}
            className="goal-action-btn"
          >
            <List className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="leading-none">{t('entries') || 'Lançamentos'}</span>
          </button>
          <button
            type="button"
            onClick={handleEvolutionClick}
            className="goal-action-btn"
          >
            <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="leading-none">{t('evolution') || 'Evolução'}</span>
          </button>
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t('edit') || 'Editar'} className="justify-center hover:text-primary !h-8 !w-8">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label={t('delete') || 'Excluir'} className="justify-center hover:text-destructive hover:bg-destructive/10 !h-8 !w-8">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={evolutionOpen} onOpenChange={setEvolutionOpen}>
        <DialogContent className="bg-card border-border sm:max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('goalTimeline') || 'Evolução'} - {goal.name}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto">
            {loadingEntries ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <GoalTimelineChart entries={currentEntries} targetValue={goal.targetValue} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
