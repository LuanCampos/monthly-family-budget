import { CategoryKey } from '@/types/budget';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-3 font-semibold whitespace-nowrap text-sm sm:text-base">
              {t('budget')}
            </th>
            <th className="text-right py-3 font-semibold whitespace-nowrap text-sm sm:text-base">
              {t('amountSpent')}
            </th>
            <th className="text-right py-3 font-semibold whitespace-nowrap text-sm sm:text-base">
              {t('shouldSpend')}
            </th>
            <th className="text-right py-3 font-semibold whitespace-nowrap text-sm sm:text-base">
              {t('used')}
            </th>
          </tr>
        </thead>

        <tbody>
          {categories.map((cat) => {
            const exceeded = cat.spent > cat.budget;

            return (
              <tr key={cat.key} className="border-b border-border/50">
                <td className="py-3 text-foreground font-medium whitespace-nowrap">
                  {t(cat.key as TranslationKey)}
                </td>

                <td
                  className={`py-3 text-right font-medium whitespace-nowrap tracking-tight sm:tracking-normal ${
                    exceeded ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {formatCurrency(cat.spent)}
                </td>

                <td className="py-3 text-right text-foreground whitespace-nowrap tracking-tight sm:tracking-normal">
                  {formatCurrency(cat.budget)}
                </td>

                <td
                  className={`py-3 text-right font-medium whitespace-nowrap tracking-tight sm:tracking-normal ${
                    cat.usedPercentage >= 100
                      ? 'text-destructive'
                      : 'text-success'
                  }`}
                >
                  {formatPercentage(cat.usedPercentage)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totais */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
        <div>
          <span
            className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${
              totalSpent > totalBudget
                ? 'text-destructive'
                : 'text-foreground'
            }`}
          >
            {formatCurrency(totalSpent)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {t('totalSpent')}
          </p>
        </div>

        <div>
          <span
            className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${
              totalBudget - totalSpent < 0
                ? 'text-destructive'
                : 'text-foreground'
            }`}
          >
            {formatCurrency(totalBudget - totalSpent)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {t('totalRemaining')}
          </p>
        </div>

        <div>
          <span
            className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${
              usedPercentage >= 100
                ? 'text-destructive'
                : 'text-success'
            }`}
          >
            {formatPercentage(usedPercentage)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {t('used')}
          </p>
        </div>
      </div>
    </div>
  );
};
