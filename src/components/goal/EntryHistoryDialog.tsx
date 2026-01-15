/**
 * Entry History Dialog
 * 
 * Modal for viewing and managing goal entry history
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { List, Plus, Import } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EntryHistory } from './EntryHistory';
import { ImportExpenseDialog } from './ImportExpenseDialog';
import type { Goal, GoalEntry, Expense } from '@/types';

interface EntryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  entries: GoalEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: GoalEntry) => void;
  onDeleteEntry: (entry: GoalEntry) => void;
  onImportExpense: (expenseId: string) => Promise<void>;
  fetchHistoricalExpenses: (subcategoryId: string) => Promise<Expense[]>;
}

export const EntryHistoryDialog = ({
  open,
  onOpenChange,
  goal,
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onImportExpense,
  fetchHistoricalExpenses,
}: EntryHistoryDialogProps) => {
  const { t } = useLanguage();

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <List className="h-5 w-5 text-primary" />
            {t('entries') || 'Lançamentos'}
          </DialogTitle>
          {goal && (
            <p className="text-sm text-muted-foreground">
              {goal.name}
            </p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <EntryHistory 
            entries={entries} 
            onDelete={onDeleteEntry}
            onEdit={onEditEntry}
          />
        </div>

        {goal && (
          <div className="px-6 py-4 border-t border-border bg-secondary/30 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button size="sm" className="w-full sm:w-auto gap-1.5" onClick={onAddEntry}>
              <Plus className="h-4 w-4" />
              <span>{t('addEntry') || 'Lançamento'}</span>
            </Button>

            {goal.linkedSubcategoryId && (
              <ImportExpenseDialog
                trigger={
                  <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
                    <Import className="h-4 w-4" />
                    {t('importExpenses') || 'Importar gastos anteriores'}
                  </Button>
                }
                subcategoryId={goal.linkedSubcategoryId}
                fetchExpenses={fetchHistoricalExpenses}
                onImport={onImportExpense}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
