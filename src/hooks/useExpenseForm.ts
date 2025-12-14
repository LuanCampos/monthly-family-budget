import { useState, useCallback } from 'react';
import { CategoryKey } from '@/types/budget';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';

interface ExpenseFormData {
  title: string;
  category: CategoryKey;
  value: number;
}

interface UseExpenseFormOptions {
  initialData?: ExpenseFormData;
  onSubmit: (data: ExpenseFormData) => void;
  onClose?: () => void;
}

export const useExpenseForm = ({ initialData, onSubmit, onClose }: UseExpenseFormOptions) => {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState<CategoryKey>(initialData?.category ?? DEFAULT_CATEGORY);
  const [value, setValue] = useState(
    initialData?.value ? formatCurrencyInput(initialData.value) : ''
  );

  const reset = useCallback(() => {
    setTitle('');
    setCategory(DEFAULT_CATEGORY);
    setValue('');
  }, []);

  const populateFromData = useCallback((data: ExpenseFormData) => {
    setTitle(data.title);
    setCategory(data.category);
    setValue(formatCurrencyInput(data.value));
  }, []);

  const handleValueChange = useCallback((newValue: string) => {
    setValue(sanitizeCurrencyInput(newValue));
  }, []);

  const handleSubmit = useCallback(() => {
    const numericValue = parseCurrencyInput(value);
    if (!title.trim() || numericValue <= 0) return false;

    onSubmit({
      title: title.trim(),
      category,
      value: numericValue,
    });

    reset();
    onClose?.();
    return true;
  }, [title, category, value, onSubmit, onClose, reset]);

  const isValid = title.trim().length > 0 && parseCurrencyInput(value) > 0;

  return {
    title,
    setTitle,
    category,
    setCategory,
    value,
    setValue: handleValueChange,
    reset,
    populateFromData,
    handleSubmit,
    isValid,
  };
};
