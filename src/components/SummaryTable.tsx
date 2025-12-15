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
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs sm:text-sm min-w-[360px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-2 sm:px-0 font-medium">
                {t('budget')}
              </th>
              <th className="text-right py-2 px-2 sm:px-0 font-medium">
                {t('amountSpent')}
              </th>
              <th className="text-right py-2 px-2 sm:px-0 font-medium hidden sm:table-cell">
                {t('shouldSpend')}
              </th>
              <th className="text-right py-2 px-2 sm:px-0 font-medium">
                {t('used')}
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => {
              const exceeded = cat.spent > cat.budget;

              return (
                <tr key={cat.key} className="border-b border-border/30">
                  <td className="py-2.5 px-2 sm:px-0 text-foreground font-medium">
                    {t(cat.key as TranslationKey)}
                  </td>

                  <td
                    className={`py-2.5 px-2 sm:px-0 text-right font-medium tabular-nums ${
                      exceeded ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(cat.spent)}
                  </td>

                  <td className="py-2.5 px-2 sm:px-0 text-right text-muted-foreground tabular-nums hidden sm:table-cell">
                    {formatCurrency(cat.budget)}
                  </td>

                  <td className="py-2.5 px-2 sm:px-0 text-right">
                    <span
                      className={`inline-flex items-center justify-center min-w-[48px] px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.usedPercentage >= 100
                          ? 'bg-destructive/20 text-destructive'
                          : cat.usedPercentage >= 80
                          ? 'bg-primary/20 text-primary'
                          : 'bg-success/20 text-success'
                      }`}
                    >
                      {formatPercentage(cat.usedPercentage)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-border">
        <div className="stat-card">
          <span
            className={`stat-value tabular-nums ${
              totalSpent > totalBudget ? 'text-destructive' : ''
            }`}
          >
            {formatCurrency(totalSpent)}
          </span>
          <span className="stat-label">{t('totalSpent')}</span>
        </div>

        <div className="stat-card">
          <span
            className={`stat-value tabular-nums ${
              totalBudget - totalSpent < 0 ? 'text-destructive' : ''
            }`}
          >
            {formatCurrency(totalBudget - totalSpent)}
          </span>
          <span className="stat-label">{t('totalRemaining')}</span>
        </div>

        <div className="stat-card">
          <span
            className={`stat-value tabular-nums ${
              usedPercentage >= 100 ? 'text-destructive' : 'text-success'
            }`}
          >
            {formatPercentage(usedPercentage)}
          </span>
          <span className="stat-label">{t('used')}</span>
        </div>
      </div>
    </div>
  );
};