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
import { ExpenseList, SortType, SortDirection } from '@/components/ExpenseList';
import { SubcategoryManager } from '@/components/SubcategoryManager';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Expense, CategoryKey } from '@/types/budget';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PieChart, Target, ListTodo, Wallet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    applyRecurringToCurrentMonth,
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
  const [sortType, setSortType] = useState<SortType>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categorySummary = getCategorySummary();
  const { totalSpent, totalBudget, usedPercentage } = getTotals();
  const hasExpenses = currentMonth ? currentMonth.expenses.length > 0 : false;

  const handleSortClick = (type: SortType) => {
    if (sortType === type) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      if (type === 'category') {
        setSortDirection('asc');
      } else if (type === 'value') {
        setSortDirection('desc');
      } else if (type === 'dueDate') {
        setSortDirection('asc');
      }
    }
  };

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
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-0 sm:h-16 gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
              <h1 className="text-sm sm:text-lg font-bold text-foreground leading-tight">
                {t('appTitle')}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <MonthSelector
                months={months}
                currentMonth={currentMonth}
                onSelectMonth={selectMonth}
                onAddMonth={addMonth}
              />
              <SettingsPanel 
                onExport={exportBudget} 
                onImport={handleImportFile}
                currentMonthLabel={currentMonth ? `${t(`month-${currentMonth.month - 1}` as any)} ${currentMonth.year}` : undefined}
                onDeleteMonth={currentMonth ? () => removeMonth(currentMonth.id) : undefined}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {currentMonthId ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Income Section */}
            <div className="dashboard-card">
              <div className="dashboard-card-content">
                <IncomeInput
                  value={currentMonth?.income || 0}
                  onChange={updateIncome}
                  disabled={!currentMonthId}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Expenses Chart Card */}
              <div className="dashboard-card lg:col-span-4">
                <div className="dashboard-card-header">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    <span className="dashboard-card-title">{t('expenses')}</span>
                  </div>
                </div>
                <div className="dashboard-card-content">
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
                  <div className="mt-4">
                    <CategoryLegend />
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="dashboard-card lg:col-span-5">
                <div className="dashboard-card-header">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-primary" />
                    <span className="dashboard-card-title">{t('summary')}</span>
                  </div>
                </div>
                <div className="dashboard-card-content">
                  <SummaryTable
                    categories={categorySummary}
                    totalSpent={totalSpent}
                    totalBudget={totalBudget}
                    usedPercentage={usedPercentage}
                  />
                </div>
              </div>

              {/* Goals Card */}
              <div className="dashboard-card lg:col-span-3">
                <div className="dashboard-card-header">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="dashboard-card-title">{t('goals')}</span>
                  </div>
                </div>
                <div className="dashboard-card-content">
                  <GoalsPanel
                    percentages={categoryPercentages}
                    onEdit={updateGoals}
                  />
                </div>
              </div>
            </div>

            {/* Expense List Section */}
            <div className="dashboard-card">
              <div className="dashboard-card-header flex-wrap gap-2 xs:gap-3">
                <span className="dashboard-card-title flex-1">{t('monthExpenses')}</span>
                <div className="action-btn-group justify-center xs:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t('sortBy')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover">
                      <DropdownMenuItem onClick={() => handleSortClick('category')} className="flex items-center justify-between">
                        {t('sortCategory')}
                        {sortType === 'category' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortClick('value')} className="flex items-center justify-between">
                        {t('sortValue')}
                        {sortType === 'value' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortClick('dueDate')} className="flex items-center justify-between">
                        {t('sortDueDate')}
                        {sortType === 'dueDate' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <SubcategoryManager
                    subcategories={subcategories}
                    onAdd={addSubcategory}
                    onUpdate={updateSubcategory}
                    onRemove={removeSubcategory}
                  />
                  <RecurringExpenses
                    expenses={recurringExpenses}
                    subcategories={subcategories}
                    currentMonthExpenses={currentMonth?.expenses || []}
                    onAdd={addRecurringExpense}
                    onUpdate={updateRecurringExpense}
                    onRemove={removeRecurringExpense}
                    onApply={applyRecurringToCurrentMonth}
                  />
                  <ExpenseForm
                    mode="create"
                    subcategories={subcategories}
                    onAdd={addExpense}
                    disabled={!currentMonthId}
                  />
                </div>
              </div>

              <div className="dashboard-card-content">
                <ExpenseList
                  expenses={currentMonth?.expenses || []}
                  subcategories={subcategories}
                  onRemove={removeExpense}
                  onEdit={handleEditExpense}
                  onConfirmPayment={confirmPayment}
                  sortType={sortType}
                  sortDirection={sortDirection}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {t('emptyStateTitle')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              {t('emptyStateSubtitle')}
            </p>
          </div>
        )}
      </main>

      {/* Subcategory Chart Modal */}
      <Dialog
        open={!!activeCategory}
        onOpenChange={(open) => {
          if (!open) setActiveCategory(null);
        }}
      >
        <DialogContent className="w-full max-w-md p-4 md:p-6 overflow-y-auto max-h-[90vh]">
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