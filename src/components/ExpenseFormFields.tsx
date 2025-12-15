import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, CategoryKey, Subcategory } from '@/types/budget';
import { useLanguage } from '@/contexts/LanguageContext';
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
  
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryKey === category
  );

  const handleCategoryChange = (newCategory: CategoryKey) => {
    onCategoryChange(newCategory);
    // Reset subcategory when category changes
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
    </div>
  );
};
