import { Subcategory } from '@/types/budget';

export function makeMockSubcategories(): Subcategory[] {
  return [
    { id: 'sub1', name: 'Rent', categoryKey: 'essenciais' },
    { id: 'sub2', name: 'Groceries', categoryKey: 'essenciais' },
  ];
}