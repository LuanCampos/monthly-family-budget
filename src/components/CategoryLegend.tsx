import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

export const CategoryLegend = () => {
  const { t } = useLanguage();

  return (
    <div className="mt-4">
      <h4 className="text-center font-semibold mb-3 text-foreground">{t('total')}</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-foreground truncate">{t(cat.key as TranslationKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
