import { CategoryKey, Expense, Subcategory } from '@/types/budget';
import { ExpenseChart } from './ExpenseChart';
import { SubcategoryChart } from './SubcategoryChart';

interface CategorySummary {
  key: CategoryKey;
  name: string;
  spent: number;
  color: string;
}

interface ExpenseChartContainerProps {
  data: CategorySummary[];
  hasExpenses: boolean;
  expenses: Expense[];
  subcategories: Subcategory[];
  activeCategory: CategoryKey | null;
  onSelectCategory: (category: CategoryKey | null) => void;
}

export const ExpenseChartContainer = ({
  data,
  hasExpenses,
  expenses,
  subcategories,
  activeCategory,
  onSelectCategory,
}: ExpenseChartContainerProps) => {
  if (activeCategory) {
    return (
      <SubcategoryChart
        categoryKey={activeCategory}
        expenses={expenses}
        subcategories={subcategories}
        onBack={() => onSelectCategory(null)}
      />
    );
  }

  return (
    <ExpenseChart
      data={data}
      hasExpenses={hasExpenses}
      onSelectCategory={onSelectCategory}
    />
  );
};
