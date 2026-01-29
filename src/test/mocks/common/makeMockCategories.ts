import { CategoryKey } from '@/types/budget';

export function makeMockCategories(overrides: Partial<Array<{ key: CategoryKey; name: string; percentage: number; budget: number; spent: number; remaining: number; usedPercentage: number }>> = []): Array<{ key: CategoryKey; name: string; percentage: number; budget: number; spent: number; remaining: number; usedPercentage: number }> {
  return [
    {
      key: 'essenciais',
      name: 'Essenciais',
      percentage: 50,
      budget: 1000,
      spent: 500,
      remaining: 500,
      usedPercentage: 50,
      ...(overrides[0] || {}),
    },
    {
      key: 'conforto',
      name: 'Conforto',
      percentage: 20,
      budget: 400,
      spent: 200,
      remaining: 200,
      usedPercentage: 50,
      ...(overrides[1] || {}),
    },
  ];
}
