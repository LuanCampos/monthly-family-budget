import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { CATEGORIES, CategoryKey } from '@/types/budget';

interface ExpenseFormProps {
  onAdd: (title: string, category: CategoryKey, value: number) => void;
  disabled?: boolean;
}

export const ExpenseForm = ({ onAdd, disabled }: ExpenseFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>('custos-fixos');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const numericValue = parseFloat(value.replace(',', '.')) || 0;
    if (title.trim() && numericValue > 0) {
      onAdd(title.trim(), category, numericValue);
      setTitle('');
      setValue('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={disabled}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Gasto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aluguel"
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
  );
};
