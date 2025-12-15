import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, CategoryKey, Subcategory, MONTH_NAMES } from '@/types/budget';

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
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryKey === category
  );

  const handleCategoryChange = (newCategory: CategoryKey) => {
    onCategoryChange(newCategory);
    onSubcategoryChange('');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          Título
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-secondary border-border text-foreground"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          Categoria
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
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          Sub-categoria (opcional)
        </label>
        <Select
          value={subcategoryId || 'none'}
          onValueChange={(v) => onSubcategoryChange(v === 'none' ? '' : v)}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="none">Nenhuma</SelectItem>
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
          Valor
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
          Dia do Vencimento (opcional)
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
            Prazo Determinado (Parcelado)
          </label>
        </div>

        {hasInstallments && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/30">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Número de Parcelas
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
                  Mês da 1ª Parcela
                </label>
                <Select
                  value={startMonth}
                  onValueChange={onStartMonthChange}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Ano da 1ª Parcela
                </label>
                <Select
                  value={startYear}
                  onValueChange={onStartYearChange}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
