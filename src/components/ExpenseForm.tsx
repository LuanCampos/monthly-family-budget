import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoryKey } from '@/types/budget';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { ExpenseFormFields } from './ExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';

type ExpenseFormMode = 'create' | 'edit';

interface ExpenseFormProps {
  mode: ExpenseFormMode;
  initialData?: {
    id: string;
    title: string;
    category: CategoryKey;
    value: number;
  };
  onAdd?: (title: string, category: CategoryKey, value: number) => void;
  onUpdate?: (id: string, title: string, category: CategoryKey, value: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const ExpenseForm = ({
  mode,
  initialData,
  onAdd,
  onUpdate,
  onCancel,
  disabled,
}: ExpenseFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [value, setValue] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setValue('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setValue(formatCurrencyInput(initialData.value));
      setIsOpen(true);
    }
  }, [mode, initialData]);

  const handleSubmit = () => {
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return;

    if (mode === 'create' && onAdd) {
      onAdd(title.trim(), category, numericValue);
    }

    if (mode === 'edit' && onUpdate && initialData) {
      onUpdate(initialData.id, title.trim(), category, numericValue);
    }

    resetForm();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          if (mode === 'edit') {
            onCancel?.();
          }
        } else {
          setIsOpen(true);
        }
      }}
    >
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button
            disabled={disabled}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Gasto
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? 'Novo Gasto' : 'Editar Gasto'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ExpenseFormFields
            title={title}
            category={category}
            value={value}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onValueChange={(v) => setValue(sanitizeCurrencyInput(v))}
          />

          <Button
            onClick={handleSubmit}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {mode === 'create' ? 'Adicionar' : 'Salvar alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
