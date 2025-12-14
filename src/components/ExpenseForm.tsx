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
import { CategoryKey, Subcategory } from '@/types/budget';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { ExpenseFormFields } from './ExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';

type ExpenseFormMode = 'create' | 'edit';

interface ExpenseFormProps {
  mode: ExpenseFormMode;
  subcategories: Subcategory[];
  initialData?: {
    id: string;
    title: string;
    category: CategoryKey;
    subcategoryId?: string;
    value: number;
  };
  onAdd?: (title: string, category: CategoryKey, subcategoryId: string | undefined, value: number) => void;
  onUpdate?: (id: string, title: string, category: CategoryKey, subcategoryId: string | undefined, value: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const ExpenseForm = ({
  mode,
  subcategories,
  initialData,
  onAdd,
  onUpdate,
  onCancel,
  disabled,
}: ExpenseFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [value, setValue] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setSubcategoryId('');
    setValue('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setSubcategoryId(initialData.subcategoryId || '');
      setValue(formatCurrencyInput(initialData.value));
      setIsOpen(true);
    }
  }, [mode, initialData]);

  const handleSubmit = () => {
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return;

    const finalSubcategoryId = subcategoryId || undefined;

    if (mode === 'create' && onAdd) {
      onAdd(title.trim(), category, finalSubcategoryId, numericValue);
    }

    if (mode === 'edit' && onUpdate && initialData) {
      onUpdate(initialData.id, title.trim(), category, finalSubcategoryId, numericValue);
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
            subcategoryId={subcategoryId}
            value={value}
            subcategories={subcategories}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onSubcategoryChange={setSubcategoryId}
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
