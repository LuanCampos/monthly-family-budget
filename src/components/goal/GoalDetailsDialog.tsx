import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalTimelineChart } from './GoalTimelineChart';
import { GoalMonthlySuggestion } from './GoalMonthlySuggestion';
import { BarChart3, TrendingUp, Lightbulb, Loader2, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Goal, GoalEntry } from '@/types';

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

export const GoalDetailsDialog = ({ goal, entries, onFetchEntries, calculateSuggestion }: GoalDetailsDialogProps) => {
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
        console.error('Failed to load goal entries', error);
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
        <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {goal.name}
            </DialogTitle>
            <DialogDescription>
              {t('goalDetailsDescription') || 'Acompanhe a evolução e receba sugestões mensais'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-3 mb-2.5">
            <div className="rounded-lg border bg-card p-3 sm:p-3.5 space-y-1">
              <p className="text-xs text-muted-foreground">{t('currentValue') || 'Valor Atual'}</p>
              <p className="text-lg font-semibold leading-tight">{formatCurrency(goal.currentValue)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3 sm:p-3.5 space-y-1">
              <p className="text-xs text-muted-foreground">{t('targetValue') || 'Objetivo'}</p>
              <p className="text-lg font-semibold leading-tight">{formatCurrency(goal.targetValue)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3 sm:p-3.5 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                {t('goalRemaining') || 'Faltam'}
              </p>
              <p className="text-lg font-semibold leading-tight">{formatCurrency(remaining)}</p>
            </div>
          </div>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span>{t('goalTimeline') || 'Evolução'}</span>
              </TabsTrigger>
              <TabsTrigger value="suggestion" className="gap-1.5">
                <Lightbulb className="h-4 w-4" />
                <span>{t('suggestion') || 'Sugestão'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-3 mt-3 min-h-[290px] pb-0.5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
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
            </TabsContent>

            <TabsContent value="suggestion" className="space-y-3 mt-3 min-h-[290px] pb-0.5">
              <GoalMonthlySuggestion goal={goal} calculateSuggestion={calculateSuggestion} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
