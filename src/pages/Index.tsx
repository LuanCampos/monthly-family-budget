import { useEffect, useMemo, useState } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { MonthSelector } from '@/components/month';
import { IncomeInput, IncomeSourcesManager } from '@/components/income';
import { ExpenseChart, ExpenseForm, ExpenseList } from '@/components/expense';
import { SubcategoryChart, SubcategoryManager } from '@/components/subcategory';
import { CategoryLegend, SummaryTable, LimitsPanel, AnnualViewChart, OnlineStatusBar } from '@/components/common';
import { RecurringExpenses } from '@/components/recurring';
import { SettingsPanel } from '@/components/settings';
import { FamilySetup } from '@/components/family';
import type { SortType, SortDirection } from '@/components/expense';
import type { Expense, CategoryKey } from '@/types/budget';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieChart, Target, ListTodo, Wallet, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, Receipt, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Inner component that uses useBudget - will be remounted when family changes via key
const BudgetContent = () => {
  const { t } = useLanguage();
  const { currentFamilyId } = useFamily();
  
  const {
    months,
    currentMonth,
    currentMonthId,
    recurringExpenses,
    subcategories,
    loading: budgetLoading,
    addMonth,
    selectMonth,
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
    removeMonth,
    currentMonthLimits,
    updateMonthLimits,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  } = useBudget();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [sortType, setSortType] = useState<SortType>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAnnualView, setShowAnnualView] = useState(false);
  const [showIncomeSourcesModal, setShowIncomeSourcesModal] = useState(false);

  const sortStorageKey = useMemo(() => {
    const familyKey = currentFamilyId || 'no-family';
    return `month-expenses-sort:${familyKey}`;
  }, [currentFamilyId]);

  // Restore persisted sort preference (don't lose it on reload or remount)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(sortStorageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object') return;
      const obj = parsed as { sortType?: unknown; sortDirection?: unknown };

      const nextType = obj.sortType;
      const nextDir = obj.sortDirection;

      const isValidType =
        nextType === 'createdAt' || nextType === 'category' || nextType === 'value' || nextType === 'dueDate';
      const isValidDir = nextDir === 'asc' || nextDir === 'desc';

      if (isValidType) setSortType(nextType);
      if (isValidDir) setSortDirection(nextDir);
    } catch {
      // ignore malformed localStorage
    }
  }, [sortStorageKey]);

  // Persist current choice
  useEffect(() => {
    try {
      localStorage.setItem(sortStorageKey, JSON.stringify({ sortType, sortDirection }));
    } catch {
      // ignore quota / privacy modes
    }
  }, [sortStorageKey, sortType, sortDirection]);

  const categorySummary = getCategorySummary();
  const { totalSpent, totalBudget, usedPercentage } = getTotals();
  const hasExpenses = currentMonth ? currentMonth.expenses.length > 0 : false;

  const handleSortClick = (type: SortType) => {
    if (sortType === type) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      if (type === 'createdAt') {
        setSortDirection('desc');
      } else if (type === 'category') {
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

  // Show loading while budget data loads
  if (budgetLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show create first month UI when no months exist
  if (months.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {t('emptyStateTitle')}
            </h2>
            <p className="text-muted-foreground">
              {t('emptyStateSubtitle')}
            </p>
          </div>
          <MonthSelector
            months={months}
            currentMonth={null}
            onSelectMonth={selectMonth}
            onAddMonth={addMonth}
            showCreateButton
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-2 gap-2">
            {/* Logo + Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-shrink">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 self-center" />
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {t('appTitle')}
              </h1>
            </div>

            {/* Spacer to push month selector to right */}
            <div className="flex-1" />

            {/* Month Selector */}
            <div className="flex-shrink-0">
              <MonthSelector
                months={months}
                currentMonth={currentMonth}
                onSelectMonth={selectMonth}
                onAddMonth={addMonth}
              />
            </div>

            {/* Settings (single menu) */}
            <div className="flex-shrink-0">
              <SettingsPanel 
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
              <div className="dashboard-card-header flex items-center gap-2 sm:gap-4 justify-start">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="dashboard-card-title whitespace-nowrap">{t('monthlyIncome')}</span>
                </div>
                <IncomeInput
                  value={currentMonth?.income || 0}
                  onEditClick={() => setShowIncomeSourcesModal(true)}
                  disabled={!currentMonthId}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Expenses Chart Card */}
              <div className="dashboard-card lg:col-span-3">
                <div className="dashboard-card-header">
                  <div className="flex items-center gap-2 flex-1">
                    <PieChart className="h-4 w-4 text-primary" />
                    <span className="dashboard-card-title">{t('expenses')}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnnualView(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">{t('annualView')}</span>
                  </Button>
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
              <div className="dashboard-card lg:col-span-6">
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

              {/* Limits Card */}
              <div className="dashboard-card lg:col-span-3">
                <div className="dashboard-card-header">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="dashboard-card-title">{t('limits')}</span>
                  </div>
                </div>
                <div className="dashboard-card-content">
                  <LimitsPanel
                    percentages={currentMonthLimits}
                    onEdit={updateMonthLimits}
                  />
                </div>
              </div>
            </div>

            {/* Expense List Section */}
            <div className="dashboard-card">
              <div className="dashboard-card-header flex-wrap gap-2 xs:gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="dashboard-card-title">{t('monthExpenses')}</span>
                </div>
                <div className="action-btn-group justify-center xs:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-border hover:bg-secondary text-xs h-8 px-2 xs:px-2.5 sm:h-9 sm:px-3 sm:text-sm">
                        <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{t('sortBy')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover">
                      <DropdownMenuItem onClick={() => handleSortClick('createdAt')} className="flex items-center justify-between">
                        {t('sortCreatedAt')}
                        {sortType === 'createdAt' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
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
                  recurringExpenses={recurringExpenses}
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
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
              {t('emptyStateSubtitle')}
            </p>
            <MonthSelector
              months={months}
              currentMonth={currentMonth}
              onSelectMonth={selectMonth}
              onAddMonth={addMonth}
              showCreateButton
            />
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

      {/* Annual View Modal */}
      <Dialog open={showAnnualView} onOpenChange={setShowAnnualView}>
        <DialogContent className="w-full max-w-3xl p-4 md:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('annualViewTitle')} - {currentMonth?.year || new Date().getFullYear()}
            </DialogTitle>
          </DialogHeader>
          <AnnualViewChart
            months={months}
            currentYear={currentMonth?.year || new Date().getFullYear()}
          />
        </DialogContent>
      </Dialog>

      {/* Income Sources Manager */}
      <IncomeSourcesManager
        open={showIncomeSourcesModal}
        onOpenChange={setShowIncomeSourcesModal}
        incomeSources={currentMonth?.incomeSources || []}
        onAdd={addIncomeSource}
        onUpdate={updateIncomeSource}
        onDelete={deleteIncomeSource}
        totalIncome={currentMonth?.income || 0}
      />

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

      {/* Online Status Indicator */}
      <OnlineStatusBar />
    </div>
  );
};

// Main Index component - handles auth/family loading and provides key for remounting
const Index = () => {
  const { loading: authLoading } = useAuth();
  const { currentFamilyId, loading: familyLoading } = useFamily();

  // Show loading while checking auth/family
  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show family setup if no family selected
  if (!currentFamilyId) {
    return <FamilySetup />;
  }

  // Render BudgetContent with key - forces remount when family changes
  // This cleanly resets all state (including IndexedDB hooks) without a full page reload
  return <BudgetContent key={currentFamilyId} />;
};

export default Index;
