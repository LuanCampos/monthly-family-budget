import { pt, TranslationKey } from './translations/pt';
import { en } from './translations/en';

export type Language = 'pt' | 'en';

export const languages: { code: Language; name: string }[] = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
];

export const translations: Record<Language, Record<TranslationKey, string>> = {
  pt,
  en,
};

export type { TranslationKey };
