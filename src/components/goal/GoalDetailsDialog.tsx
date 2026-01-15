import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoalTimelineChart } from './GoalTimelineChart';
import { BarChart3, TrendingUp, Loader2, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Goal, GoalEntry } from '@/types';
import { logger } from '@/lib/logger';

interface GoalDetailsDialogProps {
  goal: Goal;
  entries: GoalEntry[];
  onFetchEntries: () => Promise<GoalEntry[]>;
  calculateSuggestion: (goalId: string) => Promise<{
    remainingValue: number;
    monthsRemaining: number | null;
    suggestedMonthly: number | null;
  } | null>;
}

export const GoalDetailsDialog = ({ goal, entries, onFetchEntries }: GoalDetailsDialogProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [currentEntries, setCurrentEntries] = useState<GoalEntry[]>(entries);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setLoadingEntries(true);
      try {
        const freshEntries = await onFetchEntries();
        setCurrentEntries(freshEntries);
      } catch (error) {
        logger.error('goal.loadEntries.failed', { goalId: goal.id, error });
      } finally {
        setLoadingEntries(false);
      }
    }
  };

  const remaining = Math.max(goal.targetValue - goal.currentValue, 0);

  return (
    <>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => handleOpenChange(true)}
        className="gap-1.5"
      >
        <BarChart3 className="h-4 w-4" />
        <span>{t('details') || 'Detalhes'}</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-card border-border sm:max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              {goal.name}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-secondary/30 p-3 sm:p-3.5 space-y-1">
                <p className="text-xs text-muted-foreground">{t('currentValue') || 'Valor Atual'}</p>
                <p className="text-lg font-semibold leading-tight">{formatCurrency(goal.currentValue)}</p>
              </div>
              <div className="rounded-lg border bg-secondary/30 p-3 sm:p-3.5 space-y-1">
                <p className="text-xs text-muted-foreground">{t('targetValue') || 'Objetivo'}</p>
                <p className="text-lg font-semibold leading-tight">{formatCurrency(goal.targetValue)}</p>
              </div>
              <div className="rounded-lg border bg-secondary/30 p-3 sm:p-3.5 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  {t('goalRemaining') || 'Faltam'}
                </p>
                <p className="text-lg font-semibold leading-tight">{formatCurrency(remaining)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('goalTimeline') || 'Evolução Temporal'}
              </h3>
              {loadingEntries ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <GoalTimelineChart entries={currentEntries} targetValue={goal.targetValue} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
