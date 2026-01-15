import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YearSelector } from '@/components/common';
import { CategoryKey, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';

const MONTH_KEYS = [
  'month-0', 'month-1', 'month-2', 'month-3', 'month-4', 'month-5',
  'month-6', 'month-7', 'month-8', 'month-9', 'month-10', 'month-11',
] as const;

interface RecurringExpenseFormFieldsProps {
  title: string;
  category: CategoryKey;
  subcategoryId: string;
  value: string;
  dueDay: string;
  hasInstallments: boolean;
  totalInstallments: string;
  startYear: string;
  startMonth: string;
  subcategories: Subcategory[];
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: CategoryKey) => void;
  onSubcategoryChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onDueDayChange: (value: string) => void;
  onHasInstallmentsChange: (value: boolean) => void;
  onTotalInstallmentsChange: (value: string) => void;
  onStartYearChange: (value: string) => void;
  onStartMonthChange: (value: string) => void;
}

export const RecurringExpenseFormFields = ({
  title,
  category,
  subcategoryId,
  value,
  dueDay,
  hasInstallments,
  totalInstallments,
  startYear,
  startMonth,
  subcategories,
  onTitleChange,
  onCategoryChange,
  onSubcategoryChange,
  onValueChange,
  onDueDayChange,
  onHasInstallmentsChange,
  onTotalInstallmentsChange,
  onStartYearChange,
  onStartMonthChange,
}: RecurringExpenseFormFieldsProps) => {
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

      <div className="grid grid-cols-2 gap-3">
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

        <div className="space-y-2">
          <Label htmlFor="dueDay" className="text-sm font-medium">
            {t('dueDay')}
          </Label>
          <Input
            id="dueDay"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => onDueDayChange(e.target.value)}
            placeholder="Ex: 10"
            className="h-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="hasInstallments"
            checked={hasInstallments}
            onCheckedChange={(checked) => onHasInstallmentsChange(checked === true)}
          />
          <label
            htmlFor="hasInstallments"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            {t('hasInstallments')}
          </label>
        </div>

        {hasInstallments && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/30">
            <div className="space-y-2">
              <Label htmlFor="totalInstallments" className="text-sm font-medium">
                {t('totalInstallments')}
              </Label>
              <Input
                id="totalInstallments"
                type="number"
                min="1"
                max="120"
                value={totalInstallments}
                onChange={(e) => onTotalInstallmentsChange(e.target.value)}
                placeholder="Ex: 12"
                className="h-10 bg-secondary/50 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('startMonth')}
                </Label>
                <Select
                  value={startMonth}
                  onValueChange={onStartMonthChange}
                >
                  <SelectTrigger className="h-10 bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {MONTH_KEYS.map((key, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {t(key as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('startYear')}
                </Label>
                <YearSelector
                  value={startYear}
                  onValueChange={onStartYearChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};