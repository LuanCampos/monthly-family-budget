import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, CategoryKey } from '@/types/budget';

interface ExpenseFormFieldsProps {
  title: string;
  category: CategoryKey;
  value: string;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: CategoryKey) => void;
  onValueChange: (value: string) => void;
}

export const ExpenseFormFields = ({
  title,
  category,
  value,
  onTitleChange,
  onCategoryChange,
  onValueChange,
}: ExpenseFormFieldsProps) => {
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
          onValueChange={(v) => onCategoryChange(v as CategoryKey)}
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
    </div>
  );
};
