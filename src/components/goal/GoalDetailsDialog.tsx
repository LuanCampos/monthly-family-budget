import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalTimelineChart } from './GoalTimelineChart';
import { GoalMonthlySuggestion } from './GoalMonthlySuggestion';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const [open, setOpen] = useState(false);
  const [currentEntries, setCurrentEntries] = useState<GoalEntry[]>(entries);

  const handleOpen = async () => {
    const freshEntries = await onFetchEntries();
    setCurrentEntries(freshEntries);
    setOpen(true);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <BarChart3 className="h-4 w-4 mr-1" />
        Detalhes
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{goal.name} - Análise</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
              <TabsTrigger value="suggestion">Sugestão</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Evolução Temporal</h3>
                <GoalTimelineChart entries={currentEntries} targetValue={goal.targetValue} />
              </div>
            </TabsContent>

            <TabsContent value="suggestion" className="space-y-4">
              <GoalMonthlySuggestion goal={goal} calculateSuggestion={calculateSuggestion} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
