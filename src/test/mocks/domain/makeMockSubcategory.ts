import type { Subcategory, CategoryKey } from '@/types/budget';

export function makeMockSubcategory(overrides: Partial<Subcategory> = {}): Subcategory {
  return {
    id: 'subcat-1',
    name: 'Test Subcategory',
    categoryKey: 'essenciais' as CategoryKey,
    ...overrides,
  };
}
