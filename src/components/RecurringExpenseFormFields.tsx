import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YearSelector } from '@/components/ui/year-selector';
import { CATEGORIES, CategoryKey, Subcategory } from '@/types/budget';
import { useLanguage } from '@/contexts/LanguageContext';
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
  
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryKey === category
  );

  const handleCategoryChange = (newCategory: CategoryKey) => {
    onCategoryChange(newCategory);
    onSubcategoryChange('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {t('expenseTitle')}
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-secondary border-border text-foreground"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {t('expenseCategory')}
        </label>
        <Select
          value={category}
          onValueChange={(v) => handleCategoryChange(v as CategoryKey)}
        >
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
                  {t(cat.key as TranslationKey)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {t('expenseSubcategory')}
        </label>
        <Select
          value={subcategoryId || 'none'}
          onValueChange={(v) => onSubcategoryChange(v === 'none' ? '' : v)}
        >
          <SelectTrigger className="bg-secondary border-border">
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

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {t('expenseValue')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
          <Input
            type="text"
            value={value}
            onChange={(e) =>
              onValueChange(e.target.value.replace(/[^\d,]/g, ''))
            }
            className="pl-10 bg-secondary border-border text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {t('dueDay')}
        </label>
        <Input
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => onDueDayChange(e.target.value)}
          placeholder="Ex: 10"
          className="bg-secondary border-border text-foreground"
        />
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
          <div className="space-y-4 pl-6 border-l-2 border-primary/30">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {t('totalInstallments')}
              </label>
              <Input
                type="number"
                min="1"
                max="120"
                value={totalInstallments}
                onChange={(e) => onTotalInstallmentsChange(e.target.value)}
                placeholder="Ex: 12"
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {t('startMonth')}
                </label>
                <Select
                  value={startMonth}
                  onValueChange={onStartMonthChange}
                >
                  <SelectTrigger className="bg-secondary border-border">
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

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {t('startYear')}
                </label>
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
