import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Expense } from '@/types';

interface ImportExpenseDialogProps {
  trigger: React.ReactNode;
  subcategoryId?: string;
  fetchExpenses: (subcategoryId: string) => Promise<Expense[]>;
  onImport: (expenseId: string) => Promise<void>;
}

export const ImportExpenseDialog = ({ trigger, subcategoryId, fetchExpenses, onImport }: ImportExpenseDialogProps) => {
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gastos Anteriores</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[320px] pr-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && expenses.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum gasto anterior encontrado</p>
          )}
          <div className="space-y-3 mt-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="border rounded-md p-3 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium">{expense.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.value.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={Boolean(importing)}
                  onClick={async () => {
                    try {
                      setImporting(expense.id);
                      await onImport(expense.id);
                      setImporting(null);
                      setOpen(false);
                    } catch (error) {
                      // Keep dialog open on error so user can try again
                      setImporting(null);
                    }
                  }}
                >
                  {importing === expense.id ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
