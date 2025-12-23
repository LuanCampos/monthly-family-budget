import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

export const CategoryLegend = () => {
  const { t } = useLanguage();

  return (
    <div className="mt-4">
      <h4 className="text-center font-semibold mb-3 text-foreground text-sm sm:text-base">{t('total')}</h4>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-foreground truncate">{t(cat.key as TranslationKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
