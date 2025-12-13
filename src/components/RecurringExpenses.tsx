import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORIES,
  CategoryKey,
  formatCurrency,
  getCategoryByKey,
  Expense,
} from '@/types/budget';

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
  const [category, setCategory] = useState<CategoryKey>('custos-fixos');
  const [value, setValue] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory('custos-fixos');
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
    setValue(exp.value.toFixed(2).replace('.', ','));
    setEditingIndex(index);
    setView('edit');
  };

  const handleSubmit = () => {
    const numericValue = parseFloat(value.replace(',', '.')) || 0;
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
      {/* Trigger */}
      <Button
        variant="outline"
        className="border-border hover:bg-secondary"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Gastos Recorrentes ({expenses.length})
      </Button>

      {/* Dialog */}
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

          {/* LISTA */}
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

          {/* FORMULÁRIO */}
          {(view === 'add' || view === 'edit') && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Título
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Categoria
                </label>
                <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^\d,]/g, ''))}
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-2">
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
