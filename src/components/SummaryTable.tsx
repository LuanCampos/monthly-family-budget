import { CategoryKey } from '@/types/budget';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';
import { getCategoryByKey } from '@/constants/categories';

interface CategorySummary {
  key: CategoryKey;
  name: string;
  percentage: number;
  budget: number;
  spent: number;
  remaining: number;
  usedPercentage: number;
}

interface SummaryTableProps {
  categories: CategorySummary[];
  totalSpent: number;
  totalBudget: number;
  usedPercentage: number;
}

export const SummaryTable = ({
  categories,
  totalSpent,
  totalBudget,
  usedPercentage,
}: SummaryTableProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const category = getCategoryByKey(cat.key);
        const exceeded = cat.spent > cat.budget;
        const progressWidth = Math.min(cat.usedPercentage, 100);

        return (
          <div key={cat.key} className="space-y-1.5">
            {/* GRID ROW */}
            <div
              className="
                grid
                grid-cols-[2fr_1fr_1fr_1fr]
                items-center
                gap-x-2
                text-sm
              "
            >
              {/* Dot + Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium truncate">
                  {t(cat.key as TranslationKey)}
                </span>
              </div>
            
              {/* Spent */}
              <span
                className={`text-xs text-right tabular-nums ${
                  exceeded ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {formatCurrency(cat.spent)}
              </span>
            
              {/* Budget */}
              <span className="text-xs text-left tabular-nums text-muted-foreground whitespace-nowrap">
                / &nbsp;{formatCurrency(cat.budget)}
              </span>
            
              {/* Percentage */}
              <span
                className={`text-xs text-right tabular-nums font-medium ${
                  exceeded ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {formatPercentage(cat.usedPercentage)}
              </span>
            </div>

            {/* Progress bar (span ALL columns) */}
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressWidth}%`,
                  backgroundColor: exceeded
                    ? 'hsl(var(--destructive))'
                    : 'hsl(var(--primary) / 0.5)',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">
            {t('totalSpent')}
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              totalSpent > totalBudget
                ? 'text-destructive'
                : 'text-foreground'
            }`}
          >
            {formatCurrency(totalSpent)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {t('totalRemaining')}
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              totalBudget - totalSpent < 0
                ? 'text-destructive'
                : 'text-success'
            }`}
          >
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {t('used')}
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              usedPercentage > 100
                ? 'text-destructive'
                : 'text-foreground'
            }`}
          >
            {formatPercentage(usedPercentage)}
          </p>
        </div>
      </div>
    </div>
  );
};
