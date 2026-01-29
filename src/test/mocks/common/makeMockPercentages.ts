import { CategoryKey } from '@/types/budget';

export function makeMockPercentages(overrides: Partial<Record<CategoryKey, number>> = {}): Record<CategoryKey, number> {
  return {
    essenciais: 50,
    conforto: 20,
    metas: 10,
    prazeres: 10,
    liberdade: 5,
    conhecimento: 5,
    ...overrides,
  };
}
