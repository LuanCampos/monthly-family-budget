import { useState, useEffect } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { MonthSelector } from '@/components/MonthSelector';
import { IncomeInput } from '@/components/IncomeInput';
import { ExpenseChartContainer } from '@/components/ExpenseChartContainer';
import { CategoryLegend } from '@/components/CategoryLegend';
import { SummaryTable } from '@/components/SummaryTable';
import { GoalsPanel } from '@/components/GoalsPanel';
import { ExpenseForm } from '@/components/ExpenseForm';
import { RecurringExpenses } from '@/components/RecurringExpenses';
import { ExpenseList, FilterType } from '@/components/ExpenseList';
import { SubcategoryManager } from '@/components/SubcategoryManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, CategoryKey } from '@/types/budget';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    months,
    currentMonth,
    currentMonthId,
    recurringExpenses,
    subcategories,
    addMonth,
    selectMonth,
    updateIncome,
    addExpense,
    removeExpense,
    updateExpense,
    addRecurringExpense,
    removeRecurringExpense,
    updateRecurringExpense,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    getCategorySummary,
    getTotals,
    exportBudget,
    importBudget,
    removeMonth,
    categoryPercentages,
    updateGoals,
  } = useBudget();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [filter, setFilter] = useState<FilterType>(null);

  // Sync filter with activeCategory
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    if (newFilter?.type === 'category') {
      setActiveCategory(newFilter.value);
    } else if (newFilter === null) {
      setActiveCategory(null);
    }
  };

  const handleCategorySelect = (category: CategoryKey | null) => {
    setActiveCategory(category);
    if (category) {
      setFilter({ type: 'category', value: category });
    } else {
      setFilter(null);
    }
  };

  const categorySummary = getCategorySummary();
  const { totalSpent, totalBudget, usedPercentage } = getTotals();
  const hasExpenses = currentMonth ? currentMonth.expenses.length > 0 : false;

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleUpdateExpense = (
    id: string,
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number
  ) => {
    updateExpense(id, title, category, subcategoryId, value);
    setEditingExpense(null);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importBudget(file);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Orçamento doméstico
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Controlando o orçamento doméstico da familinha com base nas nossas metas.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              id="import-budget"
              className="hidden"
              onChange={handleImportFile}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-budget')?.click()}
            >
              <Upload className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Importar</span>
            </Button>

            <Button variant="outline" size="sm" onClick={exportBudget}>
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Exportar</span>
            </Button>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <MonthSelector
            months={months}
            currentMonth={currentMonth}
            onSelectMonth={selectMonth}
            onAddMonth={addMonth}
            onRemoveMonth={removeMonth}
          />
          <IncomeInput
            value={currentMonth?.income || 0}
            onChange={updateIncome}
            disabled={!currentMonthId}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChartContainer
                data={categorySummary.map(c => ({
                  key: c.key,
                  name: c.name,
                  spent: c.spent,
                  color: c.color,
                }))}
                hasExpenses={hasExpenses}
                expenses={currentMonth?.expenses || []}
                subcategories={subcategories}
                activeCategory={activeCategory}
                onSelectCategory={handleCategorySelect}
              />
              {!activeCategory && <CategoryLegend />}
            </CardContent>
          </Card>

          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryTable
                categories={categorySummary}
                totalSpent={totalSpent}
                totalBudget={totalBudget}
                usedPercentage={usedPercentage}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsPanel
                percentages={categoryPercentages}
                onEdit={updateGoals}
              />
            </CardContent>
          </Card>
        </div>

        {/* Expense List */}
        {currentMonthId && (
          <Card className="mt-6">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>Gastos do mês</CardTitle>
              <div className="flex flex-wrap gap-2">
                <SubcategoryManager
                  subcategories={subcategories}
                  onAdd={addSubcategory}
                  onUpdate={updateSubcategory}
                  onRemove={removeSubcategory}
                />
                <RecurringExpenses
                  expenses={recurringExpenses}
                  subcategories={subcategories}
                  onAdd={addRecurringExpense}
                  onUpdate={updateRecurringExpense}
                  onRemove={removeRecurringExpense}
                />
                <ExpenseForm
                  mode="create"
                  subcategories={subcategories}
                  onAdd={addExpense}
                  disabled={!currentMonthId}
                />
              </div>
            </CardHeader>

            <CardContent>
              <ExpenseList
                expenses={currentMonth?.expenses || []}
                subcategories={subcategories}
                onRemove={removeExpense}
                onEdit={handleEditExpense}
                filter={filter}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentMonthId && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">
              Comece adicionando um mês para gerenciar seu orçamento.
            </p>
            <p className="text-muted-foreground text-sm">
              Clique no botão + ao lado do seletor de mês.
            </p>
          </div>
        )}
      </div>

      {/* Expense Edit */}
      {editingExpense && (
        <ExpenseForm
          mode="edit"
          subcategories={subcategories}
          initialData={editingExpense}
          onUpdate={handleUpdateExpense}
          onCancel={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
};

export default Index;
