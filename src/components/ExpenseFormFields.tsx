import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryKey === category
  );

  const handleCategoryChange = (newCategory: CategoryKey) => {
    onCategoryChange(newCategory);
    onSubcategoryChange('');
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
        <div className="relative">
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
      </div>
    </div>
  );
};