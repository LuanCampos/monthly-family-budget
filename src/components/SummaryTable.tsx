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
    <div className="space-y-3">
      {/* Categories with progress bars */}
      {categories.map((cat) => {
        const category = getCategoryByKey(cat.key);
        const exceeded = cat.spent > cat.budget;
        const progressWidth = Math.min(cat.usedPercentage, 100);

        return (
          <div key={cat.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-foreground font-medium">
                  {t(cat.key as TranslationKey)}
                </span>
              </div>
              <div className="flex items-center text-xs">
                <span className={`tabular-nums font-medium ${exceeded ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(cat.spent)}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatCurrency(cat.budget)}
                </span>
                <span className={`tabular-nums ml-2 ${exceeded ? 'text-destructive' : 'text-muted-foreground'}`}>
                  ({formatPercentage(cat.usedPercentage)})
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
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
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('totalSpent')}</p>
          <p className={`text-lg font-bold tabular-nums ${totalSpent > totalBudget ? 'text-destructive' : 'text-foreground'}`}>
            {formatCurrency(totalSpent)}
          </p>
        </div>
        
        <div className="text-center space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('totalRemaining')}</p>
          <p className={`text-lg font-bold tabular-nums ${totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-success'}`}>
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>
        
        <div className="text-right space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('used')}</p>
          <p className={`text-lg font-bold tabular-nums ${usedPercentage > 100 ? 'text-destructive' : 'text-foreground'}`}>
            {formatPercentage(usedPercentage)}
          </p>
        </div>
      </div>
    </div>
  );
};
