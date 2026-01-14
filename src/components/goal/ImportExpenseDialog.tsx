import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Expense } from '@/types';
import { Import, Loader2, Receipt, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ImportExpenseDialogProps {
  trigger: React.ReactNode;
  subcategoryId?: string;
  fetchExpenses: (subcategoryId: string) => Promise<Expense[]>;
  onImport: (expenseId: string) => Promise<void>;
}

export const ImportExpenseDialog = ({ trigger, subcategoryId, fetchExpenses, onImport }: ImportExpenseDialogProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !subcategoryId) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchExpenses(subcategoryId);
      setExpenses(data);
      setLoading(false);
    };
    load();
  }, [open, subcategoryId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="h-5 w-5 text-primary" />
            {t('historicalExpenses') || 'Gastos Anteriores'}
          </DialogTitle>
          <DialogDescription>
            {t('importExpensesDescription') || 'Importe despesas anteriores para vincular à meta'}
          </DialogDescription>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {!loading && expenses.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('noHistoricalExpenses') || 'Nenhum gasto anterior encontrado'}
              </p>
            </div>
          </div>
        )}
        
        {!loading && expenses.length > 0 && (
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3 pb-2">
              {expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-medium leading-tight break-words">{expense.title}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(expense.value)}
                      </p>
                      {expense.month && expense.year && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {String(expense.month).padStart(2, '0')}/{expense.year}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={Boolean(importing)}
                    onClick={async () => {
                      try {
                        setImporting(expense.id);
                        await onImport(expense.id);
                        // Refresh the list after import
                        if (subcategoryId) {
                          const data = await fetchExpenses(subcategoryId);
                          setExpenses(data);
                        }
                        setImporting(null);
                        // Don't close dialog - keep it open for more imports
                      } catch (_error) {
                        setImporting(null);
                      }
                    }}
                    className="gap-1.5 w-full sm:w-auto"
                  >
                    {importing === expense.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('importing') || 'Importando...'}
                      </>
                    ) : (
                      <>
                        <Import className="h-4 w-4" />
                        {t('import') || 'Importar'}
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
