import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryKey, Expense } from '@/types/budget';
import { getCategoryByKey, DEFAULT_CATEGORY } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';
import { ExpenseFormFields } from './ExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';

type ViewMode = 'list' | 'add' | 'edit';

interface RecurringExpensesProps {
  expenses: Omit<Expense, 'id'>[];
  onAdd: (title: string, category: CategoryKey, value: number) => void;
  onUpdate: (index: number, title: string, category: CategoryKey, value: number) => void;
  onRemove: (index: number) => void;
}

export const RecurringExpenses = ({
  expenses,
  onAdd,
  onUpdate,
  onRemove,
}: RecurringExpensesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [value, setValue] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setValue('');
    setEditingIndex(null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setView('list');
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setView('add');
  };

  const openEdit = (index: number) => {
    const exp = expenses[index];
    if (!exp) return;

    setTitle(exp.title);
    setCategory(exp.category);
    setValue(formatCurrencyInput(exp.value));
    setEditingIndex(index);
    setView('edit');
  };

  const handleSubmit = () => {
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return;

    if (view === 'add') {
      onAdd(title.trim(), category, numericValue);
    }

    if (view === 'edit' && editingIndex !== null) {
      onUpdate(editingIndex, title.trim(), category, numericValue);
    }

    setView('list');
    resetForm();
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-border hover:bg-secondary"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Gastos Recorrentes ({expenses.length})
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsOpen(true);
        }}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {view === 'list'
                ? 'Gastos Recorrentes'
                : view === 'add'
                ? 'Novo Gasto Recorrente'
                : 'Editar Gasto Recorrente'}
            </DialogTitle>
          </DialogHeader>

          {view === 'list' && (
            <>
              <p className="text-sm text-muted-foreground">
                Estes gastos são adicionados automaticamente a cada novo mês.
              </p>

              <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum gasto recorrente cadastrado
                  </p>
                ) : (
                  expenses.map((exp, index) => {
                    const cat = getCategoryByKey(exp.category);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <p className="text-foreground font-medium">{exp.title}</p>
                            <p className="text-xs text-muted-foreground">{cat.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">
                            {formatCurrency(exp.value)}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Button
                onClick={openAdd}
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Recorrente
              </Button>
            </>
          )}

          {(view === 'add' || view === 'edit') && (
            <div className="mt-4">
              <ExpenseFormFields
                title={title}
                category={category}
                value={value}
                onTitleChange={setTitle}
                onCategoryChange={setCategory}
                onValueChange={(v) => setValue(sanitizeCurrencyInput(v))}
              />

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {view === 'add' ? 'Adicionar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => setView('list')}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
