import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryKey, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';
import { Plus, Equal, X } from 'lucide-react';

interface ExpenseFormFieldsProps {
  title: string;
  category: CategoryKey;
  subcategoryId: string;
  value: string;
  subcategories: Subcategory[];
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: CategoryKey) => void;
  onSubcategoryChange: (value: string) => void;
  onValueChange: (value: string) => void;
}

export const ExpenseFormFields = ({
  title,
  category,
  subcategoryId,
  value,
  subcategories,
  onTitleChange,
  onCategoryChange,
  onSubcategoryChange,
  onValueChange,
}: ExpenseFormFieldsProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [showAdder, setShowAdder] = useState(false);
  const [addValue, setAddValue] = useState('');
  
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryKey === category
  );

  const handleCategoryChange = (newCategory: CategoryKey) => {
    onCategoryChange(newCategory);
    onSubcategoryChange('');
  };

  const parseValue = (val: string): number => {
    if (!val) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const formatValue = (num: number): string => {
    if (num === 0) return '';
    return num.toFixed(2).replace('.', ',');
  };

  const handleSum = () => {
    const currentValue = parseValue(value);
    const valueToAdd = parseValue(addValue);
    const total = currentValue + valueToAdd;
    onValueChange(formatValue(total));
    setAddValue('');
    setShowAdder(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          {t('expenseTitle')}
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-10 bg-secondary/50 border-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('expenseCategory')}
          </Label>
          <Select
            value={category}
            onValueChange={(v) => handleCategoryChange(v as CategoryKey)}
          >
            <SelectTrigger className="h-10 bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.key} value={cat.key}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {t(cat.key as TranslationKey)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('expenseSubcategory')}
          </Label>
          <Select
            value={subcategoryId || 'none'}
            onValueChange={(v) => onSubcategoryChange(v === 'none' ? '' : v)}
          >
            <SelectTrigger className="h-10 bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="none">-</SelectItem>
              {filteredSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value" className="text-sm font-medium">
          {t('expenseValue')}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              id="value"
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) =>
                onValueChange(e.target.value.replace(/[^\d,]/g, ''))
              }
              className="h-10 pl-10 bg-secondary/50 border-border"
            />
          </div>
          {!showAdder && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowAdder(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {showAdder && (
          <div className="flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currencySymbol}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={addValue}
                onChange={(e) =>
                  setAddValue(e.target.value.replace(/[^\d,]/g, ''))
                }
                placeholder="0,00"
                className="h-10 pl-10 bg-secondary/50 border-border"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="default"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSum}
            >
              <Equal className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => {
                setShowAdder(false);
                setAddValue('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};