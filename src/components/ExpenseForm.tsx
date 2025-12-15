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
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryKey, Subcategory } from '@/types/budget';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { ExpenseFormFields } from './ExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';

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
    isRecurring?: boolean;
    isPending?: boolean;
  };
  onAdd?: (title: string, category: CategoryKey, subcategoryId: string | undefined, value: number) => void;
  onUpdate?: (id: string, title: string, category: CategoryKey, subcategoryId: string | undefined, value: number, isPending?: boolean) => void;
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
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [value, setValue] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setSubcategoryId('');
    setValue('');
    setIsPending(false);
    setIsRecurring(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setSubcategoryId(initialData.subcategoryId || '');
      setValue(formatCurrencyInput(initialData.value));
      setIsPending(initialData.isPending || false);
      setIsRecurring(initialData.isRecurring || false);
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
      onUpdate(initialData.id, title.trim(), category, finalSubcategoryId, numericValue, isPending);
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
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 px-2.5 sm:h-9 sm:px-3 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('addExpense')}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? t('newExpense') : t('editExpense')}
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

          {mode === 'edit' && isRecurring && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border">
              <Checkbox
                id="isPending"
                checked={isPending}
                onCheckedChange={(checked) => setIsPending(checked === true)}
              />
              <label
                htmlFor="isPending"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('pendingPayment')}
              </label>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {mode === 'create' ? t('add') : t('saveChanges')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
