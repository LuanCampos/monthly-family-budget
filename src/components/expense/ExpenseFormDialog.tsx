import { useEffect, useState, useRef } from 'react';
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
import { CategoryKey, Subcategory } from '@/types';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { ExpenseFormFields, ExpenseFormFieldsRef } from './ExpenseFormFields';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/lib/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';

type ExpenseFormDialogMode = 'create' | 'edit';

interface ExpenseFormDialogProps {
  mode: ExpenseFormDialogMode;
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
  onAdd?: (title: string, category: CategoryKey, subcategoryId: string | undefined, value: number) => void | Promise<void>;
  onUpdate?: (id: string, title: string, category: CategoryKey, subcategoryId: string | undefined, value: number, isPending?: boolean) => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export const ExpenseFormDialog = ({
  mode,
  subcategories,
  initialData,
  onAdd,
  onUpdate,
  onCancel,
  disabled,
}: ExpenseFormDialogProps) => {
  const { t } = useLanguage();
  const formFieldsRef = useRef<ExpenseFormFieldsRef>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [value, setValue] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (isSaving) return;
    
    // Apply any pending sum before submitting
    const summedValue = formFieldsRef.current?.applyPendingSum();
    const valueToUse = summedValue ?? value;
    
    const numericValue = parseCurrencyInput(valueToUse);
    if (!title.trim() || numericValue <= 0) return;

    const finalSubcategoryId = subcategoryId || undefined;

    setIsSaving(true);
    try {
      if (mode === 'create' && onAdd) {
        await onAdd(title.trim(), category, finalSubcategoryId, numericValue);
      }

      if (mode === 'edit' && onUpdate && initialData) {
        await onUpdate(initialData.id, title.trim(), category, finalSubcategoryId, numericValue, isPending);
      }
    } finally {
      setIsSaving(false);
      // Close modal only after all async operations complete
      resetForm();
    }
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

      <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-5 w-5 text-primary" />
            {mode === 'create' ? t('newExpense') : t('editExpense')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <ExpenseFormFields
            ref={formFieldsRef}
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
        </div>

        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              if (mode === 'edit') onCancel?.();
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {mode === 'create' ? t('add') : t('saveChanges')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};