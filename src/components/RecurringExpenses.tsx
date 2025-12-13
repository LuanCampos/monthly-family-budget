import { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, CategoryKey, formatCurrency, getCategoryByKey, Expense } from '@/types/budget';

interface RecurringExpensesProps {
  expenses: Omit<Expense, 'id'>[];
  onAdd: (title: string, category: CategoryKey, value: number) => void;
  onRemove: (index: number) => void;
}

export const RecurringExpenses = ({ expenses, onAdd, onRemove }: RecurringExpensesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>('custos-fixos');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const numericValue = parseFloat(value.replace(',', '.')) || 0;
    if (title.trim() && numericValue > 0) {
      onAdd(title.trim(), category, numericValue);
      setTitle('');
      setValue('');
      setIsAddOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border hover:bg-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Gastos Recorrentes ({expenses.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Gastos Recorrentes</DialogTitle>
        </DialogHeader>
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
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <p className="text-foreground font-medium">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{cat.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-medium">
                      {formatCurrency(exp.value)}
                    </span>
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

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Recorrente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Gasto Recorrente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Título</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Internet"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Categoria</label>
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
                <label className="text-sm text-muted-foreground mb-1 block">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^\d,]/g, ''))}
                    placeholder="0,00"
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
