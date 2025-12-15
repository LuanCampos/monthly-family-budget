import { useState } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { useLanguage } from '@/contexts/LanguageContext';
import { MonthSelector } from '@/components/MonthSelector';
import { IncomeInput } from '@/components/IncomeInput';
import { ExpenseChart } from '@/components/ExpenseChart';
import { SubcategoryChart } from '@/components/SubcategoryChart';
import { CategoryLegend } from '@/components/CategoryLegend';
import { SummaryTable } from '@/components/SummaryTable';
import { GoalsPanel } from '@/components/GoalsPanel';
import { ExpenseForm } from '@/components/ExpenseForm';
import { RecurringExpenses } from '@/components/RecurringExpenses';
import { ExpenseList } from '@/components/ExpenseList';
import { SubcategoryManager } from '@/components/SubcategoryManager';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, CategoryKey } from '@/types/budget';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Index = () => {
  const { t } = useLanguage();
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
    confirmPayment,
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
    value: number,
    isPending?: boolean
  ) => {
    updateExpense(id, title, category, subcategoryId, value, isPending);
    setEditingExpense(null);
  };

  const handleImportFile = (file: File) => {
    importBudget(file);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 truncate">
              {t('appTitle')}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base line-clamp-2">
              {t('appSubtitle')}
            </p>
          </div>

          <SettingsPanel onExport={exportBudget} onImport={handleImportFile} />
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
              <CardTitle>{t('expenses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart
                data={categorySummary.map(c => ({
                  key: c.key,
                  name: c.name,
                  spent: c.spent,
                  color: c.color,
                }))}
                hasExpenses={hasExpenses}
                onSelectCategory={setActiveCategory}
              />
              <CategoryLegend />
            </CardContent>
          </Card>

          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>{t('summary')}</CardTitle>
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
              <CardTitle>{t('goals')}</CardTitle>
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
              <CardTitle className="text-base sm:text-lg">{t('monthExpenses')}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
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
                onConfirmPayment={confirmPayment}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentMonthId && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">
              {t('emptyStateTitle')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('emptyStateSubtitle')}
            </p>
          </div>
        )}
      </div>

      {/* Subcategory Chart Modal */}
      <Dialog
        open={!!activeCategory}
        onOpenChange={(open) => {
          if (!open) setActiveCategory(null);
        }}
      >
        <DialogContent className="w-full max-w-3xl p-4 md:p-6 overflow-y-auto">
          {activeCategory && currentMonth && (
            <SubcategoryChart
              categoryKey={activeCategory}
              expenses={currentMonth.expenses}
              subcategories={subcategories}
              onBack={() => setActiveCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

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
